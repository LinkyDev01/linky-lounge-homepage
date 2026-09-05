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
  /** 마감된 반 — 화면엔 취소선·옅은 색으로 남기고 선택은 막는다 (2026-09-03) */
  closed?: boolean
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
  periodLabel: "9/9 – 11/1",
  /** 신청 마감일 (KST, 23:59까지). null이면 마감 개념 자체가 없음 */
  deadline: "2026-09-07" as string | null,
  /** 마감일·D-day 노출 여부 — false면 접수 마감(자동 종료)은 작동하되 화면에는 미표기
   *  (운영자 지시 2026-07-23: "9/7까지 받기는 할 거야" + "신청 마감일 일단 표기하지마") */
  showDeadline: false,
  /** 참가비 표기 */
  price: "150,000원",
  /** 정가(취소선) — 2기 실판매가 200,000원 확인됨 (운영자 확인 2026-07-02) → 종전거래가격 표기 근거 있음 */
  priceWas: "200,000원",
  /** 정규모임 요일·시간 — 표기 순서는 **화·수·일** 고정 (운영자 지시 2026-07-27:
   *  "시점이 밀리더라도 화 수 일 순서대로"). 실제 회차는 수요일에 시작해 일 → 다음 주 화 진행이라
   *  같은 행에서 화요일 날짜가 수·일보다 늦다 — 의도된 배열.
   *  일요일은 오전·오후 2슬롯 (time을 ", "로 구분 — 표에서는 줄로 나눠 렌더) */
  /** (2026-09-03) 토요일 오전 반 추가 → 같은 날 화·수·일 **마감**. 모집 중인 토요일을 **첫 순서**로
   *  (운영자 "랜딩 히어로에서는 토요일 오전 반을 첫 번째로 노출"). 마감 반은 `closed` 로 남겨 화면엔
   *  취소선·옅은 색으로 보이고 선택은 막힌다 — 배열에서 지우면 월력 마커·시트 기록이 같이 사라진다.
   *  토요일은 각 회차의 마지막 날(화요일 다음 주 토요일)이라 dates 에서 그 행의 최댓값이다. */
  days: [
    { label: "토요일", time: "10:30–13:30" },
    { label: "화요일", time: "19:30–22:30", closed: true },
    { label: "수요일", time: "19:30–22:30", closed: true },
    { label: "일요일", time: "10:30–13:30, 14:30–17:30", closed: true },
  ] as SeasonDay[],
  /** 신청 폼 '참여 불가 요일' 선택지 — 일요일은 오전·오후 슬롯 분리, 나열 순서는 화·수 관례.
   *  time은 체크카드에 회색 보조 표기 (운영자 지시 2026-07-27) */
  unavailableDaySlots: [
    { label: "토요일 오전", time: "10:30–13:30" },
    { label: "화요일", time: "19:30–22:30", closed: true },
    { label: "수요일", time: "19:30–22:30", closed: true },
    { label: "일요일 오전", time: "10:30–13:30", closed: true },
    { label: "일요일 오후", time: "14:30–17:30", closed: true },
  ] as Array<{ label: string; time: string; closed?: boolean }>,
  /** 정규모임(1–4회차) 일정 — dates는 days와 같은 순서(**토·화·수·일**, 2026-09-03 토 첫 순서).
   *  격주, 회차 시작 = 수요일이라 화요일 날짜가 수·일보다 늦고 토요일은 그보다도 뒤다 (운영자 지시 2026-07-27) */
  sessions: [
    { label: "1회차", dates: ["9/19", "9/15", "9/9", "9/13"] },
    { label: "2회차", dates: ["10/3", "9/29", "9/23", "9/27"] },
    { label: "3회차", dates: ["10/17", "10/13", "10/7", "10/11"] },
    { label: "4회차", dates: ["10/31", "10/27", "10/21", "10/25"] },
  ] as SeasonSession[],
  /** 5회차 (자유모임) — 기수마다 구성이 달라질 수 있음 */
  fifth: {
    label: "5회차",
    date: "11/1 (일)",
    timeLabel: "19:00–22:00",
  },
  /** 안내 문구 */
  regularNote: "1–4회차 · 9월 19일부터 격주 토요일 오전 (화·수·일 반 마감)",
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

