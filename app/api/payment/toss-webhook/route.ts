import { NextRequest, NextResponse } from "next/server"
import { getPaymentByKey, getPaymentByOrderId } from "@/lib/payments/toss"
import { findOrder, markCancelled } from "@/lib/payments/orders"
import { recordOrder } from "@/lib/orders"
import { parseOrderCodes, resolveItems, totalOf } from "@/lib/order-catalog"

/**
 * 토스페이먼츠 웹훅 (2026-09-01, 가상계좌 도입).
 *
 * ⚠ 이 경로(POST /api/payment/toss-webhook)는 토스 개발자센터에 등록되는 주소다 — 바꾸지 말 것.
 *   포트원 웹훅(/api/payment/webhook)과는 **다른 엔드포인트**다. 서로 바꿔 등록하면 안 된다
 *   (포트원 쪽은 HMAC 서명을 요구해 토스 요청을 400 으로 거절한다).
 *
 * **왜 필요한가.** 카드·간편결제는 손님이 결제창에서 돌아오는 순간 우리가 승인(confirm)해서
 * 끝난다 — 웹훅이 없어도 완결된다. 그런데 **가상계좌는 그 자리에서 안 끝난다**: 계좌만 발급되고
 * 실제 입금은 며칠 뒤일 수 있으며, 그때 손님은 우리 사이트에 없다. 입금 사실을 알 방법이
 * 이 웹훅뿐이라, 없으면 돈은 들어왔는데 우리 기록은 0인 상태가 된다.
 *
 * **검증 방식이 포트원과 다르다.** 토스 웹훅에는 서명(HMAC)이 없다. 그래서 본문을 믿지 않고
 * **orderId 로 결제를 다시 조회해** 그 결과만 신뢰한다 (본문을 위조해도 원장을 오염시킬 수 없다).
 * 금액도 orderId 에 인코딩된 상품 코드로 재계산해 대조한다 — confirm 라우트와 같은 규율.
 *
 * 응답은 **언제나 200**이다. 토스는 2xx 가 아니면 재전송하는데, 우리가 처리할 수 없는
 * 이벤트(형식 불명·미지원 타입)를 5xx 로 돌려주면 무의미한 재전송만 쌓인다.
 */

export const dynamic = "force-dynamic"

/** 이벤트 본문에서 필드를 꺼낸다 — 타입마다 위치가 다르다.
 *  DEPOSIT_CALLBACK: 최상위 / PAYMENT_STATUS_CHANGED: data 안 */
function pick(body: unknown, key: string): string | null {
  if (typeof body !== "object" || body === null) return null
  const b = body as Record<string, unknown>
  if (typeof b[key] === "string" && b[key]) return b[key] as string
  const data = b.data
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>
    if (typeof d[key] === "string" && d[key]) return d[key] as string
  }
  return null
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    console.error("[toss-webhook] 본문 파싱 실패")
    return new NextResponse(null, { status: 200 })
  }

  const orderId = pick(body, "orderId")
  if (!orderId) {
    // 주문과 무관한 이벤트(고객 상태 변경 등) — 수신만 확인
    return new NextResponse(null, { status: 200 })
  }

  // 본문 불신 — 토스에 직접 물어본 결과만 쓴다.
  // ⚠ **paymentKey 조회를 우선**한다: 주문번호 조회는 상점 스코프를 타서 MID 구성에
  //   따라 NOT_FOUND_MERCHANT 로 404 가 난다(2026-09-01 실측 — 취소 웹훅이 세 번 왔는데
  //   전부 이 404 로 처리 보류됐다). paymentKey 는 본문에 실려 오고, 없으면 원장에서
  //   찾고, 그래도 없을 때만 주문번호 조회로 폴백한다.
  const keyFromBody = pick(body, "paymentKey")
  const order = await findOrder(orderId)
  const paymentKey = keyFromBody || order?.payment_key || null

  const payment = paymentKey ? await getPaymentByKey(paymentKey) : await getPaymentByOrderId(orderId)
  if (!payment) {
    console.error(`[toss-webhook] 결제 조회 실패 — 처리 보류 (${orderId})`)
    return new NextResponse(null, { status: 200 })
  }

  if (payment.status === "CANCELED" || payment.status === "PARTIAL_CANCELED") {
    await markCancelled(orderId, payment.status === "CANCELED" ? "cancelled" : "refunded")
    return new NextResponse(null, { status: 200 })
  }

  // DONE 이 아니면 아직 완료가 아니다 (WAITING_FOR_DEPOSIT = 계좌만 발급된 상태)
  if (payment.status !== "DONE") {
    return new NextResponse(null, { status: 200 })
  }

  // 금액 재검증 — orderId 의 상품 코드로 기대 금액 재계산 (confirm 과 동일 근거)
  const codes = parseOrderCodes(orderId)
  const items = codes ? resolveItems(codes) : null
  if (!items || items.length === 0) {
    console.error(`[toss-webhook] 주문번호에서 상품을 복원하지 못함 (${orderId})`)
    return new NextResponse(null, { status: 200 })
  }
  const expected = totalOf(items)
  if (typeof payment.totalAmount === "number" && payment.totalAmount !== expected) {
    // 여기서 자동 취소까지 하지는 않는다 — 이미 입금된 돈이고, 사람이 판단할 일이다
    console.error(`[toss-webhook] 금액 불일치: 결제 ${payment.totalAmount} ≠ 기대 ${expected} (${orderId})`)
    return new NextResponse(null, { status: 200 })
  }

  // 원장 — order_no 로 멱등이라 confirm 이 이미 남겼으면 건너뛴다.
  // 가상계좌 입금은 손님이 사이트에 없을 때 도착하므로 구매자 정보가 우리에게 없다.
  // 발급 시 입력된 예금주명을 폴백으로 쓴다 (없으면 recordOrder 가 "(미입력)" 처리)
  const r = await recordOrder({
    orderNo: orderId,
    paymentKey: payment.paymentKey,
    provider: "toss",
    amountTotal: expected,
    items,
    buyerName: payment.virtualAccount?.customerName || "",
    approvedAt: payment.approvedAt,
  })
  if (!r.ok) console.error(`[toss-webhook] 원장 기록 실패 (${orderId}):`, r.error)

  return new NextResponse(null, { status: 200 })
}
