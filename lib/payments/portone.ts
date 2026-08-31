/**
 * 포트원 V2 서버 모듈 — 결제 조회·검증·취소 (2026-08-31).
 * 서버 전용 (PORTONE_API_SECRET 사용). 클라이언트에서 import 금지.
 *
 * 토스 모듈과 완전히 독립 — 한쪽 장애가 다른 쪽에 영향을 주지 않는다.
 */

const API_BASE = "https://api.portone.io"

function apiSecret() {
  return (process.env.PORTONE_API_SECRET || "").trim()
}

export function portoneServerReady() {
  return apiSecret().length > 0
}

export type PortonePayment = {
  status: string // READY | PAID | CANCELLED | FAILED | VIRTUAL_ACCOUNT_ISSUED ...
  id: string
  orderName?: string
  amount?: { total?: number; paid?: number }
  paidAt?: string
  method?: { type?: string }
  channel?: { type?: string; pgProvider?: string }
  customData?: string
  failure?: { message?: string }
}

/** 결제 단건 조회 — 승인 검증의 진실 원천 (클라이언트 값은 신뢰하지 않는다) */
export async function getPayment(paymentId: string): Promise<PortonePayment | null> {
  if (!portoneServerReady()) {
    console.error("[portone] PORTONE_API_SECRET 미설정 — 결제 조회 불가")
    return null
  }
  try {
    const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${apiSecret()}` },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[portone] 결제 조회 실패 ${res.status}:`, body.slice(0, 200))
      return null
    }
    return (await res.json()) as PortonePayment
  } catch (err) {
    console.error("[portone] 결제 조회 오류:", err instanceof Error ? err.message : err)
    return null
  }
}

/** 결제 취소 — 금액 불일치 등 위변조 의심 건을 즉시 되돌린다 */
export async function cancelPayment(paymentId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  if (!portoneServerReady()) return { ok: false, error: "api_secret_missing" }
  try {
    const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(paymentId)}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `PortOne ${apiSecret()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[portone] 결제 취소 실패 ${res.status}:`, body.slice(0, 200))
      return { ok: false, error: `cancel_failed_${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error("[portone] 결제 취소 오류:", err instanceof Error ? err.message : err)
    return { ok: false, error: "cancel_error" }
  }
}

/** 결제 완료로 볼 상태 — 가상계좌 발급은 이번 범위(카드 일시불) 밖이라 제외 */
export function isPaid(p: PortonePayment | null) {
  return p?.status === "PAID"
}

/** 조회 응답에서 실제 결제 금액을 꺼낸다 (총액 기준) */
export function paidAmountOf(p: PortonePayment | null): number | null {
  const v = p?.amount?.total
  return typeof v === "number" ? v : null
}
