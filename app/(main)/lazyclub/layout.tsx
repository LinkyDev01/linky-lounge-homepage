import "./fonts-inline.css" // 서체 @font-face 인라인 — 새로고침 스왑 해소 (파일 머리 주석)
import type { Metadata } from "next"
import { headers } from "next/headers"

// 레이지 클럽 트리 전용 메타 (운영자 라운드 24)
// OG 이미지 = 운영자 제공 LazyClub 워드서치 마크
// (라운드 53 교체 — 드라이브 og_img.png 3600×1890 → 1200×630. OG 권장비 1.91:1 정확히 일치.
//  교체 때마다 파일명을 올린다: SNS·CDN이 URL 단위로 캐시하므로 덮어쓰면 갱신이 늦다)
const metadata: Metadata = {
  title: "레이지클럽",
  description: "저마다 다른 삶의 궤적 속 불협화음이 예술의 본질을 관통하여 하나의 선율이 되는 순간을 소망합니다.",
  openGraph: {
    // 링크 미리보기 제목 — 운영자 지정 표기 (라운드 51 · 129: 파이프 → 엠대시). 탭 제목은 "레이지클럽" 유지
    title: "레이지클럽 — lazy-club.com",
    description: "저마다 다른 삶의 궤적 속 불협화음이 예술의 본질을 관통하여 하나의 선율이 되는 순간을 소망합니다.",
    images: ["/linky-lounge/book-club/home-v3/og-lazyclub-v4.png"],
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

/** robots — 2026-08-21 프리뷰 졸업으로 상위 프리뷰 레이아웃이 사라졌다. 그 레이아웃이
 *  하던 **호스트별 판정을 그대로 승계**한다(SEO 2026-08-12 결정 유지):
 *  · lazy-club.com = 이 트리가 곧 그 도메인의 실사이트 → index
 *  · 그 외(북클럽 도메인의 /lazyclub, vercel.app 브랜치 프리뷰) = 같은 문서가 두 번
 *    색인되지 않도록 noindex. 북클럽 도메인 경로는 운영자 검토용이다 */
export async function generateMetadata(): Promise<Metadata> {
  const host = ((await headers()).get("host") || "").toLowerCase()
  const isLazyclub = !host.includes("lazyday-bookclub.com") && host.includes("lazy-club.com")
  return { ...metadata, robots: isLazyclub ? { index: true, follow: true } : { index: false, follow: false } }
}

/** 첫 방문 인트로의 **선(先) 가림막** (2026-08-22).
 *
 *  오버레이만으로는 늦다 — React 가 하이드레이트된 뒤에야 뜨므로 그 전까지 손님이
 *  요청한 페이지가 먼저 보였다가 인트로가 덮치는 꼴이 된다(실측). 그래서 첫 페인트
 *  **전에** 도는 인라인 스크립트가 관람 여부를 판정해 <html> 에 표식을 달고, CSS 가
 *  즉시 종이색으로 덮는다. 애니메이션은 하이드레이트 후 IntroOverlay 가 이어받는다.
 *
 *  판정 조건은 IntroOverlay 와 같아야 한다 — 여기서 덮었는데 저기서 안 그리면
 *  종이색 화면에 갇힌다. 그래서 **저장 기록은 여기서 쓰지 않고 읽기만** 하고,
 *  기록·해제는 전부 IntroOverlay 가 한다(단일 책임). 스크립트가 아예 안 돌면
 *  표식이 없어 평소처럼 보인다 — 실패해도 손님이 갇히지 않는 방향으로 기울였다. */
const INTRO_PRECOVER = `(function(){try{
var p=location.pathname;
if(p==='/'||p==='/coming-soon'||p==='/lazyclub/coming-soon')return;
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var q=location.search;if(q.indexOf('t=')>-1||q.indexOf('still=')>-1)return;
if(localStorage.getItem('lzc-intro-seen'))return;
document.documentElement.setAttribute('data-lzc-intro','1');
}catch(e){}})()`

export default function LazyClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO_PRECOVER }} />
      {children}
    </>
  )
}
