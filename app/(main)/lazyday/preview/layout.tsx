import type { Metadata } from "next"
import type React from "react"
import { PreviewBar } from "./PreviewBar"

export const metadata: Metadata = {
  title: "미리보기 · 레이지데이 북클럽",
  robots: { index: false, follow: false }, // 프리뷰는 검색 노출 제외
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PreviewBar />
      {children}
    </>
  )
}
