import { ONE_DAY_MEETINGS } from "../one-day-config"
import { BASE, BOOKCLUB_URL } from "../Shell"
import { SEASON, seasonYear } from "../../../season-config"

/**
 * 캘린더 일정 — **단일 출처에서 파생** (라운드 95, 운영자 지시로 실데이터 투입).
 *
 *   · 레이지데이 북클럽 4기  ← `season-config.ts` 의 sessions/fifth (하드코딩 금지)
 *   · 원데이 토크 2건        ← `one-day-config.ts` 의 ONE_DAY_MEETINGS
 *   · 무비토크               ← 아래 MOVIE_TALKS (운영자 구두 제공, 전용 config 생기면 이관)
 *
 * 기수가 바뀌면 season-config 만 고치면 캘린더도 따라온다.
 *
 * ⚠️ 원본 컴포넌트는 `useGoogleCalendarMeetups` 로 구글 캘린더를 읽는다. 이 시안은
 * 위 config 들이 이미 확정 일정을 갖고 있어 그쪽을 쓰지 않는다 — 실이식 때 어느 쪽을
 * 소스로 삼을지(구글 캘린더 vs config)는 운영자 결정 사항.
 */

export type EventCategory = "bookclub" | "booktalk" | "movie"

/** 레이지클럽 승인 팔레트 안에서만 배정 (§3: 새 색 도입은 운영자 승인 필요) */
export const CATEGORY_TONE: Record<EventCategory, { label: string; color: string }> = {
  bookclub: { label: "레이지데이 북클럽", color: "#d2691e" },
  booktalk: { label: "원데이 토크", color: "#845d5e" },
  movie: { label: "무비토크", color: "#96ab9b" },
}

export type ClubEvent = {
  id: string
  year: number
  month: number // 1-12
  day: number
  category: EventCategory
  title: string
  /** 빈 문자열이면 화면에서 감춘다 (미정) */
  time: string
  price: string
  description: string
  image: string
  href: string
  /** 외부 도메인이면 새 탭 */
  external: boolean
}

/** 무비토크 — 아직 전용 config 가 없어 여기 둔다 (운영자 2026-08-07: "8/2 호프 - 무비토크").
 *  시간·참가비는 미제공이라 비워 둔다 (임의로 지어내지 않는다). */
const MOVIE_TALKS: Array<{ date: string; title: string }> = [{ date: "8/2", title: "『호프』 무비토크" }]

const IMG = "/linky-lounge/book-club/home-v3"

/** "8.9 (일) 19:00–22:00" / "8.2 (일) 19:00-22:00" → "19:00–22:00" */
function timeFromOneDay(date: string): string {
  const m = date.match(/\)\s*(.+)$/)
  return m ? m[1].trim() : ""
}
/** "8.9 (일) …" → [8, 9] */
function mdFromOneDay(date: string): [number, number] {
  const m = date.match(/^(\d+)\.(\d+)/)
  return m ? [Number(m[1]), Number(m[2])] : [0, 0]
}

export function buildEvents(): ClubEvent[] {
  const year = seasonYear()
  const out: ClubEvent[] = []

  // ── 레이지데이 북클럽 4기 정규 1–4회차 ──
  // dates 배열 순서 = SEASON.days 순서 (화·수·일) — config 주석에 명시된 계약.
  // 각 회차는 세 요일 중 하나를 고르는 구조라, 세 날짜 모두 캘린더에 올린다.
  SEASON.sessions.forEach((s, si) => {
    s.dates.forEach((d, di) => {
      const [month, day] = d.split("/").map(Number)
      const slot = SEASON.days[di]
      out.push({
        id: `bookclub-${si}-${di}`,
        year,
        month,
        day,
        category: "bookclub",
        title: `레이지데이 북클럽 ${SEASON.name} ${s.label}`,
        time: slot.time,
        price: SEASON.price,
        description: `${slot.label} 진행. ${SEASON.regularNote}`,
        image: `${IMG}/hero-4th-poster.webp`,
        href: BOOKCLUB_URL,
        external: true,
      })
    })
  })

  // ── 5회차 (자유 독서모임) ──
  {
    const [month, day] = SEASON.fifth.date.split(" ")[0].split("/").map(Number)
    out.push({
      id: "bookclub-fifth",
      year,
      month,
      day,
      category: "bookclub",
      title: `레이지데이 북클럽 ${SEASON.name} ${SEASON.fifth.label}`,
      time: SEASON.fifth.timeLabel,
      price: "",
      description: SEASON.freeNote,
      image: `${IMG}/hero-4th-poster.webp`,
      href: BOOKCLUB_URL,
      external: true,
    })
  }

  // ── 원데이 토크 (one-day-config 단일 출처) ──
  ONE_DAY_MEETINGS.forEach((m) => {
    const [month, day] = mdFromOneDay(m.date)
    out.push({
      id: `oneday-${m.slug}`,
      year,
      month,
      day,
      category: "booktalk",
      title: m.title,
      time: timeFromOneDay(m.date),
      price: `${m.price.toLocaleString("ko-KR")}원`,
      description: m.description[0] ?? "",
      image: m.thumbnail,
      href: `${BASE}/meetings/${m.slug}`,
      external: false,
    })
  })

  // ── 무비토크 ──
  MOVIE_TALKS.forEach((t, i) => {
    const [month, day] = t.date.split("/").map(Number)
    out.push({
      id: `movie-${i}`,
      year,
      month,
      day,
      category: "movie",
      title: t.title,
      time: "",
      price: "",
      description: "",
      image: "",
      href: "",
      external: false,
    })
  })

  return out
}

const ALL = buildEvents()

/** month 는 0-11 (Date 규약) */
export function eventsFor(year: number, month: number): ClubEvent[] {
  return ALL.filter((e) => e.year === year && e.month === month + 1).sort((a, b) => a.day - b.day)
}