// ── 월별 달력(벽걸이 월력) 파생 데이터 — 일정 섹션 14a 시안용 (운영자 확정 2026-07-24) ──
// 하드코딩 금지: 회차 날짜(sessions)·자유모임(fifth)에서 전부 계산한다.

export type CalendarMeeting = {
  /** "9/9" 형태 */
  date: string
  month: number
  day: number
  /** 1~4 회차 번호 */
  round: number
  /** 마감된 반의 날짜 — 마커를 옅게 그린다 */
  closed: boolean
}
export type CalendarMonth = {
  /** "9월" */
  name: string
  /** "SEP. 2026" */
  eng: string
  year: number
  month: number
}
export type CalendarData = {
  months: CalendarMonth[]
  meetings: CalendarMeeting[]
  free: { date: string; month: number; day: number; label: string }
}

const MONTH_ENG = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

/** 시즌 연도 — deadline(YYYY-MM-DD)에서 파생 */
export function seasonYear(): number {
  return Number((SEASON.deadline ?? "2026-01-01").split("-")[0])
}

/**
 * 기수 종료일 (YYYY-MM-DD) — 마지막 회차인 5회차 날짜.
 *
 * **왜 필요한가.** 이 파일에는 종료일의 **기계 판독 필드가 없었다** — 있는 건 표기용
 * `periodLabel`("9/9 – 11/1")·`fifth.date`("11/1 (일)")·`deadline`(=마감일, 종료일이 아님)뿐이라
 * R9 파기 기준일(기수 종료 + 1년)을 코드로 산출할 방법이 없었다. 접수 원장(applications)의
 * `purge_after` 가 NOT NULL 이라 이 값이 없으면 북클럽 접수 전건이 "접수 + 1년" 폴백으로
 * 새고, 그건 개인정보처리방침 제3조("기수 종료 후 1년")보다 **이르게 지우는** 쪽이라
 * 운영 데이터가 먼저 사라진다. (0001 의 pg_cron 주석이 정한 방향 — 일찍 지우는 사고는 없어야 한다.)
 *
 * `fifth.date` 는 "11/1 (일)" 처럼 연도가 없으므로 `seasonYear()`(deadline 파생)를 붙인다.
 * ⚠ 기수가 해를 넘기면(마감 12월 / 5회차 1월) 월이 역전하므로 그때만 +1년 한다.
 */
export function seasonEndsOn(): string | null {
  const md = SEASON.fifth.date.split(" ")[0] // "11/1 (일)" → "11/1"
  const [m, d] = md.split("/").map(Number)
  if (!m || !d) return null
  const deadlineMonth = Number((SEASON.deadline ?? "").split("-")[1])
  // 마감보다 이른 달 = 해를 넘긴 기수 (예: 마감 12/20, 5회차 1/15)
  const year = seasonYear() + (deadlineMonth && m < deadlineMonth ? 1 : 0)
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

export function calendarData(): CalendarData {
  const year = seasonYear()
  const meetings: CalendarMeeting[] = SEASON.sessions.flatMap((s, i) =>
    s.dates.map((d, di) => {
      const [month, day] = d.split("/").map(Number)
      return { date: d, month, day, round: i + 1, closed: !!SEASON.days[di]?.closed }
    }),
  )
  // fifth.date "11/1 (일)" → 11/1
  const freeDate = SEASON.fifth.date.split(" ")[0]
  const [fm, fd] = freeDate.split("/").map(Number)
  const free = { date: freeDate, month: fm, day: fd, label: "자유독서" }

  const monthNums: number[] = []
  for (const m of [...meetings.map((x) => x.month), fm]) {
    if (!monthNums.includes(m)) monthNums.push(m)
  }
  monthNums.sort((a, b) => a - b)
  const months: CalendarMonth[] = monthNums.map((m) => ({
    name: `${m}월`,
    eng: `${MONTH_ENG[m - 1]}. ${year}`,
    year,
    month: m,
  }))
  return { months, meetings, free }
}
