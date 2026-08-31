import { NextRequest, NextResponse } from "next/server"
import { activePg } from "@/lib/payments/config"
import { createOrder, type ShippingInput } from "@/lib/payments/orders"
import { SHIPPING_CODE, buildOrderId, orderNameFor, resolveItems, totalOf } from "@/lib/order-catalog"

/**
 * 주문 준비 — **paymentId(=orderId)를 서버가 발급**하고 원장에 남긴다 (2026-08-31).
 *
 * 클라이언트는 상품 코드만 보낸다. 금액은 서버가 카탈로그에서 조회해 결정하며,
 * 클라이언트가 보낸 금액은 받지도 쓰지도 않는다 (위변조 차단).
 *
 * 응답의 paymentId 는 두 PG 공용:
 *  · 포트원 → PortOne.requestPayment({ paymentId })
 *  · 토스   → widgets.requestPayment({ orderId })
 * 형식은 lib/order-catalog 의 `lz-{code}x{code}-{ts}-{rand}` 계약 그대로라,
 * 원장이 없어도 승인 단계에서 코드로 금액을 재계산할 수 있다(이중 안전장치).
 */

type Body = {
  /** 상품 코드 배열. "code:옵션" 형태의 옵션 접미는 표기용이라 여기서 떼어낸다 */
  items?: string[]
  parcel?: boolean
  ordererName?: string
  ordererPhone?: string
  shipping?: { zip?: string; addr1?: string; addr2?: string }
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
  }

  const raw = Array.isArray(body.items) ? body.items : []
  // 옵션 접미(:색상/사이즈) 분리 — 금액과 무관한 표기값
  const codes: string[] = []
  const options: Record<string, string> = {}
  for (const token of raw) {
    if (typeof token !== "string") continue
    const [code, opt] = token.split(":")
    if (!code || code === SHIPPING_CODE || codes.includes(code)) continue
    codes.push(code)
    if (opt) options[code] = decodeURIComponent(opt)
  }
  if (codes.length === 0) {
    return NextResponse.json({ success: false, error: "주문할 상품이 없습니다." }, { status: 400 })
  }

  // 택배 선택 시에만 서버가 배송비 항목을 붙인다 (클라이언트가 임의로 넣을 수 없다)
  const finalCodes = body.parcel ? [...codes, SHIPPING_CODE] : codes
  const items = resolveItems(finalCodes)
  if (!items || items.length === 0) {
    return NextResponse.json({ success: false, error: "판매 중이 아닌 상품이 포함되어 있습니다." }, { status: 400 })
  }

  const amount = totalOf(items)
  const orderNo = buildOrderId(finalCodes)
  const orderName = orderNameFor(items)
  const provider = activePg()

  const hasGoods = items.some((i) => i.kind === "goods")
  const shipping: ShippingInput | null = hasGoods
    ? {
        method: body.parcel ? "parcel" : "pickup",
        zip: body.shipping?.zip,
        addr1: body.shipping?.addr1,
        addr2: body.shipping?.addr2,
        recipientName: body.ordererName,
        recipientPhone: body.ordererPhone,
      }
    : null

  // 원장 저장 실패는 결제를 막지 않는다 — order_no 인코딩으로 금액 검증이 성립하기 때문
  const saved = await createOrder({
    orderNo,
    provider,
    amountTotal: amount,
    items,
    ordererName: body.ordererName,
    ordererPhone: body.ordererPhone,
    shipping,
  })

  return NextResponse.json({
    success: true,
    provider,
    paymentId: orderNo,
    orderName,
    amount,
    options,
    ledger: saved.ok,
  })
}
