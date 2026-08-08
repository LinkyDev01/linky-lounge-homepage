import type { Meetup, MeetupCategory } from "@/types"

/**
 * 시안 전용 표본 데이터 (라운드 93) — 디자인 검토용이며 실데이터가 아니다.
 *
 * 실제 소스는 `useGoogleCalendarMeetups(year, month)` 이고, 이 컴포넌트는 그 계약을
 * 그대로 쓴다. 다만 폴백 상수 `MEETUPS` 는 2026년 1월 자료만 있어 지금 열면 늘 빈 달로
 * 보이므로, 시안에서는 **보고 있는 달**에 맞춰 표본을 깔아 레이아웃을 확인한다.
 * 이식할 때는 이 파일을 지우고 훅 결과만 쓰면 된다.
 */

/** 레이지클럽 톤 카테고리 색 — linkylounge 의 CATEGORY_STYLES(Tailwind 토큰)를
 *  건드리지 않고 이 트리 안에서만 재정의한다 (공유 상수 오염 방지). */
export const CATEGORY_TONE: Record<MeetupCategory, { label: string; color: string }> = {
  gathering: { label: "게더링", color: "#845d5e" },
  focus: { label: "몰입의 밤", color: "#96ab9b" },
  language: { label: "외국어 회화", color: "#d2691e" },
  potato: { label: "감튀소개팅", color: "#a0785a" },
  bookclub: { label: "독서모임", color: "#1a1208" },
}

const IMG = "/linky-lounge/book-club/home-v3"

/** 보고 있는 달 기준으로 표본 6건을 배치 (일자는 달 길이에 맞춰 클램프) */
export function previewMeetupsFor(year: number, month: number): Meetup[] {
  const last = new Date(year, month + 1, 0).getDate()
  const d = (n: number) => Math.min(n, last)
  const iso = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  const rows: Array<Omit<Meetup, "date"> & { day: number }> = [
    {
      id: 1,
      title: "몰입의 밤 — 나만의 시간",
      day: d(6),
      time: "19:00 - 22:00",
      category: "focus",
      capacity: 10,
      current: 6,
      price: "15,000원",
      description: "알림에서 벗어나 오직 자신의 작업과 내면에 집중하는 세 시간의 의식.",
      image: `${IMG}/oneday-talk.webp`,
    },
    {
      id: 2,
      title: "『시지프 신화』 원데이 토크",
      day: d(9),
      time: "19:00 - 22:00",
      category: "bookclub",
      capacity: 12,
      current: 9,
      price: "35,000원",
      description: "부조리를 직시하고, 반항과 자유로 오늘을 살아내는 태도를 이야기합니다.",
      image: `${IMG}/oneday-sisyphus.webp`,
      registrationUrl: "https://www.lazyday-bookclub.com",
    },
    {
      id: 3,
      title: "크리에이터 네트워킹 나이트",
      day: d(14),
      time: "18:30 - 21:00",
      category: "gathering",
      capacity: 20,
      current: 15,
      price: "20,000원",
      description: "각자의 작업을 가져와 서로의 다음 한 걸음을 거드는 자리.",
      image: `${IMG}/goods-tshirt.webp`,
    },
    {
      id: 4,
      title: "느슨한 영어 회화",
      day: d(14),
      time: "11:00 - 12:30",
      category: "language",
      capacity: 8,
      current: 3,
      price: "12,000원",
      description: "완벽한 문장 대신, 끝까지 말해보는 연습.",
      image: `${IMG}/goods-mug.webp`,
    },
    {
      id: 5,
      title: "감튀소개팅",
      day: d(21),
      time: "19:00 - 21:30",
      category: "potato",
      capacity: 12,
      current: 7,
      price: "35,000원",
      description: "감자튀김 한 접시를 사이에 두고 시작하는 대화.",
      image: `${IMG}/goods-coaster.webp`,
      maleCapacity: 6,
      maleCurrent: 4,
      femaleCapacity: 6,
      femaleCurrent: 3,
    },
    {
      id: 6,
      title: "『브람스를 좋아하세요...』 원데이 토크",
      day: d(27),
      time: "19:00 - 22:00",
      category: "bookclub",
      capacity: 12,
      current: 12,
      price: "35,000원",
      description: "익숙함과 외로움이 얽힌 관계 속에서 방황하는 인물들의 심리를 들여다봅니다.",
      image: `${IMG}/oneday-brahms.webp`,
      registrationUrl: "https://www.lazyday-bookclub.com",
    },
  ]

  return rows.map((r) => ({ ...r, date: iso(r.day) }))
}
