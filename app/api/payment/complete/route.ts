import { NextRequest, NextResponse } from "next/server"
import { getPayment, isPaid, paidAmountOf, cancelPayment, portoneServerReady } from "@/lib/payments/portone"
import { findOrder, markCancelled, recordOrder, type ShippingInput } from "@/lib/payments/orders"
import { parseOrderCodes, resolveItems, totalOf } from "@/lib/order-catalog"

/**
 * 포트원 결제 검증 — 결제창 완료 후 **서버가 진실을 확인한다** (2026-08-31).
 *
 * 검증 순서:
 *  1. 포트원 결제 조회 API 로 실제 상태·금액을 가져온다 (클라이언트 값 불신)
 *  2. 기대 금액을 구한다 — 원장(orders.amount_total)이 있으면 그 값,
 *     없으면 paymentId 에 인코딩된 상품 코드로 카탈로그 재계산
 *  3. 상태가 PAID 이고 금액이 일치할 때만 완료. 불일치면 **즉시 결제 취소**
 *
 * 멱등: 이미 approved_at 이 있는 주문은 그대로 성공 반환 (새로고침·중복 호출 안전)
 *
 * 원장 기록은 토스 승인 라우트(/api/lazyday/payment/confirm)와 **같은 함수**
 * (lib/orders recordOrder)를 쓴다 — 스키마도 멱등 규칙도 두 PG 가 공유한다.
 * ⚠ 기록 실패가 결제 응답을 깨뜨리지 않는다: 손님 돈은 이미 빠져나간 뒤다.
 */

export async function POST(req: NextRequest) {
  let body: {
    paymentId?: string
    buyer?: { name?: string; phone?: string }
    shipping?: ShippingInput
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
  }

  const paymentId = (body.paymentId || "").trim()
  if (!paymentId) {
    return NextResponse.json({ success: false, error: "결제 정보가 누락되었습니다." }, { status: 400 })
  }

  if (!portoneServerReady()) {
    // 시크릿이 없으면 검증을 우회하지 않는다 — 명시적 실패
    console.error("[payment/complete] PORTONE_API_SECRET 미설정 — 검증 불가")
    return NextResponse.json(
      { success: false, error: "결제 검증 설정이 완료되지 않았습니다. 잠시 후 다시 시도해주세요." },
      { status: 503 },
    )
  }

  // 멱등 — 이미 승인 확정된 주문
  const order = await findOrder(paymentId)
  if (order?.approved_at) {
    return NextResponse.json({ success: true, alreadyProcessed: true })
  }

  const payment = await getPayment(paymentId)
  if (!payment) {
    return NextResponse.json({ success: false, error: "결제 내역을 확인하지 못했습니다." }, { status: 502 })
  }

  // 주문 항목 — 금액 재계산의 근거이자 원장의 가격 스냅샷(R2) 원본
  const codes = parseOrderCodes(paymentId)
  const items = codes ? resolveItems(codes) : null

  // 기대 금액 — 원장 우선, 없으면 paymentId 코드로 재계산
  const expected: number | null =
    order?.amount_total ?? (items && items.length > 0 ? totalOf(items) : null)
  if (expected == null) {
    console.error("[payment/complete] 기대 금액을 구할 수 없음:", paymentId)
    return NextResponse.json({ success: false, error: "주문번호가 올바르지 않습니다." }, { status: 400 })
  }

  const paid = paidAmountOf(payment)

  if (!isPaid(payment)) {
    const msg = payment.failure?.message || `결제가 완료되지 않았습니다. (상태: ${payment.status})`
    return NextResponse.json({ success: false, error: msg, status: payment.status }, { status: 400 })
  }

  if (paid !== expected) {
    // 위변조 의심 — 되돌린다
    console.error(`[payment/complete] 금액 불일치: 결제 ${paid} ≠ 기대 ${expected} (${paymentId})`)
    await cancelPayment(paymentId, "주문 금액 불일치로 자동 취소")
    await markCancelled(paymentId)
    return NextResponse.json({ success: false, error: "결제 금액이 일치하지 않습니다." }, { status: 400 })
  }

  // 원장 — 던지지 않는다. 실패는 로그만 남기고 결제 응답은 그대로 성공
  if (items && items.length > 0) {
    try {
      const r = await recordOrder({
        orderNo: paymentId,
        paymentKey: payment.id || paymentId,
        amountTotal: expected,
        items,
        // 결제창에 넘긴 고객 정보를 폴백으로 — 브라우저가 일찍 닫혀 buyer 가 비어도 이름이 남는다
        buyerName: body.buyer?.name?.trim() || payment.customer?.name || "",
        buyerPhone: body.buyer?.phone || payment.customer?.phoneNumber,
        approvedAt: payment.paidAt,
        shipping: body.shipping,
      })
      if (!r.ok) console.error(`[payment/complete] 원장 기록 실패 (${paymentId}):`, r.error)
    } catch (err) {
      console.error(`[payment/complete] 원장 기록 예외 (${paymentId}):`, err)
    }
  }

  return NextResponse.json({
    success: true,
    orderName: payment.orderName,
    method: payment.method?.type,
    approvedAt: payment.paidAt,
  })
}
