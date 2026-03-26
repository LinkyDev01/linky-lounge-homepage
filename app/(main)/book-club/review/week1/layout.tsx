import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "레이지데이 01: 기록과 여운",
  openGraph: {
    images: ["/linky-lounge/book-club/bookclub-og-image.png"],
  },
}

export default function BookClubReviewWeek1Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
