export type MeetupCategory = "gathering" | "focus" | "language" | "potato" | "bookclub"

export interface Meetup {
  id: number
  title: string
  date: string
  day: number
  time: string
  category: MeetupCategory
  capacity: number
  current: number
  price: string
  description: string
  image: string
  registrationUrl?: string
  // 남/녀 구분 정원 (와인 파티 등)
  maleCapacity?: number
  maleCurrent?: number
  femaleCapacity?: number
  femaleCurrent?: number
}

export interface CategoryStyle {
  bg: string
  text: string
  label: string
  dot?: string
}

export interface SpaceInfo {
  name: string
  capacity: string
  description: string
  highlights: string[]
}
