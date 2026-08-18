import type React from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { DeferredCss } from "@/components/common/DeferredCss"
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
      description: "저마다 다른 삶의 궤적 속 불협화음이 예술의 본질을 관통하며 하나의 선율이 되는 순간을 믿습니다.",
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
      description: "저마다 다른 사유의 궤적 속 불협화음이 고전의 본질을 관통하여 하나의 선율이 되는 순간을 믿습니다.",
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
        {/* ⚠ SUIT 의 **수동 preload 를 두지 말 것** (2026-08-17). Next 16 이
            globals.css 의 @font-face 를 보고 **자동 preload**(Flight :HL 힌트)를 이미
            심는다 — 여기 JSX 로 preload 를 한 벌 더 쓰면 둘의 캐시가 합쳐지지 않아
            **610KB 가 두 번** 내려간다 (실측: 33ms·727ms 두 차례 전송, 자동+수동 중복.
            수동을 걷어내면 1회 — 인라인 스크립트 주입으로도 재현되는 브라우저 수준
            중복이라, 해법은 '심지 않기'뿐이다). */}
        {/* 서체 CDN 미리 연결 — 비차단 로드(DeferredCss)와 짝: 다운로드 시작을 앞당긴다 */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 책 소개 카드 제목용 Pretendard + 본문용 명조 (레이지데이 북클럽 전용).
            ⚠ 렌더를 막지 않는 로드 (2026-08-17, DeferredCss 주석) — 서체 CSS 가
            첫 페인트를 인질로 잡지 않는다. 도착 전엔 폴백 서체로 먼저 그려진다. */}
        <DeferredCss href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <DeferredCss href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600&display=swap" />
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
        {/* ⚠ **beforeInteractive** — afterInteractive 로 두면 스니펫이 하이드레이션
            뒤에 실행돼, 첫 로드 PageView 가 실기기에서 4.0~4.6초까지 밀린다(실측
            2026-08-18: CPU 4~6배 감속 + 3G). 광고 클릭 후 그 전에 이탈하면 방문이
            아예 기록되지 않았다 — 픽셀 헬퍼의 "설치됐지만 실행되지 않음"이 이것.
            PageView 는 이제 이 인라인 스니펫이 파싱 시점에 딱 한 번 쏜다.
            ⚠ MetaPixelTracker 는 **첫 경로에서 발화하지 않는다** — 여기서 이미
              쐈기 때문. SPA 경로 전환분만 담당한다 (한쪽만 고치면 이중 집계). */}
        <Script
          id="meta-pixel"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // ── 이 픽셀은 **매출 도메인에서만** 로드한다 (운영자 2026-08-18).
              //    linkylounge.com 에서 28일간 248건이 섞여 들어와 이벤트가 오염됐다.
              //    ⚠ lazy-club.com 을 함께 허용하는 이유: PG 심사 화이트리스트로
              //      /one-day-talk-01 결제 플로우가 그 도메인에서도 열려 있고,
              //      결제 완료 Lead 가 거기서 발화한다. 북클럽만 남기면 그 매출이 사라진다.
              var __lzH = location.hostname;
              if (__lzH.endsWith('lazyday-bookclub.com') || __lzH.endsWith('lazy-club.com')) {
              // 이벤트 단위 고유 ID — 나중에 전환 API 를 붙일 때 중복 제거 키가 된다
              function __lzEid(){try{if(crypto&&crypto.randomUUID)return crypto.randomUUID()}catch(e){}
                return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)}
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView', {}, { eventID: __lzEid() });
              }
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
