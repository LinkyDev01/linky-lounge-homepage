import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, isAuthEnabled } from "@/lib/auth-server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { normalizePhone } from "@/lib/orders"

/**
 * 비회원으로 한 주문을 내 계정에 잇는다 — `POST /api/lazyday/mypage/link-order`
 * (계획서 P4a-7 · 설계 규칙 **R11**).
 *
 * **주문번호와 전화가 둘 다 일치할 때만** 연결한다. 전화 단독 매칭은 금지 —
 * 번호 하나로 남의 주문을 쓸어 담을 수 있다. 주문번호도 단독으로는 부족하다
 * (영수증·카톡으로 돌아다닌다).
 *
 * ⚠ **이미 다른 계정에 붙은 주문은 건드리지 않는다** — 먼저 연결한 쪽이 유지된다.
 *   같은 주문을 두 사람이 주장하면(대리 결제 등) 화면이 "이미 연결되어 있어요"로
 *   답하고, 사람이 개입한다.
 * ⚠ 같은 주문번호의 **신청(applications)** 도 함께 잇는다 — 결제와 신청서가 한 건인데
 *   주문만 이어지면 '내 신청'이 비어 보인다.
 *
 * 실패 사유를 갈라 알려주지 않는다(존재하지 않음 vs 전화 불일치) — 갈라 주면
 * 주문번호를 넣어 가며 전화번호를 캐낼 수 있다. 한 문장으로 답한다.
 */
export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" }
  if (!isAuthEnabled()) return NextResponse.json({ ok: false, error: "auth disabled" }, { status: 503, headers })

  const user = await getSessionUser()
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers })

  const body = (await req.json().catch(() => ({}))) as { orderNo?: string; phone?: string }
  const orderNo = (body.orderNo || "").trim()
  const phone = normalizePhone(body.phone)
  if (!orderNo || !phone) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400, headers })
  }

  const sb = supabaseAdmin()
  if (!sb) return NextResponse.json({ ok: false, error: "ledger disabled" }, { status: 503, headers })

  const { data: order, error } = await sb
    .from("orders")
    .select("id, user_id, orderer_phone")
    .eq("order_no", orderNo)
    .maybeSingle()
  if (error) {
    console.error("[link-order] 조회 실패", error.message)
    return NextResponse.json({ ok: false, error: "query failed" }, { status: 502, headers })
  }

  // 없는 주문과 전화 불일치를 같은 답으로 — 사유를 갈라 주면 번호를 캐낼 수 있다
  if (!order || order.orderer_phone !== phone) {
    return NextResponse.json({ ok: false, reason: "nomatch" }, { headers })
  }
  if (order.user_id && order.user_id !== user.id) {
    return NextResponse.json({ ok: false, reason: "taken" }, { headers })
  }
  if (order.user_id === user.id) {
    return NextResponse.json({ ok: true, already: true }, { headers })
  }

  const { error: updErr } = await sb.from("orders").update({ user_id: user.id }).eq("id", order.id).is("user_id", null)
  if (updErr) {
    console.error("[link-order] 연결 실패", updErr.message)
    return NextResponse.json({ ok: false, error: "update failed" }, { status: 502, headers })
  }

  // 같은 주문번호의 신청서도 함께 (선결제 원데이 등). 실패해도 주문 연결은 유지된다
  const { error: appErr } = await sb
    .from("applications")
    .update({ user_id: user.id })
    .eq("order_no", orderNo)
    .is("user_id", null)
  if (appErr) console.error("[link-order] 신청 연결 실패", appErr.message)

  return NextResponse.json({ ok: true }, { headers })
}
