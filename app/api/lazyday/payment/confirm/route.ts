import { NextRequest, NextResponse } from "next/server"
import { ONEDAY_PRICE, parseOrderKeys } from "@/app/(main)/lazyday/one-day-talk-01/oneday-shared"

/**
 * 토스페이먼츠 결제 승인 (2026-08-11, 결제위젯 연동).
 * successUrl로 돌아온 클라이언트가 paymentKey/orderId/amount를 보내면
 * 여기서 최종 승인 API를 호출한다 — 승인 없이는 결제가 완료되지 않는다.
 *
 * 금액 검증: 주문 DB 없이 orderId에 인코딩된 회차(oneday-shared.parseOrderDays)로
 * 기대 금액을 재계산해 대조한다 — 클라이언트 금액 변조 차단.
 * 멱등: 같은 결제를 두 번 승인하면 토스가 ALREADY_PROCESSED_PAYMENT를 주는데,
 * 이는 이미 승인 완료라는 뜻이므로 성공으로 처리한다 (새로고침·중복 클릭 안전).
 */

const CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm"
// 상점 시크릿 키 미설정 시 토스 문서 공용 테스트 키 폴백 — 클라이언트 폴백 키와 짝이며
// 이 상태에서는 실결제가 이루어지지 않는다 (체크아웃 화면에 테스트 환경 안내 노출)
const SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6"

export async function POST(req: NextRequest) {
  let body: { paymentKey?: string; orderId?: string; amount?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
  }

  const { paymentKey, orderId, amount } = body
  if (!paymentKey || !orderId || typeof amount !== "number") {
    return NextResponse.json({ success: false, error: "결제 정보가 누락되었습니다." }, { status: 400 })
  }

  // 금액 검증 — orderId의 회차 키 인코딩에서 기대 금액 재계산
  const keys = parseOrderKeys(orderId)
  if (!keys) {
    return NextResponse.json({ success: false, error: "주문번호가 올바르지 않습니다." }, { status: 400 })
  }
  const expected = keys.length * ONEDAY_PRICE
  if (amount !== expected) {
    console.error(`[payment/confirm] 금액 불일치: 요청 ${amount} ≠ 기대 ${expected} (${orderId})`)
    return NextResponse.json({ success: false, error: "결제 금액이 일치하지 않습니다." }, { status: 400 })
  }

  try {
    const res = await fetch(CONFIRM_URL, {
      method: "POST",
      headers: {
        // 시크릿 키 뒤 콜론 = 비밀번호 없음 표시 (토스 Basic 인증 규격)
        Authorization: `Basic ${Buffer.from(`${SECRET_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
      signal: AbortSignal.timeout(15_000),
    })
    const data = await res.json().catch(() => null)

    if (res.ok) {
      return NextResponse.json({
        success: true,
        orderName: data?.orderName,
        approvedAt: data?.approvedAt,
        method: data?.method,
      })
    }

    // 이미 승인된 결제 재요청(새로고침 등) — 결제는 완료 상태이므로 성공으로
    if (data?.code === "ALREADY_PROCESSED_PAYMENT") {
      return NextResponse.json({ success: true })
    }

    console.error(`[payment/confirm] 승인 실패 ${res.status}:`, data?.code, data?.message)
    return NextResponse.json(
      { success: false, error: data?.message || "결제 승인에 실패했습니다." },
      { status: 502 },
    )
  } catch (err) {
    console.error("[payment/confirm] 승인 API 호출 오류:", err)
    return NextResponse.json(
      { success: false, error: "결제 승인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    )
  }
}
