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
  /** 색별 제품컷 — colors 와 같은 순서 (2026-08-11 운영자 정정: 나열 대신 "컬러
   *  클릭하면 첫 위치에 사진만 바뀌도록"). 상세에서 칩 선택 시 메인 사진 교체.
   *  없으면 img 한 장 고정 */
  colorImgs?: string[]
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
    // 색별 제품컷 — colors 와 같은 순서. 상세는 사진을 나열하지 않고 **컬러 칩을
    // 클릭하면 첫 위치의 사진만 교체**한다 (운영자 2026-08-11, 구 gallery 나열 폐기)
    colorImgs: [
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

/** 배송 & 교환/반품 — 브라운야드 상세의 "Delievery & Returns" 레이어 서식을 그대로
 *  이식한 항목 구성 (운영자 2026-08-12: "배송비 3,500원 반품 배송비 7천원, 우체국
 *  택배, 링키라운지주소 등만 반영하고 똑같이 반영"). label = 좌측 회색 라벨.
 *  ⚠ 배송비 3,500원은 결제 금액(lib/order-catalog SHIPPING_FEE)과 통합 약관
 *  (terms/TermsBody 제11·13조)과 **같은 값이어야 한다** — 셋을 함께 고칠 것.
 *  ⚠ 브라운야드의 "5만원 이상 무료배송"은 우리 정책이 아니라 미반영 (운영자 확인 대기). */
export const DELIVERY_RETURNS: { label: string; lines: string[] }[] = [
  { label: "배송 지역", lines: ["전국(일부 지역 제외)"] },
  { label: "배송 방식", lines: ["우체국택배", "링키라운지 현장 수령 선택 시 배송비가 없습니다."] },
  {
    label: "배송비",
    lines: ["3,500원", "(도서·산간 지역은 별도의 추가 금액이 발생할 수도 있습니다.)"],
  },
  {
    label: "배송 정보",
    lines: [
      "결제 확인 후 영업일 기준 2–5일 이내 발송(토요일, 일요일, 공휴일은 배송일에서 제외)",
      "도서·산간 지역은 배송일이 추가적으로 소요될 수 있으며, 상품의 재고 상황에 따라 다소 지연될 수 있습니다.",
    ],
  },
  {
    label: "교환/반품 기간",
    lines: ["고객님의 변심으로 인한 교환·반품은 제품 수령일로부터 7일 이내"],
  },
  {
    label: "교환/반품 배송비",
    lines: [
      "고객님의 변심으로 인한 제품 교환/반품은 고객님께서 부담하셔야 합니다.",
      "(단, 제품 불량, 하자가 있는 경우에 한하여 택배비 제외)",
      "단순 변심 반품 시: 3,500원(초기 배송비) + 3,500원(반품 배송비) = 총 7,000원 (환불 금액에서 차감 처리)",
      "(도서·산간 지역은 별도의 추가 금액이 발생할 수도 있습니다.)",
      "링키라운지에 직접 반납하시는 경우에는 비용이 없습니다.",
    ],
  },
  { label: "교환/반품 주소", lines: ["서울특별시 동작구 동작대로7길 44, 지하 1층 (링키라운지)"] },
  { label: "고객센터", lines: ["010-7444-5790"] },
  {
    label: "교환/반품 불가 안내",
    lines: [
      "- 고객님의 변심으로 인한 교환/반품 요청이 상품을 수령한 날로부터 7일을 경과한 경우",
      "- 상품을 사용한 흔적, 상품의 가치가 훼손된 경우",
      "- 포장을 개봉하여 상품의 가치가 훼손된 경우",
      "- 어떠한 상황(최초 불량 유무)이라도 상품을 세탁, 수선한 경우",
      "- 고의적으로 상품을 손상한 경우",
      "- 상품의 부속품과 택·라벨, 상품 구성의 일부를 훼손, 제거한 경우",
      "- 사전 접수 없이 일방적으로 보낸 상품은 다시 반송 처리됩니다.",
    ],
  },
]
