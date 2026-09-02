import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { normalizePhone } from "@/lib/orders"

/**
 * 주문 원장 조회 (2026-09-02, 대시보드 CRM-6) — `GET /api/lazyday/admin/orders?q=&status=&limit=`.
 * orders + order_items 를 그대로 보여 준다(법정 5년 원장, R8). **쓰기 없음** — 환불·취소는 토스 쪽이 정본이고
 * 여기 status 는 승인 라우트·웹훅이 적는 값이다. 다른 관리 라우트와 같은 쿠키 인증, 캐시 금지.
 */
const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim()
const isAuthorized = (req: NextRequest) => Boolean(ADMIN_SECRET) && req.cookies.get("lazyday_admin")?.value === ADMIN_SECRET

const STATUSES = ["paid", "refunded", "partially_refunded", "cancelled"] as const

export async function GET(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" }
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
  const sb = supabaseAdmin()
  if (!sb) return NextResponse.json({ ok: false, error: "ledger disabled" }, { status: 503, headers })

  const sp = req.nextUrl.searchParams
  const limit = Math.min(Math.max(Number(sp.get("limit") || 300), 1), 1000)
  let q = sb
    .from("orders")
    .select("id, order_no, amount_total, status, provider, orderer_name, orderer_phone, approved_at, created_at, application_submitted_at, user_id, order_items ( name_snapshot, quantity, unit_price, kind, note_snapshot )")
    .order("created_at", { ascending: false })
    .limit(limit)
  const status = sp.get("status")
  if (status && (STATUSES as readonly string[]).includes(status)) q = q.eq("status", status)
  if (sp.get("unsubmitted") === "1") q = q.is("application_submitted_at", null)
  const raw = (sp.get("q") ?? "").trim()
  if (raw) {
    const phone = normalizePhone(raw)
    q = phone ? q.eq("orderer_phone", phone) : q.or(`orderer_name.ilike.%${raw.replace(/[%,()]/g, "")}%,order_no.ilike.%${raw.replace(/[%,()]/g, "")}%`)
  }
  const { data, error } = await q
  if (error) {
    console.error("[admin/orders]", error.message)
    return NextResponse.json({ ok: false, error: "query failed" }, { status: 502, headers })
  }
  const orders = (data ?? []).map((o) => ({
    id: o.id, orderNo: o.order_no, amount: o.amount_total, status: o.status, provider: o.provider,
    name: o.orderer_name, phone: o.orderer_phone, at: o.approved_at ?? o.created_at,
    applicationSubmitted: Boolean(o.application_submitted_at), userLinked: Boolean(o.user_id),
    items: (o.order_items ?? []).map((it) => ({ name: it.name_snapshot, quantity: it.quantity, unitPrice: it.unit_price, kind: it.kind, note: it.note_snapshot })),
  }))
  return NextResponse.json({ ok: true, count: orders.length, orders }, { headers })
}
