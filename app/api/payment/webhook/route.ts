import { NextRequest, NextResponse } from "next/server"
import * as PortOne from "@portone/server-sdk"
import { getPayment, isPaid, paidAmountOf, cancelPayment } from "@/lib/payments/portone"
import { findOrder, markCancelled, recordOrder } from "@/lib/payments/orders"
import { parseOrderCodes, resolveItems, totalOf } from "@/lib/order-catalog"

/**
 * 포트원 웹훅 수신 (2026-08-31).
 *
 * ⚠ 이 경로(POST /api/payment/webhook)는 포트원 콘솔에 등록되는 주소다 — 바꾸지 말 것.
 *
 * 원칙:
 *  · PORTONE_WEBHOOK_SECRET 으로 서명을 검증한다. **시크릿이 없으면 검증을 우회하지 않고
 *    명시적으로 실패**시킨다 (엔드포인트 배포 후 콘솔에서 발급되므로 개발 중 공백일 수 있다).
 *  · 같은 결제로 웹훅이 중복 수신될 수 있으므로 멱등 처리한다.
 *  · 웹훅에서도 결제 조회 API 로 금액을 재검증한다 (본문 값 불신).
 */

// 서명 검증은 원본 텍스트가 필요하다 — Next 는 req.text() 로 얻는다
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const secret = (process.env.PORTONE_WEBHOOK_SECRET || "").trim()
  const raw = await req.text()

  if (!secret) {
    console.error("[payment/webhook] PORTONE_WEBHOOK_SECRET 미설정 — 검증 불가로 거부 (콘솔에서 발급 후 주입 필요)")
    return new NextResponse("webhook secret not configured", { status: 503 })
  }

  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => {
    headers[k] = v
  })

  let webhook: Awaited<ReturnType<typeof PortOne.Webhook.verify>>
  try {
    webhook = await PortOne.Webhook.verify(secret, raw, headers)
  } catch (err) {
    if (err instanceof PortOne.Webhook.WebhookVerificationError) {
      console.error("[payment/webhook] 서명 검증 실패:", err.message)
      return new NextResponse("invalid signature", { status: 400 })
    }
    console.error("[payment/webhook] 검증 오류:", err instanceof Error ? err.message : err)
    return new NextResponse("verification error", { status: 500 })
  }

  try {
    // 유니온에 미인식 이벤트 형태({type})가 있어 data 접근 전에 좁힌다.
    // 결제 외 이벤트(빌링키 등)는 이번 범위 밖 — 200 으로 수신만 확인
    if (!("data" in webhook) || !("paymentId" in webhook.data)) {
      return new NextResponse(null, { status: 200 })
    }
    const paymentId = webhook.data.paymentId

    // 멱등 — 이미 승인 확정된 주문이면 아무것도 하지 않는다
    const order = await findOrder(paymentId)
    if (order?.approved_at) {
      return new NextResponse(null, { status: 200 })
    }

    const payment = await getPayment(paymentId)
    if (!payment) {
      // 조회 실패는 포트원이 재전송하도록 5xx
      return new NextResponse("payment lookup failed", { status: 502 })
    }

    if (!isPaid(payment)) {
      // 취소·실패 이벤트는 원장에 반영만
      if (payment.status === "CANCELLED") await markCancelled(paymentId)
      return new NextResponse(null, { status: 200 })
    }

    // 금액 재검증 — complete 라우트와 동일 기준 (원장 우선, 없으면 코드 재계산)
    const codes = parseOrderCodes(paymentId)
    const items = codes ? resolveItems(codes) : null
    const expected: number | null =
      order?.amount_total ?? (items && items.length > 0 ? totalOf(items) : null)
    const paid = paidAmountOf(payment)

    if (expected == null) {
      console.error("[payment/webhook] 기대 금액 산출 불가:", paymentId)
      return new NextResponse(null, { status: 200 })
    }
    if (paid !== expected) {
      console.error(`[payment/webhook] 금액 불일치: 결제 ${paid} ≠ 기대 ${expected} (${paymentId})`)
      await cancelPayment(paymentId, "주문 금액 불일치로 자동 취소")
      await markCancelled(paymentId)
      return new NextResponse(null, { status: 200 })
    }

    // 원장 — recordOrder 는 order_no 로 멱등이라 성공 화면이 이미 남겼으면 건너뛴다.
    // 웹훅이 먼저 도착하는 경우(브라우저를 곧장 닫은 손님)가 이 경로의 존재 이유다:
    // 배송지는 알 수 없지만 **결제 기록 자체가 사라지지는 않는다**.
    if (items && items.length > 0) {
      const r = await recordOrder({
        orderNo: paymentId,
        paymentKey: payment.id || paymentId,
        amountTotal: expected,
        items,
        buyerName: payment.customer?.name || "",
        buyerPhone: payment.customer?.phoneNumber,
        approvedAt: payment.paidAt,
      })
      if (!r.ok) console.error(`[payment/webhook] 원장 기록 실패 (${paymentId}):`, r.error)
    }
    return new NextResponse(null, { status: 200 })
  } catch (err) {
    console.error("[payment/webhook] 처리 오류:", err instanceof Error ? err.message : err)
    return new NextResponse("handler error", { status: 500 })
  }
}
