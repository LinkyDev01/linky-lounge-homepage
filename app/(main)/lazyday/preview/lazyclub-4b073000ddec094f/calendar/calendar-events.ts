import { ONE_DAY_MEETINGS } from "../one-day-config"
import { BASE, BOOKCLUB_URL } from "../Shell"
import { SEASON, seasonYear } from "../../../season-config"
import { season3Config } from "../../../book-config"

/**
 * 캘린더 일정 (라운드 95 도입 · 97 슬롯 · 99 **모임/일정 분리**)
 *
 * 구조 (운영자 라운드 99: "한 모임은 한 포스터와 정보만. 다른 날이라고 정보까지
 * 계속 놓는 게 아냐 / 개별일정은 캘린더, 그 밑 모임섹션에는 기수별로 묶어서 하나로"):
 *
 *   ClubProgram — **모임 한 건** = 포스터 + 정보 한 벌. 아래 목록이 이걸 렌더한다.
 *                 정규 기수는 회차·요일이 몇 개든 프로그램 하나로 묶는다.
 *   ClubEvent   — **개별 일정 한 날**. 캘린더 칸만 이걸 쓴다.
 *                 칸 표기는 "n기 n회차 레이지데이 북클럽" (운영자 지정 형식).
 *
 * 출처:
 *   · 4기 ← `season-config.ts` (sessions/fifth) — 기수 전환 시 여기만 고치면 따라온다
 *   · 3기 ← 아래 SEASON3_SESSIONS. ⚠️ season-config 는 **현재 기수만** 담아서 지난 기수의
 *          회차 날짜는 단일 출처가 없다. 운영자 제공 구글 캘린더의 '레이지데이' 일정과
 *          `book-config` 의 3기 dateRange("7.15 – 9.6")로 확정했다
 *          (7/29·7/30·8/2, 8/12·8/13·8/16, 8/26·8/27·8/30 전부 스크린샷과 일치).
 *          3기 시간대는 미제공 → 비워 둔다
 *   · 원데이 토크 ← `one-day-config.ts`
 *   · 무비토크 ← MOVIE_TALKS (전용 config 생기면 이관)
 */

export type EventCategory = "bookclub" | "booktalk" | "movie"

/** 레이지클럽 승인 팔레트 안에서만 배정 (§3: 새 색 도입은 운영자 승인 필요) */
export const CATEGORY_TONE: Record<EventCategory, { label: string; color: string }> = {
  bookclub: { label: "레이지데이 북클럽", color: "#d2691e" },
  booktalk: { label: "원데이 토크", color: "#845d5e" },
  movie: { label: "무비토크", color: "#96ab9b" },
}

/** 모임 한 건 — 포스터·정보는 여기 한 벌만 */
export type ClubProgram = {
  id: string
  category: EventCategory
  title: string
  /** 묶은 일정 설명 (예: "9/7 – 11/1 · 격주 화·수·일") */
  schedule: string
  /** 요일별 시간대. 비었으면 감춘다 */
  times: string[]
  price: string
  description: string
  image: string
  href: string
  external: boolean
  cta: string
  /** "진행 중" 같은 보조 표기. 비었으면 감춘다 */
  note: string
}

/** 개별 일정 한 날 — 캘린더 칸 전용 */
export type ClubEvent = {
  id: string
  programId: string
  year: number
  month: number // 1-12
  day: number
  category: EventCategory
  /** 칸 표기 — 정규 기수는 "4기 1회차 레이지데이 북클럽" (운영자 지정) */
  cellLabel: string
}

const IMG = "/linky-lounge/book-club/home-v3"

/** 3기 회차 일정 — 수·목·일 격주 (출처는 파일 머리 주석 참조) */
const SEASON3_SESSIONS: Array<{ label: string; dates: string[] }> = [
  { label: "1회차", dates: ["7/15", "7/16", "7/19"] },
  { label: "2회차", dates: ["7/29", "7/30", "8/2"] },
  { label: "3회차", dates: ["8/12", "8/13", "8/16"] },
  { label: "4회차", dates: ["8/26", "8/27", "8/30"] },
  { label: "5회차", dates: ["9/6"] },
]

/** 무비토크 — 전용 config 가 없어 여기 둔다 (운영자 2026-08-07: 8/2, 19시, 참가비 문의) */
const MOVIE_TALKS: Array<{ date: string; title: string; time: string; price: string }> = [
  { date: "8/2", title: "『호프』 무비토크", time: "19:00", price: "참가비 문의" },
]

/** "8.9 (일) 19:00–22:00" → "19:00–22:00" */
function timeFromOneDay(date: string): string {
  const m = date.match(/\)\s*(.+)$/)
  return m ? m[1].trim() : ""
}
/** "8.9 (일) …" → [8, 9] */
function mdFromOneDay(date: string): [number, number] {
  const m = date.match(/^(\d+)\.(\d+)/)
  return m ? [Number(m[1]), Number(m[2])] : [0, 0]
}

const YEAR = seasonYear()

