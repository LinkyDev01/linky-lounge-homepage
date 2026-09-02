/**
 * 주문 원장 기록 (2026-08-18 신설).
 *
 * **왜 생겼나.** 지금까지 주문 기록은 구글 시트에만, 그것도 **신청서를 제출해야만**
 * 남았다. 결제는 승인됐는데 신청 폼에서 이탈한 손님은 우리 쪽 기록이 0이고, 토스
 * 상점관리자에만 존재했다 — 구제책은 운영자가 손으로 재진입 링크를 만드는 것뿐이었다.
 * 여기서는 **승인 직후** 행을 남긴다. `application_submitted_at` 이 NULL 이면 곧
 * "결제했는데 신청서를 안 낸 사람" 이다.
 *
 * **원칙 — 기록이 결제를 깨뜨리지 않는다.** 모든 함수는 던지지 않고 결과를 돌려준다.
 * Supabase 미설정·네트워크 실패·스키마 불일치 어느 쪽이든 결제 승인 응답은 그대로
 * 성공이어야 한다. 원장은 부가 기능이고, 손님 돈은 이미 빠져나간 뒤다.
 *
 * 스키마: supabase/migrations/20260818090000_core_orders.sql
 * 규칙 원문: /lazyday/preview/commerce-journey
 */

import { supabaseAdmin, isLedgerEnabled } from "./supabase-server"
import type { OrderItem } from "./order-catalog"
import { ONEDAY, sessionKey } from "@/app/(main)/lazyday/one-day-talk-01/oneday-shared"

export type LedgerResult =
  | { ok: true; skipped?: "disabled" | "duplicate" }
  | { ok: false; error: string }

export type ShippingInput = {
  method: "pickup" | "parcel"
  zip?: string
  addr1?: string
  addr2?: string
}

export type RecordOrderInput = {
  /** 결제사 orderId 원문 — R1, 발급 후 불변인 유일 식별자 */
  orderNo: string
  paymentKey?: string
  /** 어느 PG 로 결제됐는가. 생략 시 스키마 기본값 'toss'.
   *  2026-08-31~09-01 포트원 병존 기간의 잔재이며 지금은 toss 뿐이지만, 컬럼이
   *  환불 라우팅 근거라 필드는 남겨 둔다 (PG 를 다시 늘릴 때 그대로 쓴다) */
  provider?: "toss"
  /** 승인된 총액 (원) */
  amountTotal: number
  /** 카탈로그에서 해석한 항목 — 여기서 가격·이름을 **복사해 박는다** (R2) */
  items: OrderItem[]
  buyerName: string
  buyerPhone?: string
  approvedAt?: string
  shipping?: ShippingInput
  /** 로그인 결제면 그 계정 (P4). 비회원이 기본이라 nullable — R11.
   *  ⚠ 가상계좌는 토스가 서버로 직접 부르는 웹훅이라 세션 쿠키가 없다 → 여기 null 로
   *    남고 마이페이지의 '주문 연결'로만 회수된다. */
  userId?: string | null
}

/** 전화번호 정규화 — 숫자만. 키가 아니라 조회용 속성이라 형식만 통일한다 (결정 4).
 *  ⚠ **9자리 미만이면 null** — 접수 원장의 dedup_key 를 만들 때 이 null 을 반드시
 *  가드해야 한다(`"written:null"` 이 되면 비정상 번호 접수가 서로를 덮어쓴다).
 *  GAS 의 normPhone 에는 이 길이 컷오프가 없다는 차이도 알아 둘 것.
 *  export 이유: lib/applications.ts 가 같은 정규화를 써야 두 원장의 전화 표기가 갈리지 않는다 */
export function normalizePhone(v?: string) {
  const digits = (v || "").replace(/[^0-9]/g, "")
  return digits.length >= 9 ? digits : null
}

/** 모임 코드(dNNN) → 그 모임의 종료일(YYYY-MM-DD). R9 파기 기준일 계산에 쓴다.
 *  ⚠ **dNNN 주문 코드만 받는다 — meetingSlug 가 아니다.** slug 로 부르면 조용히 null 이
 *  되어 파기 기준일이 폴백으로 새 버린다. slug 는 meetingOrderCode(), orderId 는
 *  parseOrderCodes() 를 먼저 거칠 것 (lib/applications.ts 가 그렇게 쓴다) */
export function meetingEndsOn(code: string): string | null {
  const m = /^d([0-9]+)$/.exec(code)
  if (!m) return null
  const s = ONEDAY.sessions.find((x) => sessionKey(x) === Number(m[1]))
  if (!s) return null
  const mm = String(s.month).padStart(2, "0")
  const dd = String(s.day).padStart(2, "0")
  return `${ONEDAY.year}-${mm}-${dd}`
}

/** 종료일 + 1년 = 파기 예정일 (R9). 종료일을 모르면 null.
 *  participants 는 null 이면 파기 잡이 건너뛰지만, applications 는 purge_after 가
 *  NOT NULL 이라 호출부가 접수일+1년으로 폴백한다 (0005 결정 2) */
