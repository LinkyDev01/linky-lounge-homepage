// ================================================================
// 일회성 모임 단일 출처 (v3 개편 — docs/redesign/03 스키마)
// 홈 meetings 리스트의 booktalk 항목이 여기서 로드된다.
// 분류: notice / booktalk / lecture / reading / documents (01 결정 2026-08-04)
// 지금은 프리뷰 트리 안에 두고, 실사이트 이식 시 lazyday 루트로 승격한다.
// ================================================================

export type OneDayCategory = "booktalk" | "lecture" | "reading" | "documents"

export type OneDayMeeting = {
  category: OneDayCategory
  /** 리스트 제목 (책 제목은 『』 표기) */
  title: string
  /** 날짜 표기 — 점 표기 관례 "8.9 (일) 19:00" (05 표기 규칙) */
  date: string
  /** 모임장 — 플랫폼화(다수 모임장) 대비 필드. 홈 리스트에는 1차 미노출 */
  host: string
  status: "open" | "closed"
  /** LazydayLink 기준 내부 경로 */
  link: string
  /** 썸네일 — 2026-08-04 운영자 지시로 1차부터 노출 (이미지 다 넣기) */
  thumbnail?: string
}

// 원데이 토크 1차 (운영자 확정 일정 2026-07-24 — one-day-talk-01/apply와 동일 데이터)
export const ONE_DAY_MEETINGS: OneDayMeeting[] = [
  {
    category: "booktalk",
    title: "원데이 토크 『브람스를 좋아하세요...』 프랑수아즈 사강",
    date: "8.2 (일) 19:00–22:00",
    host: "레이지데이 북클럽",
    status: "closed",
    link: "/one-day-talk-01/apply",
    thumbnail: "/linky-lounge/book-club/books/2기-2-브람스를 좋아하세요.jpg",
  },
  {
    category: "booktalk",
    title: "원데이 토크 『시지프 신화』 알베르 카뮈",
    date: "8.9 (일) 19:00–22:00",
    host: "레이지데이 북클럽",
    status: "open",
    link: "/one-day-talk-01/apply",
    thumbnail: "/linky-lounge/book-club/books/1기-4-시지프 신화.jpg",
  },
]
