import type { Metadata } from "next"
import type React from "react"
import "./fonts.css"

export const metadata: Metadata = {
  title: "홈 v3 시안 · 레이지데이 북클럽",
}

export default function HomeV3Layout({ children }: { children: React.ReactNode }) {
  return children
}
