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
import { FaqSection } from "./FaqSection"
import { FeatureQuietSection } from "./FeatureQuietSection"
import { ClosingCtaSection } from "./ClosingCtaSection"
import { BrandCloseSection } from "./BrandCloseSection"

export const metadata: Metadata = {
  title: "레이지데이 북클럽",
  description: "빠른 결론보다 깊은 사유를. 철학과 고전 사이에서 낯선 시각과 부딪히며, 나만의 생각을 벼려가는 독서모임 레이지데이 북클럽.",
  openGraph: {
    title: "레이지데이 북클럽",
    description: "느림은 게으름이 아니라, 사유의 자세입니다",
    images: ["/linky-lounge/book-club/og-lazyday-heart.png"],
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
