// ================================================================
// 일회성 모임 단일 출처 (v3 개편 — docs/redesign/03 스키마 + 09 상세 확장)
// 홈 meetings 리스트·목록 페이지·상세 페이지가 모두 여기서 로드된다.
// 분류: notice / booktalk / lecture / reading / documents (01 결정 2026-08-04)
// 지금은 프리뷰 트리 안에 두고, 실사이트 이식 시 lazyday 루트로 승격한다.
// ================================================================

import { ONEDAY, sessionKey } from "@/app/(main)/lazyday/one-day-talk-01/oneday-shared"
import { meetingCode } from "@/lib/order-catalog"

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
  /** 상세 설명 문단 — 운영자 제작 카드뉴스 원문 그대로. 본문을 중앙 컬럼(centerBody)으로
   *  옮기는 모임(sessions 있는 모임)은 보통 빈 배열 — 우측 요약에는 안 뜨게 한다 */
  description: string[]
  /** null = 가격 미정(구매 비활성, 2026-08-19) — 확정 전까지 임의로 만들지 않는다 */
  price: number | null
  place: string
  contact: string
  /** 복수 회차(4주 과정 등, 2026-08-19). 있으면 캘린더에 각 회차가 개별 등록되고,
   *  상세 "읽는 책" 필드도 이 배열에서 파생된다. 없으면 date 필드 하나로 단일 회차
   *  (기존 3개 모임 무변경). date 형식은 "M.D (요일) …" — mdFromOneDay 파싱과 동일 규칙 */
  sessions?: { week: string; date: string; work: string }[]
  /** 진행자 (people-config 의 Person.slug). 사람들 페이지가 이 값으로 역참조해
   *  "진행하는 모임"을 모은다 (2026-08-20, C안). ⚠ **미확정이면 주지 않는다** —
   *  임의 배정 금지. 없는 모임은 역참조 목록에서 자연히 빠진다 */
  hostSlug?: string
}

// 원데이 토크 1차 (운영자 확정 일정 2026-07-24 · 카드뉴스 원문 2026-08-04 수급)
// 2026-08-11 운영자: 심사 대비 4주 연기 (브람스 8/30·시지프 9/6·호프 8/23) + 전 상품 재고 부활
// 2026-08-18 운영자: 카드뉴스 이미지 기준 시간 정정 — 브람스·시지프 오전 08:00–11:00,
// 시지프는 날짜도 9/5(토)로. oneday-shared.ts 와 값이 같아야 한다 (단일 출처 파생 아님, 표시용 별도 문자열).
export const ONE_DAY_MEETINGS: OneDayMeeting[] = [
  {
    slug: "hope",
    category: "movie",
    hostSlug: "andongmin", // 2026-08-20 역참조 (브람스·시지프는 진행자 미확정 — 주지 않음)
    title: "『호프』 무비토크",
    date: "8.23 (일) 19:00–22:00",
    host: "레이지데이 북클럽",
    status: "open",
    thumbnail: "/linky-lounge/book-club/home-v3/oneday-hope.webp",
    // 2026-08-18: 브람스·시지프와 같은 카드뉴스 형식으로 교체 (구 영화 포스터 이미지 폐기)
    images: [{ src: "/linky-lounge/book-club/home-v3/oneday-hope.webp", alt: "호프 무비토크 카드" }],
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
    date: "8.30 (일) 08:00–11:00",
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
    date: "9.5 (토) 08:00–11:00",
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
  {
    // 2026-08-19 신규 — 워크룸 원본 상세 문법(sticky 포스터+중앙 본문 컬럼) 첫 적용.
    // 진행: 천고든(레이지데이 북클럽 소속 — 외부 모임장이 아니다, 운영자 확정).
    // 가격·정원·결제 방식 미확정 — buyHref 를 주지 않고 문의로 안내 (D절, 임의 가격 금지).
    slug: "not-squeezing-myself",
    category: "booktalk",
    hostSlug: "gorden",
    title: "비로소 나를 쥐어짜지 않는 법",
    date: "10.3–10.24 (매주 토) 오전 10:00–12:00",
    host: "레이지데이 북클럽",
    status: "open",
    thumbnail: "/linky-lounge/book-club/home-v3/oneday-notsqueezing.webp",
    images: [{ src: "/linky-lounge/book-club/home-v3/oneday-notsqueezing.webp", alt: "비로소 나를 쥐어짜지 않는 법 포스터" }],
    // 본문은 상세 페이지가 centerBody 로 직접 구성(인사말 + 책 4권 + 진행자 소개) — 여기는 비움
    description: [],
    price: null,
    place: "사당역 링키라운지",
    contact: "contact@linkylounge.com",
    sessions: [
      { week: "1주차", date: "10.3 (토) 오전 10:00–12:00", work: "인간 실격" },
      { week: "2주차", date: "10.10 (토) 오전 10:00–12:00", work: "브람스를 좋아하세요..." },
      { week: "3주차", date: "10.17 (토) 오전 10:00–12:00", work: "이방인" },
      { week: "4주차", date: "10.24 (토) 오전 10:00–12:00", work: "자기 앞의 생" },
    ],
  },
]

export function findMeeting(slug: string) {
  return ONE_DAY_MEETINGS.find((m) => m.slug === slug)
}

/** 모임 slug → 주문 코드 (dNNN). 실 일정(oneday-shared ONEDAY)과 작품명으로 대조 —
 *  일정에 없는(지난·미등록) 모임은 null. 카트·상세 구매하기가 공유 (선결제→후신청, 2026-08-11) */
export function meetingOrderCode(slug: string): string | null {
  const m = findMeeting(slug)
  if (!m) return null
  const work = m.title.match(/『(.+?)』/)?.[1]
  const s = ONEDAY.sessions.find((x) => x.work === work)
  return s ? meetingCode(sessionKey(s)) : null
}
