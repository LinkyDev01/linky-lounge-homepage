import type { Metadata } from "next"
import type React from "react"
import { headers } from "next/headers"
import { PreviewBar } from "./PreviewBar"

// 명조는 루트 레이아웃의 CDN 로드 + globals.css --font-noto-serif 정의를 그대로 사용 (2026-07-27 전환)

// 프리뷰는 검색 노출 제외 — 단 **lazy-club.com 호스트는 예외** (SEO 2026-08-12):
// 레이지클럽 랜딩(/)이 미들웨어로 이 트리(coming-soon)에 rewrite되는 구조라,
// 정적 noindex를 유지하면 레이지클럽 도메인 전체가 검색에서 사라진다.
// 시안 경로(/preview/…)는 lazy-club에서도 robots.txt disallow가 이중 차단.
// vercel.app 프리뷰·북클럽 난수 슬러그는 종전대로 noindex.
export async function generateMetadata(): Promise<Metadata> {
  const host = ((await headers()).get("host") || "").toLowerCase()
  const isLazyclub = !host.includes("lazyday-bookclub.com") && host.includes("lazy-club.com")
  return {
    title: "미리보기 · 레이지데이 북클럽",
    robots: isLazyclub ? { index: true, follow: true } : { index: false, follow: false },
  }
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
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
