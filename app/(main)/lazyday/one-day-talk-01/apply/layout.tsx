import type { Metadata } from "next"
import type React from "react"

/**
 * 원데이 토크 신청 메타 (SEO 2026-08-12) — 페이지가 "use client"라 레이아웃으로 보충.
 * 두 도메인(북클럽·레이지클럽)에서 열리는 공개 페이지 — 상대 canonical은
 * metadataBase 호스트 분기 덕에 각 도메인 자기 정본으로 해석된다. 사이트맵 등재 대상.
 */
export const metadata: Metadata = {
  title: "원데이 토크 신청 · 레이지데이",
  description:
    "책과 영화를 하루의 대화로 만나는 원데이 토크. 회차를 고르고 신청하세요 — 서울 사당 링키라운지에서 열립니다.",
  alternates: { canonical: "/one-day-talk-01/apply" },
}

export default function OnedayApplyLayout({ children }: { children: React.ReactNode }) {
  return children
}