export function purgeAfter(endsOn: string | null): string | null {
  if (!endsOn) return null
  const [y, m, d] = endsOn.split("-").map(Number)
  const dt = new Date(Date.UTC(y + 1, m - 1, d))
  return dt.toISOString().slice(0, 10)
}

/**
 * 승인된 주문을 원장에 남긴다. **멱등** — 같은 order_no 로 다시 부르면 건너뛴다
 * (새로고침·중복 클릭·토스 ALREADY_PROCESSED_PAYMENT 재승인 경로 모두 여기로 온다).
 */
export async function recordOrder(input: RecordOrderInput): Promise<LedgerResult> {
  const sb = supabaseAdmin()
  if (!sb) return { ok: true, skipped: "disabled" }

  try {
    // 이미 기록된 주문인가 — 멱등의 1차 방어 (2차는 order_no 의 unique 제약)
    const { data: existing } = await sb
      .from("orders")
      .select("id")
      .eq("order_no", input.orderNo)
      .maybeSingle()
    if (existing) return { ok: true, skipped: "duplicate" }

    const { data: order, error: orderErr } = await sb
      .from("orders")
      .insert({
        order_no: input.orderNo,
        payment_key: input.paymentKey ?? null,
        // 생략하면 컬럼 기본값('toss')이 들어간다 — 토스 승인 경로는 넘기지 않는다
        ...(input.provider ? { provider: input.provider } : {}),
        amount_total: input.amountTotal,
        orderer_name: input.buyerName || "(미입력)",
        orderer_phone: normalizePhone(input.buyerPhone),
        user_id: input.userId ?? null,
        approved_at: input.approvedAt ?? new Date().toISOString(),
      })
      .select("id")
      .single()

    // 동시 승인 경쟁 — unique 위반은 "이미 기록됨"이라는 뜻이므로 성공으로 본다
    if (orderErr) {
      if (orderErr.code === "23505") return { ok: true, skipped: "duplicate" }
      return { ok: false, error: `orders: ${orderErr.message}` }
    }

    // R2 — 가격·상품명 스냅샷. 카탈로그가 바뀌어도 이 값은 변하지 않는다
    const { error: itemsErr } = await sb.from("order_items").insert(
      input.items.map((i) => ({
        order_id: order.id,
        product_code: i.code,
        name_snapshot: i.name,
        kind: i.kind,
        unit_price: i.price,
        quantity: 1,
        note_snapshot: i.note || null,
      })),
    )
    if (itemsErr) return { ok: false, error: `order_items: ${itemsErr.message}` }

    // 배송·수령 — 종전에는 토스 결제 metadata 에만 있었다
    if (input.shipping) {
      const { error: shipErr } = await sb.from("order_shipping").insert({
        order_id: order.id,
        method: input.shipping.method,
        zip: input.shipping.zip || null,
        addr1: input.shipping.addr1 || null,
        addr2: input.shipping.addr2 || null,
        recipient_name: input.buyerName || null,
        recipient_phone: normalizePhone(input.buyerPhone),
      })
      if (shipErr) return { ok: false, error: `order_shipping: ${shipErr.message}` }
    }

    // R3·R9 — 참가자는 **별도 테이블**. 기본값은 결제자 본인이고, 대리 결제면
    // 신청서 제출 때 갱신된다. 여기서 파기 예정일(종료일+1년)을 함께 박는다.
    const meetings = input.items.filter((i) => i.kind === "meeting")
    if (meetings.length > 0) {
      const { error: partErr } = await sb.from("participants").insert(
        meetings.map((i) => {
          const endsOn = meetingEndsOn(i.code)
          return {
            order_id: order.id,
            product_code: i.code,
            name: input.buyerName || "(미입력)",
            phone: normalizePhone(input.buyerPhone),
            ends_on: endsOn,
            purge_after: purgeAfter(endsOn),
          }
        }),
      )
      if (partErr) return { ok: false, error: `participants: ${partErr.message}` }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * 신청서 제출 표시. 이게 찍히지 않은 주문이 곧 구제 대상이다.
 * 참가자 이름·연락처도 신청서 값으로 맞춘다 — 대리 결제면 여기서 갈린다 (R3).
 */
export async function markApplicationSubmitted(
  orderNo: string,
  participant?: { name?: string; phone?: string },
): Promise<LedgerResult> {
  const sb = supabaseAdmin()
  if (!sb) return { ok: true, skipped: "disabled" }

  try {
    const { data: order, error } = await sb
      .from("orders")
      .update({ application_submitted_at: new Date().toISOString() })
      .eq("order_no", orderNo)
      .select("id")
      .maybeSingle()
    if (error) return { ok: false, error: `orders: ${error.message}` }
    if (!order) return { ok: true, skipped: "duplicate" } // 원장에 없는 주문 (기록 이전 건)

    if (participant?.name) {
      const { error: pErr } = await sb
        .from("participants")
        .update({ name: participant.name, phone: normalizePhone(participant.phone) })
        .eq("order_id", order.id)
      if (pErr) return { ok: false, error: `participants: ${pErr.message}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export { isLedgerEnabled }
