import type { MeetupCategory, CategoryStyle } from "@/types"

export const CATEGORY_STYLES: Record<MeetupCategory, CategoryStyle> = {
  gathering: {
    bg: "bg-rose-light",
    text: "text-rose",
    label: "게더링",
    dot: "bg-rose",
  },
  focus: {
    bg: "bg-sage-light",
    text: "text-sage",
    label: "몰입의 밤",
    dot: "bg-sage",
  },
  language: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    label: "외국어 회화",
    dot: "bg-blue-500",
  },
  potato: {
    bg: "bg-pink-100",
    text: "text-pink-600",
    label: "감튀소개팅",
    dot: "bg-pink-500",
  },
  bookclub: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    label: "독서모임",
    dot: "bg-amber-700",
  },
}
