/**
 * 토스페이먼츠 서버 모듈 — 승인·취소 (2026-08-31 격리).
 * 서버 전용 (TOSS_SECRET_KEY 사용).
 *
 * ⚠ 이 모듈은 ACTIVE_PG 값과 **무관하게 항상 동작해야 한다** — 포트원으로
 *   전환한 뒤에도 기존 토스 주문의 취소·환불을 처리해야 하기 때문.
 */

const API_BASE = "https://api.tosspayments.com/v1/payments"
// 상점 키 미설정 시 토스 문서 공용 테스트 시크릿 — 이 상태에서는 실결제가 일어나지 않는다
const SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6"

function authHeader() {
  // 시크릿 키 뒤 콜론 = 비밀번호 없음 (토스 Basic 인증 규격)
  return `Basic ${Buffer.from(`${SECRET_KEY}:`).toString("base64")}`
}

export type TossConfirmResult = {
  ok: boolean
  status?: number
  data?: Record<string, unknown>
  error?: string
  /** 이미 승인된 결제 — 새로고침·중복 클릭에서 성공으로 취급 */
  alreadyProcessed?: boolean
}

/** 결제 승인 — successUrl 리다이렉트 뒤 반드시 호출해야 결제가 최종 완료된다 */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<TossConfirmResult> {
  try {
    const res = await fetch(`${API_BASE}/confirm`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount }),
      signal: AbortSignal.timeout(15_000),
    })
    const data = await res.json().catch(() => null)
    if (res.ok) return { ok: true, status: res.status, data: data ?? undefined }
    if (data?.code === "ALREADY_PROCESSED_PAYMENT") {
      return { ok: true, alreadyProcessed: true, status: res.status }
    }
    console.error(`[toss] 승인 실패 ${res.status}:`, data?.code, data?.message)
    return { ok: false, status: res.status, error: data?.message || "결제 승인에 실패했습니다." }
  } catch (err) {
    console.error("[toss] 승인 API 호출 오류:", err instanceof Error ? err.message : err)
    return { ok: false, error: "결제 승인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }
  }
}

/** 결제 취소 — ACTIVE_PG 와 무관하게 기존 토스 주문 환불에 쓴다 */
/** 주문번호로 결제 조회 — **웹훅 검증의 진실 원천**.
 *  토스 웹훅은 포트원과 달리 서명(HMAC)이 없다. 그래서 본문을 믿지 않고 이 API 로
 *  다시 물어본 결과만 쓴다 (본문 위조로 원장을 오염시킬 수 없게).
 *  DEPOSIT_CALLBACK 의 `secret` 대조는 가상계좌 발급 응답을 우리가 저장해야 가능한데,
 *  위젯이 발급을 대신하므로 우리에겐 그 값이 없다 — 재조회가 현실적인 검증 수단이다. */
export async function getPaymentByOrderId(orderId: string): Promise<TossPayment | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: authHeader() },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[toss] 결제 조회 실패 ${res.status}:`, body.slice(0, 200))
      return null
    }
    return (await res.json()) as TossPayment
  } catch (err) {
    console.error("[toss] 결제 조회 오류:", err instanceof Error ? err.message : err)
    return null
  }
}

export type TossPayment = {
  paymentKey: string
  orderId: string
  orderName?: string
  /** READY | IN_PROGRESS | WAITING_FOR_DEPOSIT | DONE | CANCELED | PARTIAL_CANCELED | ABORTED | EXPIRED */
  status: string
  totalAmount?: number
  approvedAt?: string
  method?: string
  virtualAccount?: { customerName?: string; accountNumber?: string; bankCode?: string }
}

export async function cancelPayment(paymentKey: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(paymentKey)}/cancel`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ cancelReason: reason }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      console.error(`[toss] 취소 실패 ${res.status}:`, data?.code, data?.message)
      return { ok: false, error: data?.message || `cancel_failed_${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error("[toss] 취소 API 호출 오류:", err instanceof Error ? err.message : err)
    return { ok: false, error: "cancel_error" }
  }
}
