import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "링키라운지 | 레이지데이 북클럽 이용안내",
  description: "레이지데이 북클럽 모임 장소 안내 — 찾아오는 길, 입구, 주차, Wi-Fi",
  openGraph: {
    title: "링키라운지 | 레이지데이 북클럽 이용안내",
    description: "레이지데이 북클럽 모임 장소 안내 — 찾아오는 길, 입구, 주차, Wi-Fi",
    images: ["/linky-lounge/gallary/main.jpg"],
    url: "https://linkylounge.com/lazyday/lounge-info",
  },
}

export default function LazyDayLoungeInfoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
