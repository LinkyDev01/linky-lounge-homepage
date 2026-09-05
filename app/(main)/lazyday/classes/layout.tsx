import type { Metadata } from "next"
import type React from "react"

/** 반배정 열람 (2026-09-05) — 멤버에게 링크로 주는 페이지. 색인되면 안 된다 (noindex + robots.ts 이중). */
export const metadata: Metadata = {
  title: "반배정 · 레이지데이 북클럽",
  robots: { index: false, follow: false },
}

export default function ClassesLayout({ children }: { children: React.ReactNode }) {
  return children
}
