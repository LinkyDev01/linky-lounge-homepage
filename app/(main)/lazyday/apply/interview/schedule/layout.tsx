import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "전화 인터뷰 일정 선택 — 레이지데이 북클럽",
  description: "인터뷰 날짜와 시간을 선택해주세요.",
  openGraph: {
    title: "전화 인터뷰 일정 선택 — 레이지데이 북클럽",
    description: "인터뷰 날짜와 시간을 선택해주세요.",
    images: ["/linky-lounge/book-club/lazy%20is%20a.png"],
  },
}

export default function InterviewScheduleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
