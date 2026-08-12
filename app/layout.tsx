import type React from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { MetaPixelTracker } from "@/components/meta-pixel-tracker"
import "./globals.css"

const META_PIXEL_ID = "1691559202269440"
const GA_MEASUREMENT_ID = "G-3B2E7FK9MJ"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})
// 책 소개 카드 본문용 명조 Noto Serif KR — next/font/google 빌드 타임 다운로드가
// Vercel에서 간헐 실패해 빌드를 깨므로(2026-07-27) CDN 런타임 로드로 전환.
// --font-noto-serif 변수는 globals.css :root에서 정의.

export async function generateMetadata(): Promise<Metadata> {
  const host = ((await headers()).get("host") || "").toLowerCase()
  const isBookclub = host.includes("lazyday-bookclub.com")
  // "lazy-club.com"은 "lazyday-bookclub.com"의 부분 문자열이 아니라 안전 (SEO 3분기 2026-08-12)
  const isLazyclub = !isBookclub && host.includes("lazy-club.com")

  // 레이지클럽 정본 = www (애펙스가 www로 308, Vercel 도메인 설정 실측 2026-08-12).
  // 기본 title·description은 자체 metadata 없는 하위 페이지(결제 등)의
  // "링키라운지" 타이틀 누출을 막는 호스트별 폴백 — 랜딩은 각자 페이지 metadata가 덮는다.
  if (isLazyclub) {
    return {
      metadataBase: new URL("https://www.lazy-club.com"),
      title: "레이지클럽",
      description: "책과 영화를 하루의 대화로 만나는 원데이 토크, 그리고 레이지데이의 제품들.",
      other: {
        // 네이버 서치어드바이저 소유 확인 (운영자 발급 2026-08-12, lazy-club.com 전용)
        "naver-site-verification": "d6efbbbd0995819ae93e919622534e1d5315747c",
      },
      // 구글 서치콘솔 인증 코드는 운영자 발급 대기
    }
  }

  // 호스트별로 정확한 메타 도메인 인증 코드 하나만 노출 → 다중 태그로 인한 스크래퍼 모호함 제거
  const fbVerification = isBookclub
    ? "bhia7nsomik64va3kxe3q4npohn7xi" // lazyday-bookclub.com
    : "d4x4wq5k1cywer0jeh6fhhclbydhm3" // linkylounge.com
  if (isBookclub) {
    return {
      metadataBase: new URL("https://www.lazyday-bookclub.com"),
      title: "레이지데이 북클럽",
      description: "서울 사당역 링키라운지에서 열리는 시즌제 독서모임, 레이지데이 북클럽.",
      other: {
        "facebook-domain-verification": fbVerification,
        // 네이버 서치어드바이저 소유 확인 (운영자 발급 2026-08-12, lazyday-bookclub.com 전용)
        "naver-site-verification": "8224ea0b6a1b0673055db2e1c404a1902a827882",
      },
      // 구글 서치콘솔 인증 코드는 운영자 발급 대기
    }
  }

  return {
    metadataBase: new URL("https://linkylounge.com"),
    title: "링키라운지 | 𝑾𝒉𝒆𝒓𝒆 𝑾𝒆 𝑳𝒊𝒏𝒌",
    description: "덴마크 휘게를 담은 사당의 아늑한 공간",
    openGraph: {
      title: "링키라운지 | 𝑾𝒉𝒆𝒓𝒆 𝑾𝒆 𝑳𝒊𝒏𝒌",
      description: "덴마크 휘게를 담은 사당의 아늑한 공간",
      images: ["/linky-lounge/gallary/e.jpg"],
    },
    other: {
      "facebook-domain-verification": fbVerification,
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* SUIT — 셀프호스트 가변폰트 preload (2026-08-12 콜드 로드 다이어트:
            구 CDN 정적판 weight 7종 ~1.19MB → 가변 1파일 610KB·1요청.
            @font-face 정의는 globals.css) */}
        <link
          rel="preload"
          href="/fonts/SUIT-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* 책 소개 카드 제목용 Pretendard (레이지데이 북클럽 전용) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* 책 소개 본문용 명조 — 빌드 타임 의존 없이 Google Fonts CSS 직접 로드 */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600&display=swap"
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `,
          }}
        />
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </head>
      <body className={`font-sans antialiased ${playfair.variable}`}>
        {children}
        <MetaPixelTracker />
        <Analytics />
      </body>
    </html>
  )
}
