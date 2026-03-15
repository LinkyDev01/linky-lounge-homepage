import type { Meetup } from "@/types"

export const MEETUPS: Meetup[] = [
  {
    id: 1,
    title: "신년 와인 테이스팅",
    date: "2026-01-18",
    day: 18,
    time: "19:00 - 21:30",
    category: "gathering",
    capacity: 12,
    current: 8,
    price: "35,000원",
    description:
      "소믈리에와 함께하는 신년 특별 와인 테이스팅. 3종의 프리미엄 와인과 페어링 안주를 즐겨보세요.",
    image: "/wine-tasting-elegance.png",
  },
  {
    id: 2,
    title: "몰입의 밤 - 나만의 시간",
    date: "2026-01-22",
    day: 22,
    time: "19:00 - 22:00",
    category: "focus",
    capacity: 10,
    current: 6,
    price: "15,000원",
    description:
      "스마트폰과 알림에서 벗어나, 오직 자신의 작업과 내면에 집중하는 3시간의 몰입 의식.",
    image: "/cozy-book-club-meeting-with-warm-lighting.jpg",
  },
  {
    id: 3,
    title: "크리에이터 네트워킹 나이트",
    date: "2026-01-25",
    day: 25,
    time: "18:30 - 21:00",
    category: "gathering",
    capacity: 20,
    current: 15,
    price: "20,000원",
    description:
      "프리랜서, 크리에이터를 위한 네트워킹 이벤트. 가벼운 음료와 함께 새로운 인연을 만나보세요.",
    image: "/professional-networking-event-with-people-chatting.jpg",
  },
  {
    id: 4,
    title: "설날 특별 게더링",
    date: "2026-01-28",
    day: 28,
    time: "17:00 - 20:00",
    category: "gathering",
    capacity: 15,
    current: 10,
    price: "25,000원",
    description:
      "설 연휴를 맞아 진행되는 게더링. 다양한 사람들과 함께 즐거운 시간을 보내세요.",
    image: "/social-party-celebration-with-festive-decorations.jpg",
  },
]
