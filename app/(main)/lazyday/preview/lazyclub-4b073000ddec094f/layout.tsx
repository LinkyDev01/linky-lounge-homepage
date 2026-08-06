import type { Metadata } from "next"

// 레이지 클럽 트리 전용 메타 (운영자 라운드 24)
// OG 이미지 = 운영자 제공 LazyClub 워드서치 마크
// (라운드 49 교체 — 드라이브 og_img.png 3000×1350 원본 → 1200×540 최적화. 새 파일명으로 SNS 캐시 회피)
// robots noindex는 상위 프리뷰 레이아웃이 유지.
export const metadata: Metadata = {
  title: "레이지클럽",
  description: "저마다 다른 삶의 궤적 속 불협화음이 예술의 본질을 관통하며 하나의 선율이 되는 순간을 믿습니다.",
  openGraph: {
    title: "레이지클럽",
    description: "저마다 다른 삶의 궤적 속 불협화음이 예술의 본질을 관통하며 하나의 선율이 되는 순간을 믿습니다.",
    images: ["/linky-lounge/book-club/home-v3/og-lazyclub-v2.png"],
    type: "website",
  },
  // 파비콘 — 운영자 제공 LC 픽셀 마크 (드라이브 원본 3240px → 32/192/180 최적화)
  icons: {
    icon: [
      { url: "/linky-lounge/book-club/home-v3/favicon-lazyclub-32.png", sizes: "32x32", type: "image/png" },
      { url: "/linky-lounge/book-club/home-v3/favicon-lazyclub-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/linky-lounge/book-club/home-v3/apple-touch-lazyclub.png",
  },
}

export default function LazyClubLayout({ children }: { children: React.ReactNode }) {
  return children
}
