import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "링키라운지 | 레이지데이 북클럽 이용안내",
  description: "레이지데이 북클럽 모임 장소 안내 — 찾아오는 길, 입구, 주차, Wi-Fi",
  openGraph: {
    title: "링키라운지 | 레이지데이 북클럽 이용안내",
    description: "레이지데이 북클럽 모임 장소 안내 — 찾아오는 길, 입구, 주차, Wi-Fi",
    // 공유 썸네일은 **북클럽 홈과 같은 하트 이미지**로 통일 (운영자 2026-09-10 "오픈그래프도 아이러브레이지데이
    // 레이지데이북클럽과 같이 해. 이미지만" — 제목·설명은 이 페이지 것 그대로). 종전 `lazy is a.png`(1200×1200)는
    // 홈(og-lazyday-heart-v5.png, 1200×630)과 달라 링크를 뿌릴 때 다른 그림이 떴다.
    images: ["/linky-lounge/book-club/og-lazyday-heart-v5.png"],
    url: "https://www.lazyday-bookclub.com/lounge-info",
  },
  // 파비콘 — 북클럽 홈이 쓰는 **바로 그 파일**(`app/(main)/lazyday/icon.png`, 파일 규약)의 사본. 상위 세그먼트
  // 아이콘이 이미 상속되지만, 루트 favicon.ico(링키라운지)가 먼저 나열되는 브라우저 편차를 없애려 여기서 명시한다
  // (운영자 2026-09-09 "파비콘 역시 lazyday-bookclub.com 에서 사용하는 것과 동일한 걸로"). 홈 화면용 apple 만
  // 로고 마스터 SVG 에서 180px 로 렌더(같은 마크).
  icons: {
    icon: [{ url: "/linky-lounge/book-club/home-v3/favicon-lazyday.png", sizes: "130x125", type: "image/png" }],
    apple: "/linky-lounge/book-club/home-v3/apple-touch-lazyday.png",
  },

}

export default function LazyDayLoungeInfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 제목용 Gothic A1 600 — 레이지클럽 트리는 fonts-inline.css(300KB 스냅숏)로 싣지만 이 페이지 하나에
          그걸 얹지 않고 같은 출처(fonts.googleapis)에서 한 굵기만 받는다. 본문 Pretendard 는 상위 레이아웃. */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@600&display=swap" />
      {children}
    </>
  )
}
