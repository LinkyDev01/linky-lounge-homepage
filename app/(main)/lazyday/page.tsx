import type { Metadata } from "next"
import styles from "./page.module.css"
import { Footer } from "@/components/footer"
import { StickyApplyButton } from "./sticky-apply-button"
import { NavBar } from "./NavBar"
import { HashScrollOnLoad } from "./HashScrollOnLoad"
import { HeroParallax } from "./HeroParallax"
import { SectionIndicator } from "./SectionIndicator"
import { HowToSection } from "./HowToSection"
import { ScheduleSection } from "./ScheduleSection"
import { BookSection } from "./BookSection"
import { FifthSessionSection } from "./FifthSessionSection"
import { FaqSection } from "./FaqSection"
import { FeatureBoxSection } from "./FeatureBoxSection"
import { ClosingCtaSection } from "./ClosingCtaSection"
import { BrandCloseSection } from "./BrandCloseSection"

export const metadata: Metadata = {
  title: "레이지데이 북클럽",
  description: "당신의 이야기, 그리고 당신만의 방향이 남는 모임",
  openGraph: {
    title: "레이지데이 북클럽",
    description: "당신의 이야기, 그리고 당신만의 방향이 남는 모임",
    images: ["/linky-lounge/book-club/lazy%20is%20a.png"],
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
        <BookSection />
        <FifthSessionSection />
        {/* 모임 소개: 콰이어트 개편은 텍스트 보완 후 이식 예정 — 그때까지 기존 FeatureBoxSection 유지 (프리뷰에는 FeatureQuietSection 반영됨, 2026-07-06) */}
        <FeatureBoxSection />
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
