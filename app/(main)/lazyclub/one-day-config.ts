// ================================================================
// 일회성 모임 단일 출처 (v3 개편 — docs/redesign/03 스키마 + 09 상세 확장)
// 홈 meetings 리스트·목록 페이지·상세 페이지가 모두 여기서 로드된다.
// 분류: notice / booktalk / lecture / reading / documents (01 결정 2026-08-04)
// 지금은 프리뷰 트리 안에 두고, 실사이트 이식 시 lazyday 루트로 승격한다.
// ================================================================

import { ONEDAY, sessionKey } from "@/app/(main)/lazyday/one-day-talk-01/oneday-shared"
import { meetingCode } from "@/lib/order-codes"

export type OneDayCategory = "booktalk" | "movie" | "lecture" | "reading" | "documents"

/** 화면 노출용 카테고리 라벨 (라운드 82, 운영자: "booktalk 대신에 원데이토크").
 *  분류 키는 그대로 두고 표기만 한국어로 — 홈·목록·상세가 공유하는 단일 출처.
 *  movie: 호프 상품화로 추가 (운영자 2026-08-11).
 *  2026-08-21 운영자: '무비토크' 표기 폐지 + 띄어쓰기 정정 — 둘 다 "원데이 토크" */
export const CATEGORY_LABELS: Record<OneDayCategory, string> = {
  booktalk: "원데이 토크",
  movie: "원데이 토크",
  lecture: "강연",
  reading: "낭독",
  documents: "기록",
}

/** open=모집중 / soldout=마감(오버레이) / upcoming=오픈 예정(오버레이) — 라운드 10 */
export type ProductStatus = "open" | "soldout" | "upcoming"

