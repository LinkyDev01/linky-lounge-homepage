import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "서면 인터뷰 — 레이지데이 북클럽",
  description: "서면 인터뷰 답변을 작성해주세요.",
  openGraph: {
    title: "서면 인터뷰 — 레이지데이 북클럽",
    description: "서면 인터뷰 답변을 작성해주세요.",
    images: ["/linky-lounge/book-club/lazy%20is%20a.png"],
  },
}

export default function WrittenInterviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