// ── 프로그램 (모임) — 포스터·정보 한 벌씩 ─────────────────────
const PROGRAMS: ClubProgram[] = [
  {
    id: "season-4",
    category: "bookclub",
    title: `레이지데이 북클럽 ${SEASON.name}`,
    schedule: `${SEASON.periodLabel} · 격주 화·수·일 · 정규 4회 + ${SEASON.fifth.label}`,
    // 일요일은 오전·오후 2슬롯이라 config 가 time 을 ", " 로 이어 둔다 → 줄로 나눠 표기
    times: SEASON.days.flatMap((d) => {
      const parts = d.time.split(",").map((t) => t.trim())
      return parts.map((t, i) =>
        parts.length > 1 ? `${d.label} ${i === 0 ? "오전" : "오후"} ${t}` : `${d.label} ${t}`,
      )
    }),
    price: SEASON.price,
    description: SEASON.regularNote,
    image: `${IMG}/hero-4th-poster.webp`,
    href: BOOKCLUB_URL,
    external: true,
    cta: "자세히 보기",
    note: "모집 중",
  },
  {
    id: "season-3",
    category: "bookclub",
    title: `레이지데이 북클럽 ${season3Config.label}`,
    schedule: `${season3Config.dateRange} · 격주 수·목·일 · 정규 4회 + 5회차`,
    times: [], // 3기 시간대는 미제공
    price: "",
    description: "",
    image: `${IMG}/poster-3rd.webp`,
    href: BOOKCLUB_URL,
    external: true,
    cta: "자세히 보기",
    note: season3Config.ongoing ? "진행 중" : "종료",
  },
  ...ONE_DAY_MEETINGS.map((m) => ({
    id: `oneday-${m.slug}`,
    category: "booktalk" as const,
    title: m.title,
    schedule: m.date,
    times: [] as string[],
    price: `${m.price.toLocaleString("ko-KR")}원`,
    description: m.description[0] ?? "",
    image: m.thumbnail,
    href: `${BASE}/meetings/${m.slug}`,
    external: false,
    cta: "자세히 보기",
    note: m.status === "soldout" ? "마감" : m.status === "upcoming" ? "오픈 예정" : "모집 중",
  })),
  ...MOVIE_TALKS.map((t, i) => ({
    id: `movie-${i}`,
    category: "movie" as const,
    title: t.title,
    schedule: `${t.date.replace("/", "월 ")}일 · ${t.time}`,
    times: [] as string[],
    price: t.price,
    description: "",
    image: "",
    // 참가비가 "문의"라 문의 창구가 필요하다 → 사이트 기존 카카오 채널 (season-config)
    href: SEASON.notifyKakaoUrl,
    external: true,
    cta: "문의하기",
    note: "",
  })),
]

// ── 개별 일정 (캘린더 칸) ──────────────────────────────────────
function seasonEvents(
  programId: string,
  seasonName: string,
  sessions: Array<{ label: string; dates: string[] }>,
): ClubEvent[] {
  return sessions.flatMap((s) =>
    s.dates.map((d) => {
      const [month, day] = d.split("/").map(Number)
      return {
        id: `${programId}-${d}`,
        programId,
        year: YEAR,
        month,
        day,
        category: "bookclub" as const,
        // 운영자 지정 형식: "n기 n회차 레이지데이 북클럽"
        cellLabel: `${seasonName} ${s.label} 레이지데이 북클럽`,
      }
    }),
  )
}

const EVENTS: ClubEvent[] = [
  ...seasonEvents("season-4", SEASON.name, [
    ...SEASON.sessions.map((s) => ({ label: s.label, dates: s.dates })),
    { label: SEASON.fifth.label, dates: [SEASON.fifth.date.split(" ")[0]] },
  ]),
  ...seasonEvents("season-3", season3Config.label, SEASON3_SESSIONS),
  ...ONE_DAY_MEETINGS.map((m) => {
    const [month, day] = mdFromOneDay(m.date)
    return {
      id: `oneday-${m.slug}`,
      programId: `oneday-${m.slug}`,
      year: YEAR,
      month,
      day,
      category: "booktalk" as const,
      cellLabel: m.title,
    }
  }),
  ...MOVIE_TALKS.map((t, i) => {
    const [month, day] = t.date.split("/").map(Number)
    return {
      id: `movie-${i}`,
      programId: `movie-${i}`,
      year: YEAR,
      month,
      day,
      category: "movie" as const,
      cellLabel: t.title,
    }
  }),
]

/** month 는 0-11 (Date 규약) */
export function eventsFor(year: number, month: number): ClubEvent[] {
  return EVENTS.filter((e) => e.year === year && e.month === month + 1).sort((a, b) => a.day - b.day)
}

/** 일정이 걸린 모임들 — **중복 없이 한 번씩**. day 를 주면 그 날 걸린 모임만 */
export function programsFor(year: number, month: number, day?: number | null): ClubProgram[] {
  const ids = new Set(
    eventsFor(year, month)
      .filter((e) => day == null || e.day === day)
      .map((e) => e.programId),
  )
  return PROGRAMS.filter((p) => ids.has(p.id))
}

export { timeFromOneDay }
