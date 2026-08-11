// ================================================================
// 일회성 모임 단일 출처 (v3 개편 — docs/redesign/03 스키마 + 09 상세 확장)
// 홈 meetings 리스트·목록 페이지·상세 페이지가 모두 여기서 로드된다.
// 분류: notice / booktalk / lecture / reading / documents (01 결정 2026-08-04)
// 지금은 프리뷰 트리 안에 두고, 실사이트 이식 시 lazyday 루트로 승격한다.
// ================================================================

export type OneDayCategory = "booktalk" | "movie" | "lecture" | "reading" | "documents"

/** 화면 노출용 카테고리 라벨 (라운드 82, 운영자: "booktalk 대신에 원데이토크").
 *  분류 키는 그대로 두고 표기만 한국어로 — 홈·목록·상세가 공유하는 단일 출처.
 *  movie: 호프 무비토크 상품화로 추가 (운영자 2026-08-11) */
export const CATEGORY_LABELS: Record<OneDayCategory, string> = {
  booktalk: "원데이토크",
  movie: "무비토크",
  lecture: "강연",
  reading: "낭독",
  documents: "기록",
}

/** open=모집중 / soldout=마감(오버레이) / upcoming=오픈 예정(오버레이) — 라운드 10 */
export type ProductStatus = "open" | "soldout" | "upcoming"

export type OneDayMeeting = {
  slug: string
  category: OneDayCategory
  /** 리스트 제목 (책 제목은 『』 표기, 워크룸 도록체) */
  title: string
  /** 날짜 표기 — 점 표기 관례 "8.9 (일) 19:00" (05 표기 규칙) */
  date: string
  /** 모임장 — 플랫폼화(다수 모임장) 대비 필드 */
  host: string
  status: ProductStatus
  thumbnail: string
  /** 상세 페이지 이미지 스택 (위→아래) */
  images: { src: string; alt: string }[]
  /** 상세 설명 문단 — 운영자 제작 카드뉴스 원문 그대로 */
  description: string[]
  price: number
  place: string
  contact: string
}

// 원데이 토크 1차 (운영자 확정 일정 2026-07-24 · 카드뉴스 원문 2026-08-04 수급)
// 2026-08-11 운영자: 심사 대비 4주 연기 (브람스 8/30·시지프 9/6·호프 8/23) + 전 상품 재고 부활
export const ONE_DAY_MEETINGS: OneDayMeeting[] = [
  {
    slug: "hope",
    category: "movie",
    title: "『호프』 무비토크",
    date: "8.23 (일) 19:00–22:00",
    host: "레이지데이 북클럽",
    status: "open",
    thumbnail: "/linky-lounge/book-club/home-v3/oneday-hope.webp",
    images: [{ src: "/linky-lounge/book-club/home-v3/oneday-hope.webp", alt: "호프 무비토크 — 영화 호프 포스터" }],
    // ⚠ 임시 소개 문구 — 운영자 카드뉴스 원문 수급 시 교체 (브랜드 카피는 운영자 소유)
    description: [
      "나홍진 감독의 영화 〈호프〉를 함께 보고 이야기 나누는 하루의 영화 모임입니다.",
      "같은 장면을 서로 다르게 통과한 사람들의 감상이 한자리에 모입니다.",
    ],
    price: 35000,
    place: "링키라운지 (서울 동작구 동작대로7길 44, 지하 1층)",
    contact: "contact@linkylounge.com",
  },
  {
    slug: "brahms",
    category: "booktalk",
    title: "『브람스를 좋아하세요...』 원데이 토크",
    date: "8.30 (일) 19:00–22:00",
    host: "레이지데이 북클럽",
    status: "open",
    thumbnail: "/linky-lounge/book-club/home-v3/oneday-brahms.webp",
    // 라운드 40: 책 단독 표지 이미지 제외 — 카드 이미지 1장만
    images: [{ src: "/linky-lounge/book-club/home-v3/oneday-brahms.webp", alt: "브람스를 좋아하세요... 원데이 토크 카드" }],
    description: [
      "\"브람스를 좋아하세요?\" 한 줄의 질문은 39세 주인공 '폴'이 잊고 지내던 설렘과 자아를 흔들어 놓습니다.",
      "익숙함과 외로움이 얽힌 관계 속에서 방황하는 인물들의 심리를 다각도로 들여다봅니다.",
      "사랑이라는 감정 뒤에 숨겨진 자기 결정권, 나이에 대한 중압감, 그리고 외로움과 자유 사이의 선택에 대해 솔직한 이야기를 나눕니다.",
    ],
    price: 35000,
    place: "링키라운지 (서울 동작구 동작대로7길 44, 지하 1층)",
    contact: "contact@linkylounge.com",
  },
  {
    slug: "sisyphus",
    category: "booktalk",
    title: "『시지프 신화』 원데이 토크",
    date: "9.6 (일) 19:00–22:00",
    host: "레이지데이 북클럽",
    // 2026-08-11: 4주 연기로 마감 해제 (구 라운드 121 soldout)
    status: "open",
    // 라운드 78 (운영자): 범용 One Day Talk 포스터 → 책+설명 카드로 교체 (브람스와 같은 문법)
    thumbnail: "/linky-lounge/book-club/home-v3/oneday-sisyphus.webp",
    // 라운드 40: 책 단독 표지 이미지 제외 — 카드 이미지 1장만
    images: [{ src: "/linky-lounge/book-club/home-v3/oneday-sisyphus.webp", alt: "시지프 신화 원데이 토크 카드" }],
    description: [
      "끊임없이 바위를 밀어 올려야 하는 형벌 속에서, 시지프는 어떻게 자신의 운명을 긍정할 수 있었을까요?",
      "카뮈가 말하는 '삶의 부조리'를 직시하고, 회피나 자살이 아닌 반항과 자유, 그리고 열정으로 오늘을 살아내는 실존적 태도를 탐구합니다.",
      "무의미해 보이는 일상의 굴레 속에서 나만의 온전한 주체성을 되찾는 깊이 있는 철학적 대화에 여러분을 초대합니다.",
    ],
    price: 35000,
    place: "링키라운지 (서울 동작구 동작대로7길 44, 지하 1층)",
    contact: "contact@linkylounge.com",
  },
]

export function findMeeting(slug: string) {
  return ONE_DAY_MEETINGS.find((m) => m.slug === slug)
}
