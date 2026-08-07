// 굿즈 단일 출처 — 홈 shop 사이드바·굿즈 상세가 공유 (docs/redesign/09)
// 상품명은 운영자 확정 영문. 전 품목 판매 전 = upcoming (coming soon 오버레이,
// 저장·카트 담기는 가능 — 라운드 10). 가격은 커머스 도입 시 확정(현재 미정).

import type { ProductStatus } from "./one-day-config"

export type Goods = {
  slug: string
  /** 라운드 77: 어패럴·테이블웨어 세분류 폐기 — 전 품목 "제품" 단일 태그 (운영자) */
  cat: "제품"
  name: string
  img: string
  status: ProductStatus
  description: string[]
  price: number | null
}

export const GOODS: Goods[] = [
  {
    slug: "printed-t-shirt",
    cat: "제품",
    name: "Printed T-shirt",
    img: "/linky-lounge/book-club/home-v3/goods-tshirt.webp",
    status: "upcoming",
    description: [
      "I ♥ LAZYDAY. 레이지데이의 마음을 가슴에 얹은 프린티드 티셔츠입니다.",
      "책과 함께하는 하루에 어울리는 무게로, 일상에서 편하게 입도록 만들었습니다.",
    ],
    price: null,
  },
  {
    slug: "acrylic-coaster",
    cat: "제품",
    name: "Acrylic Coaster",
    img: "/linky-lounge/book-club/home-v3/goods-coaster.webp",
    status: "upcoming",
    description: [
      "책 옆의 잔을 받치는 아크릴 코스터입니다.",
      "라운지의 테이블 위, 대화가 무르익는 자리에 함께 놓입니다.",
    ],
    price: null,
  },
  {
    slug: "coffee-mug",
    cat: "제품",
    name: "Coffee Mug (5-color)",
    img: "/linky-lounge/book-club/home-v3/goods-mug.webp",
    status: "upcoming",
    description: [
      "다섯 가지 색으로 만든 레이지데이 머그입니다.",
      "각인된 I ♥ LAZYDAY와 함께, 읽는 시간의 온도를 지켜 줍니다.",
    ],
    price: null,
  },
]

export function findGoods(slug: string) {
  return GOODS.find((g) => g.slug === slug)
}
