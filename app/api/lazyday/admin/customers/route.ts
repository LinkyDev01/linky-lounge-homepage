import { NextRequest, NextResponse } from "next/server"
import { adminWho } from "@/lib/admin-session"
import { listCustomers, getCustomer } from "@/lib/customers"

/**
 * 고객 레코드 API (2026-09-02, 고객관리 대시보드 CRM-1).
 *   GET /api/lazyday/admin/customers?q=&limit=      목록 (최근 활동순)
 *   GET /api/lazyday/admin/customers?key=<전화|u:uuid> 상세 (타임라인·주문·접수)
 *
 * 인증은 다른 관리 라우트와 같은 관리자 서명 토큰(lib/admin-session) — who 는 소셜 로그인 이메일.
 * 응답에 개인정보가 담기므로 캐시 금지. 단계의 정본은 시트 — 응답의 `origin` 이 그 사실을 실어 화면이 밝힌다.
 */
/** 관리자 게이트 — 서명 토큰 검증 (lib/admin-session). 옛 시크릿-원문 쿠키는 통과하지 못한다 */
const isAuthorized = (req: NextRequest) => adminWho(req).then(Boolean)

export async function GET(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" }
  if (!(await isAuthorized(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
  const sp = req.nextUrl.searchParams
  const key = sp.get("key")
  const origin = "단계의 정본은 구글 시트 — 여기 값은 DB 와 스윕이 실어 온 시트 값에서 읽어 파생한 것"

  if (key) {
    const r = await getCustomer(key)
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.error === "ledger disabled" ? 503 : 502, headers })
    if (!r.customer) return NextResponse.json({ ok: false, error: "not found" }, { status: 404, headers })
    return NextResponse.json({ ok: true, origin, customer: r.customer }, { headers })
  }

  const limit = Math.min(Math.max(Number(sp.get("limit") || 200), 1), 1000)
  const r = await listCustomers({ q: sp.get("q") ?? undefined, limit })
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.error === "ledger disabled" ? 503 : 502, headers })
  return NextResponse.json({ ok: true, origin, count: r.customers.length, customers: r.customers }, { headers })
}
