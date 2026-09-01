import type { Metadata } from "next"
import type React from "react"

/**
 * 결제 트리(checkout·success·fail) 공통 메타 (SEO 2026-08-12) — 페이지들이 전부
 * "use client"라 metadata를 못 실어 레이아웃으로 보충한다.
 * 거래 페이지는 검색 결과에 잡히면 안 된다 — noindex + robots.ts disallow 이중 차단.
 */
export const metadata: Metadata = {
  title: "결제 · 레이지데이",
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
