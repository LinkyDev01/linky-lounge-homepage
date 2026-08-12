import type { Metadata } from "next"
import styles from "./page.module.css"
import { Footer } from "@/components/footer"
import { StickyApplyButton } from "./sticky-apply-button"
import { NavBar } from "./NavBar"
import { HashScrollOnLoad } from "./HashScrollOnLoad"
import { HeroParallax } from "./HeroParallax"
import { HeroSummary } from "./HeroSummary"
import { SectionIndicator } from "./SectionIndicator"
import { HowToSection } from "./HowToSection"
import { ScheduleSection } from "./ScheduleSection"
import { ReviewsSection } from "./ReviewsSection"
import { BookSection } from "./BookSection"
import { FaqSection } from "./FaqSection"
import { FeatureQuietSection } from "./FeatureQuietSection"
import { ClosingCtaSection } from "./ClosingCtaSection"
import { NextSeasonNotify } from "./NextSeasonNotify"
import { BrandCloseSection } from "./BrandCloseSection"
import { SEASON } from "./season-config"
import { JsonLd } from "./JsonLd"

// SEO 개편 (2026-08-12, 대화상점 패턴): title 카테고리 서술형 + description 정보형 +
// keywords(네이버 계열 참고용). OG는 철학 문구 유지 — 공유 미리보기는 브랜드 톤,
// 검색 스니펫은 title/description이 담당.
export const metadata: Metadata = {
  title: "레이지데이 북클럽 — 서울 사당 시즌제 독서모임",
  description:
    "서울 사당역 링키라운지에서 열리는 시즌제 독서모임, 레이지데이 북클럽. 한 시즌 동안 네 권의 책을 함께 읽고 낮의 대화로 깊게 이야기합니다.",
  keywords: [
    "독서모임",
    "북클럽",
    "책모임",
    "서울 독서모임",
    "사당 독서모임",
    "동작구 독서모임",
    "직장인 독서모임",
    "소규모 독서모임",
    "레이지데이 북클럽",
  ],
  // 정본 URL 고정 — lazyday-bookclub.com/lazyday(직접 접근분)와 중복 신호를 / 로 통합
  alternates: {
    canonical: "https://www.lazyday-bookclub.com/",
  },
  openGraph: {
    title: "레이지데이 북클럽",
    description: "사유의 불협화음이 본질을 관통하는 선율이 되는 순간을 믿습니다.",
    images: ["/linky-lounge/book-club/og-lazyday-heart-v5.png"],
    type: "website",
  },
}

export default function StudyForeignPage() {
  return (
    <>
      <HashScrollOnLoad />
      <JsonLd brand="bookclub" />
      <NavBar />
      <main className={styles.container} data-track-section="bookclub_home">
        {/* '복잡함 속에서 찾는 단순함'(AboutSection)은 보류 — 컴포넌트는 보존 (운영자 결정 2026-07-03) */}
        <HeroParallax />
        {/* 상단 압축 요약 카드 — 10b 정본 이식 (히어로 하단 페이드·선정도서와 이어지는 짙은 오트 밴드). 프리뷰 쌍: preview/HeroSummary */}
        <HeroSummary />
        <BookSection />
        {/* 5회차(FifthSessionSection)는 섹션 삭제 — 내용은 FAQ '5회차 자유 독서모임' 문항으로 이관, 컴포넌트는 고아 보존 (운영자 결정 2026-07-06) */}
        {/* 모임 소개: 콰이어트 '①+ 페이드 이어 읽기' + 보완 원고 (2026-07-06 배포 승인) — FeatureBoxSection은 고아 보존 */}
        <FeatureQuietSection />
        <HowToSection />
        <ScheduleSection />
        {/* 후기(멤버들이 남긴 문장) — 프리뷰 확정 디자인 이식, FAQ 바로 위 (운영자 지시 2026-07-21). 실물 사진 업로드 대기 */}
        <ReviewsSection />
        <FaqSection />
        <ClosingCtaSection />
        {/* 조기마감 모드: 4기 오픈 알림 폼 — 브랜드 클로즈 직전 B밴드 (A/B 교차 유지, 운영자 확정 2026-07-13) */}
        {SEASON.status === "closedEarly" && <NextSeasonNotify />}
        {/* 하단 CTA — sticky 라 **문서 흐름상 이 자리**(클로징 CTA 와 로고 사이)에 내려앉는다.
            스크롤 중에는 뷰포트 바닥에 붙어 종전과 같이 보인다 (운영자 2026-08-09) */}
        <StickyApplyButton />
        <BrandCloseSection />
      </main>

      <SectionIndicator />
      <Footer
        instagramUrl="https://instagram.com/lazyday_bookclub"
        kakaoUrl="https://pf.kakao.com/_gixaAX"
        policyLabel="이용약관"
        privacyHref="/privacy"
      />
    </>
  )
}
