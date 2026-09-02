import { NextRequest, NextResponse } from "next/server"
import { buildToday } from "@/lib/admin-today"

/**
 * 오늘 할 일 (2026-09-02, 대시보드 CRM-4) — `GET /api/lazyday/admin/today`.
 * 고객 레코드(세 원장 파생)에서 8종을 읽어 파생한다. 쓰지 않는다. 다른 관리 라우트와 같은 쿠키 인증.
 */
const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim()
const isAuthorized = (req: NextRequest) => Boolean(ADMIN_SECRET) && req.cookies.get("lazyday_admin")?.value === ADMIN_SECRET

export async function GET(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" }
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
  const r = await buildToday()
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.error === "ledger disabled" ? 503 : 502, headers })
  return NextResponse.json({ ok: true, items: r.items, tomorrow: r.tomorrow }, { headers })
}
