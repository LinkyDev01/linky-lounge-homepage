/**
 * 주문 원장 — Supabase orders/order_items/order_shipping 쓰기 (2026-08-31).
 *
 * 서버 전용. service role 키를 쓰므로 **클라이언트에서 import 금지**.
 *
 * 설계 원칙:
 * 1. 금액은 서버가 카탈로그에서 결정한다. 클라이언트가 보낸 금액은 신뢰하지 않는다.
 * 2. 원장이 없어도 결제 검증은 성립한다 — order_no(=paymentId)에 상품 코드가
 *    인코딩돼 있어 카탈로그로 금액을 재계산할 수 있기 때문(lib/order-catalog).
 *    따라서 저장 실패는 **결제를 막지 않고** 경고 로그를 남긴다. 다만 원장이 있으면
 *    웹훅 멱등·환불 라우팅·심사 증빙이 가능해진다.
 * 3. env 미설정(SUPABASE_SERVICE_ROLE_KEY 등)은 조용히 넘어가지 않고 로그로 드러낸다.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { PgProvider } from "./config"
import type { OrderItem } from "@/lib/order-catalog"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
// 서버 쓰기용 — RLS 를 우회한다. 절대 NEXT_PUBLIC_ 로 노출하지 않는다
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

let client: SupabaseClient | null = null
/** 원장 사용 가능 여부. false 면 호출부는 저장을 건너뛰고 결제는 그대로 진행한다 */
export function ledgerReady() {
  return URL.length > 0 && SERVICE_KEY.length > 0
}
function db(): SupabaseClient | null {
  if (!ledgerReady()) return null
  if (!client) client = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })
  return client
}

export type ShippingInput = {
  method: "pickup" | "parcel"
  zip?: string
  addr1?: string
  addr2?: string
  recipientName?: string
  recipientPhone?: string
}

export type CreateOrderInput = {
  orderNo: string
  provider: PgProvider
  amountTotal: number
  items: OrderItem[]
  ordererName?: string
  ordererPhone?: string
  shipping?: ShippingInput | null
}

/**
 * 결제 요청 직전 주문을 원장에 남긴다 (status='pending' 상당 — 스키마 check 는
 * paid/refunded/partially_refunded/cancelled 만 허용하므로, 승인 전에는
 * approved_at=NULL 로 두고 status 는 'paid' 기본값을 그대로 쓴다.
 * 승인 여부의 진실은 approved_at 과 payment_key 다).
 */
export async function createOrder(input: CreateOrderInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const sb = db()
  if (!sb) {
    console.warn("[orders] 원장 미설정 — 주문 저장 건너뜀 (SUPABASE_SERVICE_ROLE_KEY 확인)", input.orderNo)
    return { ok: false, error: "ledger_not_configured" }
  }
  try {
    const { data, error } = await sb
      .from("orders")
      .insert({
        order_no: input.orderNo,
        provider: input.provider,
        amount_total: input.amountTotal,
        currency: "KRW",
        orderer_name: input.ordererName ?? "",
        orderer_phone: input.ordererPhone ?? null,
      })
      .select("id")
      .single()
    if (error) throw error

    const orderId = data.id as string
    const rows = input.items.map((i) => ({
      order_id: orderId,
      product_code: i.code,
      name_snapshot: i.name,
      kind: i.kind,
      unit_price: i.price,
      quantity: 1,
      note_snapshot: i.note || null,
    }))
    if (rows.length > 0) {
      const { error: itemErr } = await sb.from("order_items").insert(rows)
      if (itemErr) console.error("[orders] order_items 저장 실패:", itemErr.message)
    }

    if (input.shipping) {
      const s = input.shipping
      const { error: shipErr } = await sb.from("order_shipping").insert({
        order_id: orderId,
        method: s.method,
        zip: s.zip || null,
        addr1: s.addr1 || null,
        addr2: s.addr2 || null,
        recipient_name: s.recipientName || null,
        recipient_phone: s.recipientPhone || null,
      })
      if (shipErr) console.error("[orders] order_shipping 저장 실패:", shipErr.message)
    }
    return { ok: true, id: orderId }
  } catch (err) {
    // 원장 실패가 결제를 막지 않는다 — 금액 검증은 order_no 인코딩으로도 성립
    console.error("[orders] 주문 생성 실패:", err instanceof Error ? err.message : err)
    return { ok: false, error: err instanceof Error ? err.message : "unknown" }
  }
}

/** 주문 조회 — 승인·웹훅에서 저장된 금액과 이미 처리됐는지(멱등)를 본다 */
export async function findOrder(orderNo: string) {
  const sb = db()
  if (!sb) return null
  const { data, error } = await sb
    .from("orders")
    .select("id, order_no, provider, status, amount_total, payment_key, approved_at")
    .eq("order_no", orderNo)
    .maybeSingle()
  if (error) {
    console.error("[orders] 조회 실패:", error.message)
    return null
  }
  return data
}

/** 승인 확정 — payment_key·approved_at 기록. 이미 approved_at 이 있으면 멱등 무시 */
export async function markPaid(orderNo: string, paymentKey: string, approvedAt?: string) {
  const sb = db()
  if (!sb) return { ok: false, error: "ledger_not_configured" }
  const { error } = await sb
    .from("orders")
    .update({
      payment_key: paymentKey,
      status: "paid",
      approved_at: approvedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("order_no", orderNo)
    .is("approved_at", null) // 멱등 — 이미 승인된 주문은 건드리지 않는다
  if (error) {
    console.error("[orders] 승인 기록 실패:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/** 취소·환불 반영 (금액 불일치로 자동 취소한 경우 포함) */
export async function markCancelled(orderNo: string, status: "cancelled" | "refunded" = "cancelled") {
  const sb = db()
  if (!sb) return { ok: false, error: "ledger_not_configured" }
  const { error } = await sb
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("order_no", orderNo)
  if (error) {
    console.error("[orders] 취소 기록 실패:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/** 결제 후 신청서 제출 시각 — 미제출(NULL) 주문이 운영 구제(재진입 링크) 대상 */
export async function markApplicationSubmitted(orderNo: string) {
  const sb = db()
  if (!sb) return { ok: false, error: "ledger_not_configured" }
  const { error } = await sb
    .from("orders")
    .update({ application_submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("order_no", orderNo)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
