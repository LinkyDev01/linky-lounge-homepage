// 굿즈 단일 출처 — 홈 shop 사이드바·굿즈 상세가 공유 (docs/redesign/09)
// 상품명은 운영자 확정 영문.
// 2026-08-11 운영자: PG 심사 대비 **전 품목 재고 부활(open)** + 확정가 책정
// (머그 18,900 · 코스터 12,900 · 티셔츠 24,900 — 구 임의가 999,999 폐기)

import type { ProductStatus } from "./one-day-config"

export type Goods = {
  slug: string
  /** 라운드 77: 어패럴·테이블웨어 세분류 폐기 — 전 품목 "제품" 단일 태그 (운영자).
   *  라운드 125: 목록에서 태그 자체를 미노출 (품목이 적어 무의미 — 운영자) — 필드는
   *  상세 페이지 표기·향후 세분류 대비로 보존 */
  cat: "제품"
  name: string
  img: string
  status: ProductStatus
  description: string[]
  price: number | null
  /** 컬러 옵션 (라운드 125, 브라운야드 문법) — 운영자 제공 제품 사진에서 실측 추출한 HEX.
   *  목록 카드에 원형 칩으로 나열. 빈 배열이면 칩 미노출 */
  colors: string[]
}

export const GOODS: Goods[] = [
  {
    slug: "printed-t-shirt",
    cat: "제품",
    name: "Printed T-shirt",
    img: "/linky-lounge/book-club/home-v3/goods-tshirt.webp",
    // 2026-08-11: 재고 부활 (구 라운드 127 soldout 표기 샘플 해제)
    status: "open",
    description: [
      "I ♥ LAZYDAY. 레이지데이의 마음을 가슴에 얹은 프린티드 티셔츠입니다.",
      "책과 함께하는 하루에 어울리는 무게로, 일상에서 편하게 입도록 만들었습니다.",
    ],
    price: 24900, // 운영자 확정가 2026-08-11
    // 화이트·블랙·더스티 블루·카멜·더스티 핑크·다크브라운 (운영자 제공 사진 실측)
    colors: ["#f0f0f2", "#1a191f", "#8488c0", "#b17335", "#d29e8f", "#543021"],
  },
  {
    slug: "acrylic-coaster",
    cat: "제품",
    name: "Acrylic Coaster",
    img: "/linky-lounge/book-club/home-v3/goods-coaster.webp",
    status: "open",
    description: [
      "책 옆의 잔을 받치는 아크릴 코스터입니다.",
      "라운지의 테이블 위, 대화가 무르익는 자리에 함께 놓입니다.",
    ],
    price: 12900, // 운영자 확정가 2026-08-11
    // I ♥ LAZYDAY 하우스 — 크림 단일 (운영자 제공 도안 실측)
    colors: ["#f7ebc3"],
  },
  {
    slug: "coffee-mug",
    cat: "제품",
    name: "Coffee Mug (5-color)",
    img: "/linky-lounge/book-club/home-v3/goods-mug.webp",
    status: "open",
    description: [
      "다섯 가지 색으로 만든 레이지데이 머그입니다.",
      "각인된 I ♥ LAZYDAY와 함께, 읽는 시간의 온도를 지켜 줍니다.",
    ],
    price: 18900, // 운영자 확정가 2026-08-11
    // 민트·옐로·핑크·블루·그레이 (운영자 제공 사진 실측)
    colors: ["#99bbab", "#c9ad52", "#c6a298", "#8395a3", "#5d5f5c"],
  },
]

export function findGoods(slug: string) {
  return GOODS.find((g) => g.slug === slug)
}
