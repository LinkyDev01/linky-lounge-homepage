import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "레이지데이 북클럽 신청하기",
  description: "레이지데이 북클럽 참여 신청 — 인터뷰를 통해 서로의 결을 확인한 뒤 함께합니다.",
  openGraph: {
    title: "레이지데이 북클럽 신청하기",
    description: "레이지데이 북클럽 참여 신청 — 인터뷰를 통해 서로의 결을 확인한 뒤 함께합니다.",
    images: ["/linky-lounge/book-club/lazy%20is%20a.png"],
  },
}

export default function BookClubApplyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
