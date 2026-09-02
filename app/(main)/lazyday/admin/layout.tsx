import type { Metadata } from "next"
import type React from "react"

/**
 * 관리 트리 공통 메타 (2026-09-02, admin.lazy-club.com 분리) — 페이지들이 전부
 * "use client"라 metadata 를 못 실어 레이아웃으로 보충한다 (checkout/layout.tsx 와 같은 패턴).
 * 관리 화면은 어느 호스트에서도 색인되면 안 된다 — noindex + robots.ts 의 관리 호스트 전면 disallow 이중 차단.
 * 래퍼 요소를 두지 않는다 — 상위 lazyday/layout.tsx 의 배경 래퍼와 각 페이지의 <main> 이 종전과 같이 그려진다.
 */
export const metadata: Metadata = {
  title: "관리 · 레이지클럽",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
