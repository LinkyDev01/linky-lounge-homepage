/**
 * 포트원 경로의 원장 접근 (2026-08-31).
 *
 * **기록은 여기서 하지 않는다.** 주문 원장의 정본은 `lib/orders.ts`(2026-08-18 신설)이고,
 * 승인 확정 시 `recordOrder` 한 번으로 orders·order_items·order_shipping·participants 를
 * 한꺼번에 남긴다. 포트원도 같은 함수를 쓴다 — 스키마도 멱등 규칙도 토스와 공유한다.
 * (초기 구현은 결제 준비 단계에서 pending 행을 먼저 만들었지만, orders.orderer_name 이
 *  NOT NULL 이고 원장 설계가 "승인된 계약만 남긴다"라서 승인 시점 기록으로 통일했다.)
 *
 * 이 모듈이 더하는 것은 포트원 검증에만 필요한 두 가지다:
 *  · findOrder — 멱등 판정(이미 승인됨?)과 기대 금액의 1차 출처
 *  · markCancelled — 금액 불일치로 자동 취소했을 때 상태 반영
 *
 * 원칙은 lib/orders.ts 와 같다: **원장이 없어도 결제 검증은 성립한다.** order_no
 * (=paymentId)에 상품 코드가 인코딩돼 있어 카탈로그로 금액을 재계산할 수 있기 때문이다.
 * 따라서 여기 함수들은 던지지 않고, 실패는 로그로만 남긴다.
 *
 * ⚠ 서버 전용 — service_role 클라이언트를 쓴다 (lib/supabase-server 주석 참조).
 */

import { supabaseAdmin } from "@/lib/supabase-server"

export { recordOrder, isLedgerEnabled, type ShippingInput, type RecordOrderInput } from "@/lib/orders"

export type LedgerOrder = {
  id: string
  order_no: string
  payment_key: string | null
  amount_total: number
  approved_at: string | null
  status: string
  /** 결제 완료 알림톡용 (2026-09-03) — 가상계좌 입금 시점엔 이 값이 유일한 연락처다 */
  orderer_name: string | null
  orderer_phone: string | null
}

/** 주문번호로 원장 행 조회. 미설정·미기록·오류 어느 쪽이든 null (호출부는 코드 재계산으로 진행) */
export async function findOrder(orderNo: string): Promise<LedgerOrder | null> {
  const sb = supabaseAdmin()
  if (!sb) return null
  try {
    const { data, error } = await sb
      .from("orders")
      .select("id, order_no, payment_key, amount_total, approved_at, status, orderer_name, orderer_phone")
      .eq("order_no", orderNo)
      .maybeSingle()
    if (error) {
      console.error(`[payments/orders] 조회 실패 (${orderNo}):`, error.message)
      return null
    }
    return (data as LedgerOrder) ?? null
  } catch (err) {
    console.error(`[payments/orders] 조회 예외 (${orderNo}):`, err)
    return null
  }
}

/** 취소·환불 반영. 원장에 없는 주문(기록 전 취소)은 조용히 넘어간다 */
export async function markCancelled(orderNo: string, status: "cancelled" | "refunded" = "cancelled") {
  const sb = supabaseAdmin()
  if (!sb) return
  try {
    const { error } = await sb.from("orders").update({ status }).eq("order_no", orderNo)
    if (error) console.error(`[payments/orders] 취소 반영 실패 (${orderNo}):`, error.message)
  } catch (err) {
    console.error(`[payments/orders] 취소 반영 예외 (${orderNo}):`, err)
  }
}