export type OneDayMeeting = {
  slug: string
  category: OneDayCategory
  /** 리스트 제목 — "원데이 토크, <작품명>" (2026-08-21 운영자: 『』 감싸기 폐지,
   *  모임명 뒤에 서적/영화를 나열). 자체 이름이 있는 모임(4주 과정 등)은 그 이름 그대로 */
  title: string
  /** 작품명 (『』 없이) — 주문 코드 대조(meetingOrderCode ↔ oneday-shared.work)와
   *  캘린더 칸 표기가 쓴다. 종전에는 title 의 『』 를 정규식으로 파싱했는데, 제목 형식
   *  변경(2026-08-21)으로 파싱 불가 → 명시 필드로 분리. 작품이 없는 모임은 생략 */
  work?: string
  /** 날짜 표기 — 점 표기 관례 "8.9 (일) 19:00" (05 표기 규칙) */
  date: string
  /** 모임장 — 플랫폼화(다수 모임장) 대비 필드 */
  host: string
  /** 카드·상세 상단의 작은 라벨 (2026-08-21 운영자 2차: "카테고리에 이름을 써야
   *  하니까" — 종류어(원데이토크/무비토크)는 제목 앞으로 이동하고, 이 자리는 **이름**).
   *  진행자가 확정된 모임은 모임장 이름(천고든·안동민), 미확정 모임은 진행 주체
   *  "레이지데이 북클럽". host(진행 필드)와는 별개 축이라 필드를 분리한다 —
   *  host 를 덮어쓰면 상세 '진행' 줄까지 바뀐다.
   *  경위: 카테고리 키 표기 → 진행 주체(8-18) → 카테고리 통일(8-21) → 이름(8-21 2차) */
  catLabel: string
  status: ProductStatus
  thumbnail: string
  /** 상세 페이지 이미지 스택 (위→아래) */
  images: { src: string; alt: string }[]
  /** 상세 설명 문단 — 운영자 제작 카드뉴스 원문 그대로. 본문을 중앙 컬럼(centerBody)으로
   *  옮기는 모임(sessions 있는 모임)은 보통 빈 배열 — 우측 요약에는 안 뜨게 한다 */
  description: string[]
  /** null = 가격 미정(구매 비활성, 2026-08-19) — 확정 전까지 임의로 만들지 않는다 */
  price: number | null
  /** 주문 코드 — **oneday-shared 회차에 없는 모임**(4주 과정 등)이 결제되려면 필요하다.
   *  단일 회차 모임은 비워 두면 work 대조로 d코드가 자동 유도된다(meetingOrderCode).
   *  ⚠ 소문자 x 금지 — 주문번호가 코드를 x 로 잇는다 (lib/order-codes 주석 참조) */
  orderCode?: string
  place: string
  contact: string
  /** 복수 회차(4주 과정 등, 2026-08-19). 있으면 캘린더에 각 회차가 개별 등록되고,
   *  상세 "읽는 책" 필드도 이 배열에서 파생된다. 없으면 date 필드 하나로 단일 회차
   *  (기존 3개 모임 무변경). date 형식은 "M.D (요일) …" — mdFromOneDay 파싱과 동일 규칙 */
  sessions?: { week: string; date: string; work: string }[]
  /** 토스페이먼츠 **상품 결제 링크** (운영자 2026-08-21 지급).
   *  여정: 구매하기 → 신청 폼(GAS 접수) → 접수 완료 후 이 링크로 **손님이 직접** 결제.
   *  ⚠ 결제창을 우리가 띄우지 않으므로 orderId 계약(§4 데이터 지도)과 무관하다 —
   *  금액 재검증도 토스 상품 페이지가 한다. 링크가 없으면 신청 폼도 열지 않는다 */
  payUrl?: string
  /** **신청 완료 알림톡의 '비고' 칸** (2026-08-31). 손님에게 **따로 전달할 게 있을 때만**
   *  적는다 — 운영자 "말 그대로 전달할 게 있는 경우에만 안내할거야". 상시 정보(일시·장소)를
   *  넣는 자리가 아니다(그건 이미 본문·상세에 있다).
   *  비워 두면 알림톡의 그 줄이 빈 줄이 된다. 문구는 **운영자 소유** — 임의로 쓰지 않는다. */
  notice?: string
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
    // 2026-08-26 신규 — 안동민 4주 과정. 운영자 제공 포스터·본문 2장에서 옮겼다
    // (천고든 '비로소…' 와 같은 형식: 인사말 + 책 4권 이미지 + 진행자 소개).
    // ⚠ 카피는 운영자 소유 — 본문 원문 그대로다(meetings/[slug] 의 AnxietyToCalmBody).
    slug: "anxiety-to-calm", // 운영자 확정 2026-08-26 (url-policy §1 — 임의 작명 금지)
    payUrl: "https://buy.tosspayments.com/products/iNBoEAw8vw", // 이 모임 전용 (운영자 2026-08-26)
    category: "booktalk",
    hostSlug: "dmahn", // 안동민
    // 포스터 표기는 "불안을 건너 고요로..." — 말줄임표까지 원문 그대로.
    // ⚠ \u00A0 = 줄바꿈 없는 공백. 한 줄에 안 담기면 **"불안을 건너 / 고요로..."** 로만
    // 끊기게 고정한다(비로소 선례와 같은 규율) — '불안을'과 '건너'가 갈라지지 않게 묶었다.
    title: "불안을\u00A0건너 고요로...",
    date: "10.10–10.31 (매주 토) 오전 10:30–12:30",
    host: "안동민",
    catLabel: "안동민",
    status: "open",
    thumbnail: "/linky-lounge/book-club/home-v3/oneday-anxiety-to-calm.webp",
    images: [
      { src: "/linky-lounge/book-club/home-v3/oneday-anxiety-to-calm.webp", alt: "불안을 건너 고요로 포스터" },
    ],
    // 본문은 상세 페이지가 centerBody 로 직접 구성 — 여기는 비움 (비로소와 같음)
    description: [],
    price: 120000, // 운영자 확정 2026-08-26
    // 2026-08-31 결제 연결. 코드에 x 를 넣을 수 없어 slug(anxiety-…) 대신 c-calm
    orderCode: "c-calm",
    // 포스터 원문 그대로. ⚠ **상세 주소는 넣지 않는다** (운영자 2026-08-26 확정) —
    // '확정되면 추가'가 아니라 이게 최종형이다. 다른 모임(사당역 링키라운지 등)처럼
    // 주소를 붙이려 들지 말 것.
    place: "을지로",
    contact: "contact@linkylounge.com",
    sessions: [
      { week: "1주차", date: "10.10 (토) 오전 10:30–12:30", work: "불안" },
      { week: "2주차", date: "10.17 (토) 오전 10:30–12:30", work: "자기만의 방" },
      { week: "3주차", date: "10.24 (토) 오전 10:30–12:30", work: "시지프 신화" },
      { week: "4주차", date: "10.31 (토) 오전 10:30–12:30", work: "사랑의 기술" },
    ],
  },
  {
    // 2026-08-19 신규 — 워크룸 원본 상세 문법(sticky 포스터+중앙 본문 컬럼) 첫 적용.
    // 진행: 천고든(레이지데이 북클럽 소속 — 외부 모임장이 아니다, 운영자 확정).
    // 가격·정원·결제 방식 미확정 — buyHref 를 주지 않고 문의로 안내 (D절, 임의 가격 금지).
    slug: "not-squeezing-myself",
    payUrl: "https://buy.tosspayments.com/products/jtBoCf6W3Y", // 4주 과정 전용 링크 (운영자 2026-08-21)
    category: "booktalk",
    hostSlug: "gdcheon", // 천고든 (사람 슬러그 = 핸들, people-config)
    // ⚠ \u00A0 = 줄바꿈 없는 공백. 한 줄에 안 담길 때 **"비로소, 나를 / 쥐어짜지 않는 법"**
    // 으로만 끊기게 고정한다 (운영자 2026-08-21 "한 줄에 안 담길 경우, 이렇게 줄바꿈이
    // 일어나야만 해"). 종전에는 마지막으로 들어가는 공백에서 끊겨 "비로소, 나를 쥐어짜지 /
    // 않는 법" 처럼 '나를 쥐어짜지'라는 한 덩어리가 갈라졌다(1280px 실측).
    // 끊길 수 있는 공백은 '나를' 뒤 하나뿐 — 나머지 셋을 nbsp 로 묶었다.
    // word-break:keep-all 과 짝이며, 표시 전용이라 소비처(카드·목록·캘린더·alt)는 무영향.
    title: "비로소,\u00A0나를 쥐어짜지\u00A0않는\u00A0법", // 쉼표 표기 (운영자 2026-08-21)
    date: "10.3–10.24 (매주 토) 오전 10:00–12:00",
    host: "레이지데이 북클럽",
    catLabel: "천고든", // 개별 모임장이 여는 모임 — 모임장 이름 (운영자 2026-08-21)
    status: "open",
    thumbnail: "/linky-lounge/book-club/home-v3/oneday-notsqueezing.webp",
    images: [{ src: "/linky-lounge/book-club/home-v3/oneday-notsqueezing.webp", alt: "비로소, 나를 쥐어짜지 않는 법 포스터" }],
    // 본문은 상세 페이지가 centerBody 로 직접 구성(인사말 + 책 4권 + 진행자 소개) — 여기는 비움
    description: [],
    // 12만원 확정 (운영자 2026-08-21). 2026-08-31 결제 연결 — 심사 요건상 전 상품이
    // 우리 결제창(→KG이니시스)으로 가야 해서 명시 주문 코드를 부여했다
    price: 120000,
    orderCode: "c-squeeze",
    place: "사당역 링키라운지",
    contact: "contact@linkylounge.com",
    sessions: [
      { week: "1주차", date: "10.3 (토) 오전 10:00–12:00", work: "인간 실격" },
      { week: "2주차", date: "10.10 (토) 오전 10:00–12:00", work: "브람스를 좋아하세요..." },
      { week: "3주차", date: "10.17 (토) 오전 10:00–12:00", work: "이방인" },
      { week: "4주차", date: "10.24 (토) 오전 10:00–12:00", work: "자기 앞의 생" },
    ],
  },
  {
    slug: "brahms",
    payUrl: "https://buy.tosspayments.com/products/OBBn5YubQ0", // 원데이 토크 공통 (운영자 2026-08-21)
    category: "booktalk",
    // 2026-08-21 운영자: "원데이토크 모두 다 내가 하는 거니까 태그와 사람 다 나로" —
    // 진행자 미확정 상태가 해소됐다 (호프와 동일하게 안동민)
    hostSlug: "dmahn", // 안동민 (사람 슬러그 = 핸들, people-config)
    title: "원데이 토크, 브람스를 좋아하세요...",
    work: "브람스를 좋아하세요...",
    date: "8.30 (일) 08:00–11:00",
    host: "안동민",
    catLabel: "안동민",
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
    payUrl: "https://buy.tosspayments.com/products/OBBn5YubQ0", // 원데이 토크 공통 (운영자 2026-08-21)
    category: "booktalk",
    hostSlug: "dmahn", // 안동민 — 2026-08-21 운영자: 원데이 토크는 전부 안동민 진행
    title: "원데이 토크, 시지프 신화",
    work: "시지프 신화",
    date: "9.5 (토) 08:00–11:00",
    host: "안동민",
    catLabel: "안동민",
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
    slug: "hope",
    payUrl: "https://buy.tosspayments.com/products/OBBn5YubQ0", // 원데이 토크 공통 (운영자 2026-08-21)
    category: "movie",
    hostSlug: "dmahn", // 안동민
    title: "원데이 토크, 호프",
    work: "호프",
    // 2026-08-21 운영자: "호프 모임이 7/26 19-21로 이미 마감되었다" — 실제 진행일로 정정 + 마감
    // ⚠ 구 여정의 회차 목록(oneday-shared.ts)은 8/23 그대로다. 그쪽은 프로덕션 결제
    //   금액 근거(§4 데이터 지도)라 지시 없이 건드리지 않는다 — 이 트리는 payUrl 여정이라 무관.
    date: "7.26 (일) 19:00–21:00",
    host: "안동민",
    catLabel: "안동민", // 진행자 확정(hostSlug) 모임 — 모임장 이름 (운영자 2026-08-21 2차)
    status: "soldout",
    thumbnail: "/linky-lounge/book-club/home-v3/oneday-hope.webp",
    // 2026-08-18: 브람스·시지프와 같은 카드뉴스 형식으로 교체 (구 영화 포스터 이미지 폐기)
    images: [{ src: "/linky-lounge/book-club/home-v3/oneday-hope.webp", alt: "원데이 토크 호프 카드" }],
    // 2026-08-21 운영자 원문 ("이렇게 담백하게") — 구 2문장 임시 문구 폐기
    description: ["나홍진 감독의 영화 〈호프〉를 함께 보고 이야기 나누는 원데이 토크입니다."],
    price: 35000,
    place: "링키라운지 (서울 동작구 동작대로7길 44, 지하 1층)",
    contact: "contact@linkylounge.com",
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
  // 명시 코드가 있으면 그것이 정본 (4주 과정 — 회차 목록에 없어 대조로는 못 찾는다)
  if (m.orderCode) return m.orderCode
  // 제목 파싱(『』) 폐지 — 제목 형식 변경(2026-08-21)으로 명시 work 필드 대조
  const s = ONEDAY.sessions.find((x) => x.work === m.work)
  return s ? meetingCode(sessionKey(s)) : null
}
