/**
 * 주문 카탈로그 — 결제 가능한 상품의 단일 출처 (2026-08-11, 굿즈 결제 확장).
 *
 * 일회성 모임(무형)과 굿즈(실물·현장 수령)를 하나의 코드 체계로 묶어,
 * 체크아웃(금액 표시)과 서버 승인(/api/lazyday/payment/confirm, 금액 재검증)이
 * 같은 값을 보게 한다. 주문 DB 없이 orderId만으로 기대 금액을 재계산하는 구조라
 * **가격을 바꾸면 결제 진행 중인 주문의 승인이 실패**할 수 있다 (금액 불일치).
 *
 * 서버 라우트에서도 import 하므로 "use client" 금지.
 */

import { ONEDAY, ONEDAY_PRICE, sessionKey } from "@/app/(main)/lazyday/one-day-talk-01/oneday-shared"
import { GOODS } from "@/app/(main)/lazyday/preview/lazyclub-4b073000ddec094f/goods-config"

export type OrderItem = {
  /** 주문 코드 — orderId·쿼리에 실린다. 토스 허용 문자 [a-zA-Z0-9-_] 만 사용 */
  code: string
  name: string
  price: number
  /** 결제창 이후 안내가 달라진다: 모임=참여 확정 / 굿즈=현장 수령 */
  kind: "meeting" | "goods"
  /** 보조 설명 (모임은 일시, 굿즈는 수령 안내) */
  note: string
}

/** 일회성 모임 코드: d + 회차키 (예: d823) / 굿즈 코드: g- + slug (예: g-coffee-mug) */
export function meetingCode(key: number) {
  return `d${key}`
}
export function goodsCode(slug: string) {
  return `g-${slug}`
}

/** 결제 가능한 전 상품 — 마감·오픈예정 상품은 제외한다 (판매 중인 것만 결제) */
export function catalog(): OrderItem[] {
  const meetings: OrderItem[] = ONEDAY.sessions.map((s) => ({
    code: meetingCode(sessionKey(s)),
    name: `${s.kind === "movie" ? "무비토크" : "원데이 토크"} 『${s.work}』`,
    price: ONEDAY_PRICE,
    kind: "meeting" as const,
    note: `${s.month}/${s.day} ${s.time}`,
  }))
  const goods: OrderItem[] = GOODS.filter((g) => g.status === "open" && g.price != null).map((g) => ({
    code: goodsCode(g.slug),
    name: g.name,
    price: g.price as number,
    kind: "goods" as const,
    note: "현장 수령",
  }))
  return [...meetings, ...goods]
}

export function findItem(code: string): OrderItem | undefined {
  return catalog().find((i) => i.code === code)
}

/** 코드 배열 → 주문 항목. 하나라도 알 수 없는 코드가 있으면 null (금액 검증 실패 처리) */
export function resolveItems(codes: string[]): OrderItem[] | null {
  const items: OrderItem[] = []
  for (const c of codes) {
    const item = findItem(c)
    if (!item) return null
    items.push(item)
  }
  return items
}

export function totalOf(items: OrderItem[]) {
  return items.reduce((sum, i) => sum + i.price, 0)
}

// ── 주문번호 계약 ─────────────────────────────────────────────
// lz-{code}x{code}-{ts36}-{rand} — 서버가 orderId만으로 기대 금액을 재계산해
// 클라이언트가 보낸 amount와 대조한다 (금액 변조 차단). 토스 orderId 규격은
// 영문·숫자·하이픈·언더스코어 6~64자라 굿즈 slug의 하이픈도 그대로 실린다.

export function buildOrderId(codes: string[]) {
  const body = [...codes].sort().join("x")
  const rand = Math.random().toString(36).slice(2, 8)
  return `lz-${body}-${Date.now().toString(36)}-${rand}`
}

/** orderId → 주문 코드 배열. 형식 위반·중복 코드는 null (중복으로 금액 부풀리기 방지) */
export function parseOrderCodes(orderId: string): string[] | null {
  const m = /^lz-([a-zA-Z0-9-]+)-([a-z0-9]+)-([a-z0-9]+)$/.exec(orderId)
  if (!m) return null
  const codes = m[1].split("x")
  if (codes.length === 0 || codes.length > 20) return null
  if (new Set(codes).size !== codes.length) return null
  return codes
}

/** 결제창에 노출되는 주문명 — "원데이 토크 『브람스…』" / 2건 이상이면 "외 N건" */
export function orderNameFor(items: OrderItem[]) {
  if (items.length === 0) return "레이지데이"
  return items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`
}
