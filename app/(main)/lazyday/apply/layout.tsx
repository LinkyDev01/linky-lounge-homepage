import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "레이지데이 북클럽 신청하기",
  openGraph: {
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
