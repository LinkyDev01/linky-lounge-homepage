import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { recordApplication, isLedgerEnabled, type ApplicationKind } from "@/lib/applications"

/**
 * 결손 0 보정 엔드포인트 (2026-09-01, 계획서 P2.5).
 *
 * GAS 의 `sweepApplicationsToDb()` 가 시트를 훑어 **아직 DB 에 없는 접수**를 여기로 민다.
 * 접수마다 시트와 DB 가 같은 sid 를 공유하므로, 이 루프가 돌면
 * **"시트에 있으면 DB 에도 반드시 있다"** 가 성립한다.
 *
 * ⚠ 이 루프가 없애는 것은 **'GAS 성공 + DB 실패'** 뿐이다. GAS 자체가 실패한 접수는
 *   시트에도 없어 여기서 살릴 수 없다 — 그 경로는 라우트가 DB 에 직접 남긴다(P2).
 *
 * **인증은 역방향 전용 토큰**이다. 기존 ADMIN_TOKEN 계약은 '우리 사이트 → GAS' 한
 * 방향뿐이고 그 두 값이 불일치해 사고가 난 적이 있다 — 섞지 않는다.
 * ⚠ 쿠키가 아니라 헤더다: 부르는 쪽이 브라우저가 아니라 Apps Script 서버다.
 */

const TOKEN = process.env.BACKFILL_TOKEN?.trim()

/** 길이·내용 노출을 줄이기 위한 상수시간 비교 */
function tokenOk(got: string | null) {
  if (!TOKEN || !got) return false
  const a = Buffer.from(TOKEN)
  const b = Buffer.from(got)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** 스윕이 보낼 수 있는 kind — 후기는 별도 GAS 프로젝트라 스윕 범위 밖이다 */
const SWEEPABLE: ApplicationKind[] = [
  "bookclub", "notify", "coffeebar", "oneday", "interview_phone", "interview_written",
]

/** 시트 한글 헤더 → 라우트가 쓰는 정규 필드명.
 *  ⚠ 번역하지 않으면 `retention()`·`marketing_consent_at` 이 값을 못 찾아
 *    보정된 행만 보유기간·동의 근거가 통째로 달라진다 (원본 접수와 갈린다). */
function normalizeSheetPayload(p: Record<string, unknown>) {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = p[k]
      if (typeof v === "string" && v.trim()) return v.trim()
    }
    return ""
  }
  return {
    name: pick("이름"),
    phone: pick("전화번호", "연락처"),
    meetingSlug: pick("모임 slug"),
    orderId: pick("주문번호"),
    marketingConsent: pick("마케팅 동의"),
    consentAt: pick("동의 시각"),
    trafficSrc: pick("유입 출처"),
    submittedAt: pick("신청일자", "제출일시", "예약일시"),
  }
}

type SweepRow = {
  sid?: unknown
  kind?: unknown
  name?: unknown
  phone?: unknown
  payload?: unknown
}

export async function POST(req: NextRequest) {
  if (!TOKEN) {
    // 토큰 미설정이면 열어두지 않는다 — 이 라우트는 개인정보를 쓴다
    console.error("[backfill] BACKFILL_TOKEN 미설정 — 거부")
    return NextResponse.json({ success: false, error: "not configured" }, { status: 503 })
  }
  if (!tokenOk(req.headers.get("x-backfill-token"))) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 })
  }

  // ⚠ 원장이 꺼져 있으면(Supabase env 미설정) 성공을 돌려주면 안 된다.
  //   recordApplication 은 그 경우 `{ok:true, skipped:"disabled"}` 로 **조용히 성공**한다 —
  //   그대로 200 을 주면 **아무것도 안 써졌는데** GAS 가 그 행들에 '보정됨'을 찍고
  //   다시는 보내지 않는다. 보정이 통째로, 그것도 조용히 유실된다.
  //   실패로 알려 다음 실행에서 다시 잡히게 한다.
  if (!isLedgerEnabled()) {
    console.error("[backfill] 원장 미설정(SUPABASE_URL/SERVICE_ROLE_KEY) — 거부")
    return NextResponse.json({ success: false, error: "ledger disabled" }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const rows: SweepRow[] = Array.isArray((body as { rows?: unknown })?.rows)
    ? ((body as { rows: SweepRow[] }).rows)
    : []
  if (!rows.length) return NextResponse.json({ success: true, received: 0, upserted: 0, skipped: 0 })

  // 한 번에 밀어 넣을 수 있는 양을 제한한다 — GAS 배치는 50건이다
  if (rows.length > 200) {
    return NextResponse.json({ success: false, error: "too many rows" }, { status: 413 })
  }

  let upserted = 0
  let skipped = 0
  for (const r of rows) {
    const sid = typeof r.sid === "string" ? r.sid.trim() : ""
    const kind = typeof r.kind === "string" ? (r.kind as ApplicationKind) : null
    // sid 없는 구행은 건너뛴다 — 멱등 키가 없으면 스윕이 돌 때마다 행이 늘어난다
    if (!sid || !kind || !SWEEPABLE.includes(kind)) { skipped++; continue }

    const sheet = (r.payload && typeof r.payload === "object" ? r.payload : {}) as Record<string, unknown>
    const norm = normalizeSheetPayload(sheet)
    // GAS 가 따로 실어 보낸 이름·전화가 있으면 그쪽이 우선 (헤더 이름이 탭마다 다르다)
    if (typeof r.name === "string" && r.name.trim()) norm.name = r.name.trim()
    if (typeof r.phone === "string" && r.phone.trim()) norm.phone = r.phone.trim()

    const res = await recordApplication({
      kind,
      // 원문(한글 헤더)도 함께 남긴다 — 대조할 때 시트 그대로를 볼 수 있어야 한다
      body: { ...sheet, ...norm },
      sid,
      payloadSrc: "sheet",
      submittedAt: norm.submittedAt || null,
    })
    if (res.ok) {
      // skipped:"duplicate" 도 성공이다 — 이미 있다는 뜻이라 보정이 끝난 상태다.
      // (skipped:"disabled" 는 위 게이트에서 걸러져 여기 오지 않는다)
      upserted++
    } else {
      skipped++
      console.error(`[backfill] 기록 실패 (${kind}/${sid}):`, res.error)
    }
  }

  // ⚠ 응답에 개인정보를 담지 않는다 — 건수까지만 (GAS Logger 에 그대로 찍힌다)
  return NextResponse.json({ success: true, received: rows.length, upserted, skipped })
}
