import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin, isLedgerEnabled } from "@/lib/supabase-server"

/**
 * 시트 '진행 상태' → DB 읽기 거울 (2026-09-02, 고객관리 대시보드 CRM-2).
 *
 * GAS `syncProgressToDb()` 가 신청현황 시트의 **sid 가 있는 전 행**을 매시 보낸다:
 *   { rows: [{ sid, progress, interviewStatus, interviewType }] }
 * 여기서는 sid 로 행을 찾아 원문 3종 + `status`(번역) + `sheet_synced_at` 을 갱신한다.
 * **값이 같으면 건드리지 않는다** — 매시 전 행이 오므로 무의미한 update 로 updated_at 을
 * 흔들지 않기 위해서다.
 *
 * ⚠ 정본은 시트다 — 이 라우트는 시트를 비출 뿐 관리 화면의 쓰기 경로가 아니다(P5 게이트).
 * ⚠ 인증은 backfill 과 같은 **역방향 토큰**(헤더 `X-Backfill-Token`). 부르는 쪽이 Apps Script 서버다.
 * ⚠ 원장이 꺼져 있으면 503 — 200 을 주면 GAS 가 성공으로 보고 지나간다(backfill 과 같은 규율).
 */

const TOKEN = process.env.BACKFILL_TOKEN?.trim()
function tokenOk(got: string | null) {
  if (!TOKEN || !got) return false
  const a = Buffer.from(TOKEN), b = Buffer.from(got)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** 시트 값 → status. 집합은 GAS PROGRESS_OPTIONS 와 같다. 빈 값은 '아직 안 정함' — status 를 건드리지 않는다 */
const STATUS_OF: Record<string, string> = { "미진행": "received", "미결제": "unpaid", "결제완료": "paid", "환불": "refunded", "탈락": "rejected" }

type Row = { sid?: unknown; progress?: unknown; interviewStatus?: unknown; interviewType?: unknown }
const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

export async function POST(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ success: false, error: "not configured" }, { status: 503 })
  if (!tokenOk(req.headers.get("x-backfill-token"))) return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 })
  if (!isLedgerEnabled()) return NextResponse.json({ success: false, error: "ledger disabled" }, { status: 503 })
  const sb = supabaseAdmin()!

  const body = await req.json().catch(() => null)
  const rows: Row[] = Array.isArray((body as { rows?: unknown })?.rows) ? (body as { rows: Row[] }).rows : []
  if (!rows.length) return NextResponse.json({ success: true, received: 0, updated: 0, unchanged: 0, missing: 0 })
  if (rows.length > 500) return NextResponse.json({ success: false, error: "too many rows" }, { status: 413 })

  const bySid = new Map<string, { progress: string | null; ivStatus: string | null; ivType: string | null }>()
  for (const r of rows) {
    const sid = s(r.sid)
    if (!sid) continue
    bySid.set(sid, { progress: s(r.progress), ivStatus: s(r.interviewStatus), ivType: s(r.interviewType) })
  }
  const sids = [...bySid.keys()]
  const { data: existing, error } = await sb
    .from("applications")
    .select("id, sid, status, sheet_progress, sheet_interview_status, sheet_interview_type")
    .in("sid", sids)
  if (error) {
    console.error("[sync-status] 조회 실패", error.message)
    return NextResponse.json({ success: false, error: "query failed" }, { status: 502 })
  }

  let updated = 0, unchanged = 0
  const seen = new Set<string>()
  for (const row of existing ?? []) {
    if (!row.sid) continue
    seen.add(row.sid)
    const v = bySid.get(row.sid)!
    const nextStatus = v.progress && STATUS_OF[v.progress] ? STATUS_OF[v.progress] : row.status
    const same = row.sheet_progress === v.progress && row.sheet_interview_status === v.ivStatus
      && row.sheet_interview_type === v.ivType && row.status === nextStatus
    if (same) { unchanged++; continue }
    const { error: updErr } = await sb
      .from("applications")
      .update({
        sheet_progress: v.progress, sheet_interview_status: v.ivStatus, sheet_interview_type: v.ivType,
        status: nextStatus, sheet_synced_at: new Date().toISOString(),
      })
      .eq("id", row.id)
    if (updErr) console.error("[sync-status] 갱신 실패", row.id, updErr.message)
    else updated++
  }
  const missing = sids.length - seen.size // 시트엔 있는데 DB 에 없는 sid — backfill 스윕이 다음에 채운다
  // ⚠ 응답에 개인정보를 담지 않는다 — 건수까지만 (GAS Logger 에 그대로 찍힌다)
  return NextResponse.json({ success: true, received: rows.length, updated, unchanged, missing })
}
