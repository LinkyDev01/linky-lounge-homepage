/**
 * 주문 코드 생성기 — 카탈로그와 상품 컨피그가 **함께** 쓰는 최소 단위 (2026-08-31).
 *
 * 왜 별도 파일인가: `lib/order-catalog.ts` 가 상품 컨피그(goods-config·one-day-config)를
 * import 하는데, 그 컨피그들도 코드 생성기를 필요로 한다 — 같은 파일에 두면 순환 import 다.
 * 값 계산이 없는 순수 문자열 함수만 여기 둔다.
 *
 * ⚠ **코드에 소문자 x 를 넣지 말 것.** 주문번호는 코드를 `x` 로 이어 붙이므로
 *   (`lz-d905xg-coffee-mug-…`), 코드 자체에 x 가 있으면 파싱이 갈라져 **금액 검증이
 *   깨진다**. 그래서 4주 과정 코드도 `c-anxiety…` 가 아니라 `c-calm` 이다.
 */

/** 택배 배송비 */
export const SHIPPING_CODE = "ship"

/** 일회성 모임(단일 회차): d + 회차키 (예: d905) */
export function meetingCode(key: number) {
  return `d${key}`
}

/** 제품: g- + slug (예: g-coffee-mug) */
export function goodsCode(slug: string) {
  return `g-${slug}`
}
