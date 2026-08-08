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
  /** 요일·슬롯 표기 ("화요일" / "일요일 오전" …). 없으면 감춘다 */
  slot: string
  /** 날짜 칸에 쓰는 짧은 이름 — 같은 날 여러 슬롯이 겹칠 때 구분되도록 (라운드 97) */
  cellLabel: string
  /** 빈 문자열이면 화면에서 감춘다 (미정) */
  time: string
  price: string
  description: string
  image: string
  href: string
  /** 외부 도메인이면 새 탭 */
  external: boolean
  /** 링크 문구 (기본 "자세히 보기") */
  cta: string
}

/** 무비토크 — 아직 전용 config 가 없어 여기 둔다 (운영자 2026-08-07: "8/2 호프 - 무비토크").
 *  라운드 98: 시간 19시, 참가비는 "문의" (운영자). 종료 시각은 미제공이라 시작만 적는다. */
const MOVIE_TALKS: Array<{ date: string; title: string; time: string; price: string }> = [
  { date: "8/2", title: "『호프』 무비토크", time: "19:00", price: "참가비 문의" },
]

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
  // 각 회차는 요일 슬롯 중 하나를 고르는 구조라, 모든 슬롯을 캘린더에 올린다.
  // ⚠️ 일요일은 **오전·오후 2슬롯**이고 config 가 time 을 ", " 로 이어 둔다
  //    ("10:30–13:30, 14:30–17:30"). 쪼개서 각각을 독립 일정으로 세운다 (라운드 97).
  SEASON.sessions.forEach((s, si) => {
    s.dates.forEach((d, di) => {
      const [month, day] = d.split("/").map(Number)
      const dayDef = SEASON.days[di]
      const times = dayDef.time.split(",").map((t) => t.trim())
      const partNames = times.length > 1 ? ["오전", "오후"] : [""]
      times.forEach((time, ti) => {
        const part = partNames[ti] ?? ""
        const slot = part ? `${dayDef.label} ${part}` : dayDef.label
        // 셀 라벨: 같은 날 두 슬롯이 겹쳐도 구분되도록 회차 + 요일(+오전/오후)
        const short = dayDef.label.replace("요일", "")
        out.push({
          id: `bookclub-${si}-${di}-${ti}`,
          year,
          month,
          day,
          category: "bookclub",
          title: `레이지데이 북클럽 ${SEASON.name} ${s.label}`,
          slot,
          cellLabel: part ? `${s.label} ${short} ${part}` : `${s.label} ${short}`,
          time,
          price: SEASON.price,
          description: SEASON.regularNote,
          image: `${IMG}/hero-4th-poster.webp`,
          href: BOOKCLUB_URL,
          external: true,
          cta: "자세히 보기",
        })
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
      slot: "일요일",
      cellLabel: `${SEASON.fifth.label} 자유모임`,
      time: SEASON.fifth.timeLabel,
      price: "",
      description: SEASON.freeNote,
      image: `${IMG}/hero-4th-poster.webp`,
      href: BOOKCLUB_URL,
      external: true,
      cta: "자세히 보기",
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
      slot: "",
      cellLabel: m.title,
      time: timeFromOneDay(m.date),
      price: `${m.price.toLocaleString("ko-KR")}원`,
      description: m.description[0] ?? "",
      image: m.thumbnail,
      href: `${BASE}/meetings/${m.slug}`,
      external: false,
      cta: "자세히 보기",
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
      slot: "",
      cellLabel: t.title,
      time: t.time,
      price: t.price,
      description: "",
      image: "",
      // 참가비가 "문의"라 문의 창구가 필요하다 → 사이트 기존 카카오 채널 (season-config)
      href: SEASON.notifyKakaoUrl,
      external: true,
      cta: "문의하기",
    })
  })

  return out
}

const ALL = buildEvents()

/** month 는 0-11 (Date 규약) */
export function eventsFor(year: number, month: number): ClubEvent[] {
  return ALL.filter((e) => e.year === year && e.month === month + 1).sort(
    (a, b) => a.day - b.day || a.time.localeCompare(b.time),
  )
}
