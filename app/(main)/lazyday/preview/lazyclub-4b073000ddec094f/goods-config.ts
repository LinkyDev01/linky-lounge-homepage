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
  /** 컬러 이름 — colors 와 같은 순서 (상세 옵션 선택·주문 표기용, 2026-08-11) */
  colorNames: string[]
  /** 사이즈 옵션 (노아 문법 — 상세에서 선택). 없으면 미노출 */
  sizes?: string[]
  /** 상세 갤러리 (2026-08-11 운영자 "여러 이미지로, 넘기면서 볼 수 있게 — 이미지
   *  나열하는 형태") — 캐러셀이 아니라 워크룸 상세의 세로 나열 스택으로 전부 노출.
   *  없으면 img 한 장만. 첫 장이 메인(목록 카드와 동일 컷) */
  gallery?: string[]
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
    colorNames: ["화이트", "블랙", "더스티 블루", "카멜", "더스티 핑크", "다크브라운"],
    // ⚠ 임시 사이즈 구성 — 운영자 확정값 나오면 교체 (2026-08-11)
    sizes: ["S", "M", "L", "XL"],
  },
  {
    slug: "acrylic-coaster",
    cat: "제품",
    name: "Acrylic Coaster",
    // 2026-08-11 드라이브 일괄 갱신 (운영자 "기존 것 날리고 영문 파일명들만") —
    // 구 goods-coaster.webp 삭제, 드라이브 원본 3240×4050 → 800×1000 webp q88
    img: "/linky-lounge/book-club/home-v3/coaster.webp",
    status: "open",
    description: [
      "책 옆의 잔을 받치는 아크릴 코스터입니다.",
      "라운지의 테이블 위, 대화가 무르익는 자리에 함께 놓입니다.",
    ],
    price: 12900, // 운영자 확정가 2026-08-11
    // I ♥ LAZYDAY 하우스 — 단일 색 (2026-08-11 신규 제품컷 실측 #e6d6c5)
    colors: ["#e6d6c5"],
    colorNames: ["베이지"],
  },
  {
    slug: "coffee-mug",
    cat: "제품",
    name: "Coffee Mug (5-color)",
    // 2026-08-11 드라이브 일괄 갱신 (운영자 "기존 것 날리고 영문 파일명들만") —
    // 구 goods-mug.webp 삭제. 메인(목록 카드·갤러리 첫 장) = y 옐로 (운영자 지정)
    img: "/linky-lounge/book-club/home-v3/coffee-mug-y.webp",
    status: "open",
    description: [
      "다섯 가지 색으로 만든 레이지데이 머그입니다.",
      "각인된 I ♥ LAZYDAY와 함께, 읽는 시간의 온도를 지켜 줍니다.",
    ],
    price: 18900, // 운영자 확정가 2026-08-11
    // 옐로·민트·핑크·블루·그레이 — 2026-08-11 신규 제품컷 실측 (옐로가 메인이라 첫 번째)
    colors: ["#e7b131", "#a5bca8", "#bfa196", "#8b98a1", "#61615f"],
    colorNames: ["옐로", "민트", "핑크", "블루", "그레이"],
    // 상세 갤러리 — 옐로 메인, 이후 칩 순서(민트·핑크·블루·그레이)와 동일
    gallery: [
      "/linky-lounge/book-club/home-v3/coffee-mug-y.webp",
      "/linky-lounge/book-club/home-v3/coffee-mug-m.webp",
      "/linky-lounge/book-club/home-v3/coffee-mug-p.webp",
      "/linky-lounge/book-club/home-v3/coffee-mug-b.webp",
      "/linky-lounge/book-club/home-v3/coffee-mug-g.webp",
    ],
  },
]

export function findGoods(slug: string) {
  return GOODS.find((g) => g.slug === slug)
}

/** 굿즈 거래 조건 (라운드 136, 운영자 확정 원문 — 임의 수정 금지).
 *  상세 페이지에서 저장 버튼 **아래**에 놓는다. 원데이 토크에는 적용하지 않는다
 *  (배송이 없는 상품). 문의는 여기가 아니라 상단 필드가 담당 — 카카오톡 채널. */
export const GOODS_POLICIES: { label: string; lines: string[] }[] = [
  {
    label: "배송·수령",
    lines: [
      "링키라운지 현장 수령 또는 택배 배송 중 선택 (결제 화면에서 선택)",
      "택배: 우체국택배 · 배송비 3,000원 (제주·도서산간 추가) · 결제 확인 후 영업일 2–5일 내 발송",
      "배송지는 결제 화면에서 입력합니다.",
    ],
  },
  {
    label: "교환·반품",
    lines: [
      "수령일(배송 완료일)부터 7일 이내 신청 가능",
      "단순 변심: 반품 배송비 구매자 부담 (왕복 6,000원 · 현장 반납 시 무료)",
      "상품 하자·오배송: 기간 무관 판매자 부담으로 교환 또는 전액 환불",
      "보내실 곳: 링키라운지 (서울 동작구 동작대로7길 44, 지하 1층)",
      "사용·훼손되었거나 포장 개봉으로 상품 가치가 훼손된 경우 교환·반품이 제한될 수 있습니다.",
    ],
  },
]
