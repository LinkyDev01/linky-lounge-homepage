import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "레이지데이 북클럽 신청하기",
  description: "복잡함 속에서 찾는 단순함 — 레이지데이 북클럽",
  openGraph: {
    title: "레이지데이 북클럽 신청하기",
    description: "복잡함 속에서 찾는 단순함 — 레이지데이 북클럽",
    images: ["/linky-lounge/book-club/bookclub-og-image.png"],
  },
}

export default function BookClubApplyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
