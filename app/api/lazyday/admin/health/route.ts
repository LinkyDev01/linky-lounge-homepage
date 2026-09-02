import { NextRequest, NextResponse } from "next/server"
import { adminWho } from "@/lib/admin-session"
import { supabaseAdmin } from "@/lib/supabase-server"

/**
 * 운영 상태 진단 (2026-08-06) — /lazyday/admin/status 에서 호출.
 * 신청·인터뷰 흐름이 지금 정상인지 실제로 찔러 보고 결과를 돌려준다.
 * (과거 로그 저장소가 아니라 "지금 문제 있나"를 즉답하는 용도)
 */

const GAS_URL = process.env.INTERVIEW_GAS_URL
const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim()

/** 관리자 게이트 — 서명 토큰 검증 (lib/admin-session). 옛 시크릿-원문 쿠키는 통과하지 못한다 */
const isAuthorized = (req: NextRequest) => adminWho(req).then(Boolean)

type Check = {
  key: string
  label: string
  ok: boolean
  detail: string
  ms?: number
  hint?: string
}

async function timed<T>(fn: () => Promise<T>): Promise<[T | null, number, string | null]> {
  const t0 = Date.now()
  try {
    const v = await fn()
    return [v, Date.now() - t0, null]
  } catch (err) {
    return [null, Date.now() - t0, err instanceof Error ? err.message : "알 수 없는 오류"]
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const checks: Check[] = []

  // 0) 환경변수
  checks.push({
    key: "env",
    label: "환경변수 설정",
    ok: !!GAS_URL && !!ADMIN_SECRET,
    detail: `GAS 주소 ${GAS_URL ? "설정됨" : "없음"} · 관리자 시크릿 ${ADMIN_SECRET ? "설정됨" : "없음"}`,
    hint: !GAS_URL || !ADMIN_SECRET ? "Vercel 환경변수(INTERVIEW_GAS_URL / ADMIN_SECRET)를 확인하세요." : undefined,
  })

  // 0.5) 주문 원장 (Supabase, 2026-08-18) — 환경변수가 살아 있고 DB 에 닿는지.
  //      원장은 부가 기능이라 여기 실패해도 결제·신청은 정상 (ok:false 는 "기록만 꺼짐").
  const sb = supabaseAdmin()
  if (!sb) {
    checks.push({
      key: "ledger",
      label: "주문 원장 (Supabase)",
      ok: false,
      detail: "환경변수 미설정 — 원장 꺼짐 (결제·신청은 정상 동작)",
      hint: "Vercel 환경변수 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 넣고 재배포하세요 (supabase/README.md §3).",
    })
  } else {
    const [led, ledMs, ledErr] = await timed(async () => {
      const { count, error } = await sb
        .from("orders")
        .select("*", { count: "exact", head: true })
      if (error) throw new Error(error.message)
      return count ?? 0
    })
    // ⚠ 미제출 = 모임 항목이 있는 주문만 (굿즈만 산 주문은 신청서 단계가 원래 없다)
    const [unsub] = led === null ? [null] : await timed(async () => {
      const { count, error } = await sb
        .from("orders")
        .select("*, order_items!inner(kind)", { count: "exact", head: true })
        .eq("order_items.kind", "meeting")
        .is("application_submitted_at", null)
      if (error) throw new Error(error.message)
      return count ?? 0
    })
    checks.push({
      key: "ledger",
      label: "주문 원장 (Supabase)",
      ok: led !== null,
      ms: ledMs,
      detail:
        led !== null
          ? `정상 · 기록된 주문 ${led}건${(unsub ?? 0) > 0 ? ` · 신청서 미제출 ${unsub}건 (구제 대상)` : ""}`
          : `연결 실패 — ${ledErr} (결제·신청은 정상 동작)`,
      hint:
        led === null
          ? "SUPABASE_URL 이 lazyday-prod 프로젝트를 가리키는지, service_role 키가 맞는지 확인하세요."
          : undefined,
    })
  }

  if (!GAS_URL) return NextResponse.json({ checkedAt: new Date().toISOString(), checks })

  // 1) 공개 조회 — 신청자 화면(예약 슬롯)이 쓰는 경로.
  //    구글 스크립트는 유휴 상태였다면 첫 호출이 매우 느리다(실측 80초). 한 번 타임아웃되면
  //    그 사이 깨어나므로 재조회해 본다 — 이때 성공하면 '장애'가 아니라 '콜드 스타트'다.
  let [pub, pubMs, pubErr] = await timed(async () => {
    const res = await fetch(GAS_URL, { redirect: "follow", signal: AbortSignal.timeout(20_000) })
    const text = await res.text()
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (!text.trim().startsWith("{")) throw new Error("JSON이 아닌 응답(HTML) — 스크립트 오류 페이지")
    return JSON.parse(text) as { bookedSlots?: unknown[] }
  })
  let coldStart = false
  if (!pub) {
    coldStart = true
    const retry = await timed(async () => {
      const res = await fetch(GAS_URL, { redirect: "follow", signal: AbortSignal.timeout(20_000) })
      const text = await res.text()
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!text.trim().startsWith("{")) throw new Error("JSON이 아닌 응답(HTML)")
      return JSON.parse(text) as { bookedSlots?: unknown[] }
    })
    pub = retry[0]
    pubMs = retry[1]
    pubErr = retry[2]
  }
  checks.push({
    key: "gas_public",
    label: "예약 슬롯 조회 (신청자 화면)",
    ok: !!pub,
    ms: pubMs,
    detail: pub
      ? coldStart
        ? `정상 · 등록된 일정 ${pub.bookedSlots?.length ?? 0}건 (첫 호출은 응답 없어 재시도함)`
        : `정상 · 등록된 일정 ${pub.bookedSlots?.length ?? 0}건`
      : `실패 — ${pubErr}`,
    hint: !pub
      ? "두 번 연속 응답이 없습니다. 구글 스크립트 배포 상태(액세스 '모든 사용자')를 확인하세요."
      : coldStart || pubMs > 10_000
      ? "구글 스크립트가 잠들어 있다가 깨어난 것입니다. 신청자도 이때는 예약 화면이 느릴 수 있어요(정상)."
      : undefined,
  })

  // 2) 관리자 조회 — 차단 관리가 쓰는 경로 (토큰 일치 여부까지 판정)
  const adminUrl = new URL(GAS_URL)
  adminUrl.searchParams.set("adminToken", ADMIN_SECRET!)
  const [adm, admMs, admErr] = await timed(async () => {
    const res = await fetch(adminUrl.toString(), { redirect: "follow", signal: AbortSignal.timeout(20_000) })
    const text = await res.text()
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (!text.trim().startsWith("{")) throw new Error("JSON이 아닌 응답(HTML)")
    return JSON.parse(text) as { bookedSlots?: Array<{ id?: string; title?: string }> }
  })
  const slots = adm?.bookedSlots ?? []
  const tokenOk = slots.length === 0 ? !!adm : !!slots[0]?.id
  checks.push({
    key: "gas_admin",
    label: "관리자 인증 (차단 시간 관리)",
    ok: !!adm && tokenOk,
    ms: admMs,
    detail: !adm
      ? `실패 — ${admErr}`
      : tokenOk
      ? `정상 · 차단 ${slots.filter((s) => String(s.title ?? "").startsWith("[BLOCK]")).length}건 / 인터뷰 ${slots.filter((s) => !String(s.title ?? "").startsWith("[BLOCK]")).length}건`
      : "토큰 불일치 — 일정이 오지만 제목·식별자가 없습니다",
    hint:
      adm && !tokenOk
        ? "구글 스크립트 속성 ADMIN_TOKEN 과 Vercel ADMIN_SECRET 값이 같은지 확인하세요."
        : undefined,
  })

  return NextResponse.json({ checkedAt: new Date().toISOString(), checks })
}
