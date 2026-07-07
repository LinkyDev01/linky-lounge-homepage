import type { Metadata } from "next"
import type React from "react"
import { Noto_Serif_KR, Nanum_Pen_Script } from "next/font/google"
import { PreviewBar } from "./PreviewBar"

// 책 소개 본문용 명조 (semibold) — 운영자 지정 폰트
const notoSerif = Noto_Serif_KR({
  weight: ["500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-serif",
  preload: false,
})

// SCENES 폴라로이드 캡션용 손글씨 — 폰트 예외 등재 (운영자 확정 2026-07-07)
const nanumPen = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nanum-pen",
  preload: false,
})

export const metadata: Metadata = {
  title: "미리보기 · 레이지데이 북클럽",
  robots: { index: false, follow: false }, // 프리뷰는 검색 노출 제외
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${notoSerif.variable} ${nanumPen.variable}`}>
      {/* 책 제목용 Pretendard (사이트 전역엔 미로드 상태라 프리뷰에서만 로드) */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
      />
      <PreviewBar />
      {children}
    </div>
  )
}
