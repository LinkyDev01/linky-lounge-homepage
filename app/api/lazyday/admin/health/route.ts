import { NextRequest, NextResponse } from "next/server"

/**
 * 운영 상태 진단 (2026-08-06) — /lazyday/admin/status 에서 호출.
 * 신청·인터뷰 흐름이 지금 정상인지 실제로 찔러 보고 결과를 돌려준다.
 * (과거 로그 저장소가 아니라 "지금 문제 있나"를 즉답하는 용도)
 */

const GAS_URL = process.env.INTERVIEW_GAS_URL
const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim()

function isAuthorized(req: NextRequest) {
  const cookie = req.cookies.get("lazyday_admin")?.value
  return ADMIN_SECRET && cookie === ADMIN_SECRET
}

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
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const checks: Check[] = []

  // 0) 환경변수
  checks.push({
    key: "env",
    label: "환경변수 설정",
    ok: !!GAS_URL && !!ADMIN_SECRET,
    detail: `GAS 주소 ${GAS_URL ? "설정됨" : "없음"} · 관리자 시크릿 ${ADMIN_SECRET ? "설정됨" : "없음"}`,
    hint: !GAS_URL || !ADMIN_SECRET ? "Vercel 환경변수(INTERVIEW_GAS_URL / ADMIN_SECRET)를 확인하세요." : undefined,
  })

  if (!GAS_URL) return NextResponse.json({ checkedAt: new Date().toISOString(), checks })

  // 1) 공개 조회 — 신청자 화면(예약 슬롯)이 쓰는 경로
  const [pub, pubMs, pubErr] = await timed(async () => {
    const res = await fetch(GAS_URL, { redirect: "follow", signal: AbortSignal.timeout(20_000) })
    const text = await res.text()
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (!text.trim().startsWith("{")) throw new Error("JSON이 아닌 응답(HTML) — 스크립트 오류 페이지")
    return JSON.parse(text) as { bookedSlots?: unknown[] }
  })
  checks.push({
    key: "gas_public",
    label: "예약 슬롯 조회 (신청자 화면)",
    ok: !!pub,
    ms: pubMs,
    detail: pub ? `정상 · 등록된 일정 ${pub.bookedSlots?.length ?? 0}건` : `실패 — ${pubErr}`,
    hint: pubMs > 10_000 ? "응답이 10초를 넘었습니다. 구글 스크립트가 깨어나는 중일 수 있어요(첫 요청은 느립니다)." : undefined,
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
