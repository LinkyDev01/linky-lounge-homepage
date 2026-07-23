// ================================================================
// 시즌(기수) 설정 — 기수 전환 시 이 파일만 수정하면 된다.
// 일정·기수명·참가비가 여러 페이지(랜딩 일정 섹션, 신청 폼,
// 서면/전화 인터뷰 안내 박스)에 걸쳐 쓰이므로 여기로 단일화.
// 책 목록은 별도의 book-config.ts(SeasonConfig)에서 관리.
// ================================================================

export type SeasonDay = {
  /** 요일 표기 (예: "수요일") */
  label: string
  /** 시간대 표기 (예: "19:30–22:30") */
  time: string
}

export type SeasonSession = {
  label: string // "1회차"
  dates: string[] // 요일 순서(days)와 동일한 순서의 날짜 (예: ["7/15", "7/16", "7/19"])
}

export const SEASON = {
  /** 기수 고유명 (예: "4기") */
  name: "4기",
  /** 다음 기수 고유명 */
  next: "5기",
  /** 모집 상태 — "closedEarly"면 랜딩 전체가 조기마감+다음 기수 알림 모드 (운영자 지시 2026-07-13) */
  status: "open" as "open" | "closedEarly",
  /** 다음 기수 시작 시점 표기 (스티키 CTA 주석 줄) */
  nextStartLabel: "추후 공지",
  /** 알림 완료 화면의 카카오 채널 */
  notifyKakaoUrl: "https://pf.kakao.com/_gixaAX",
  /** 시즌 기간 표기 */
  periodLabel: "9/7 – 11/1",
  /** 신청 마감일 (KST, 23:59까지). null이면 마감 개념 자체가 없음 */
  deadline: "2026-09-07" as string | null,
  /** 마감일·D-day 노출 여부 — false면 접수 마감(자동 종료)은 작동하되 화면에는 미표기
   *  (운영자 지시 2026-07-23: "9/7까지 받기는 할 거야" + "신청 마감일 일단 표기하지마") */
  showDeadline: false,
  /** 참가비 표기 */
  price: "150,000원",
  /** 정가(취소선) — 2기 실판매가 200,000원 확인됨 (운영자 확인 2026-07-02) → 종전거래가격 표기 근거 있음 */
  priceWas: "200,000원",
  /** 정규모임 요일·시간 — 한 회차가 수요일에 시작해 일 → 다음 주 화 순서 (운영자 재편 2026-07-23).
   *  일요일은 오전·오후 2슬롯 (time을 ", "로 구분 — 표에서는 줄로 나눠 렌더) */
  days: [
    { label: "수요일", time: "19:30–22:30" },
    { label: "일요일", time: "10:30–13:30, 14:30–17:30" },
    { label: "화요일", time: "19:30–22:30" },
  ] as SeasonDay[],
  /** 정규모임(1–4회차) 일정 — dates는 days와 같은 순서(수·일·화). 격주, 회차 시작 = 수요일 */
  sessions: [
    { label: "1회차", dates: ["9/9", "9/13", "9/15"] },
    { label: "2회차", dates: ["9/23", "9/27", "9/29"] },
    { label: "3회차", dates: ["10/7", "10/11", "10/13"] },
    { label: "4회차", dates: ["10/21", "10/25", "10/27"] },
  ] as SeasonSession[],
  /** 5회차 (자유모임) — 기수마다 구성이 달라질 수 있음 */
  fifth: {
    label: "5회차",
    date: "11/1 (일)",
    timeLabel: "1부 14:30–17:00 · 2부 17:00–",
  },
  /** 안내 문구 */
  regularNote: "1–4회차 · 9월 9일부터 격주, 수·일·화 선택",
  freeNote: "5회차 · 정규 4회 이후 진행",
  /** 장소 */
  location: {
    name: "링키라운지",
    sub: "사당역 10번 출구 도보 3분",
    short: "링키라운지 (사당역 도보 3분)",
    note: "*상황에 따라 장소가 변경될 수 있습니다.",
  },
}

/** 마감까지 남은 일수 (마감일 당일이면 0 = D-DAY, 지났으면 음수). deadline이 null이면 null (마감 미표기) */
export function daysUntilDeadline(): number | null {
  if (!SEASON.deadline) return null
  const end = new Date(`${SEASON.deadline}T23:59:59+09:00`).getTime()
  return Math.floor((end - Date.now()) / 86_400_000)
}
