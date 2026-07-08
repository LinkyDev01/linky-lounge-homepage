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
import { BookSection } from "./BookSection"
import { FaqSection } from "./FaqSection"
import { FeatureQuietSection } from "./FeatureQuietSection"
import { ClosingCtaSection } from "./ClosingCtaSection"
import { BrandCloseSection } from "./BrandCloseSection"

export const metadata: Metadata = {
  title: "레이지데이 북클럽",
  description: "결이 맞물리는 사람들과 철학과 고전을 함께 읽습니다. 같은 문장 앞에 멈춰 서도 사유의 궤적은 저마다 다르고, 우리는 그 불협화음이 고전의 본질을 관통하는 하나의 선율이 되는 순간을 믿습니다.",
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
        <FaqSection />
        <ClosingCtaSection />
        <BrandCloseSection />
      </main>

      <SectionIndicator />
      <StickyApplyButton />
      <Footer
        instagramUrl="https://instagram.com/lazyday_bookclub"
        kakaoUrl="https://pf.kakao.com/_gixaAX"
        policyLabel="이용약관"
      />
    </>
  )
}
