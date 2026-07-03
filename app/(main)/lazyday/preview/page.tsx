import styles from "../page.module.css"
import pstyles from "./preview.module.css"
import { Footer } from "@/components/footer"
import { HeroParallax } from "../HeroParallax"
import { FifthSessionSection } from "../FifthSessionSection"
import { HowToSection } from "../HowToSection"
import { ScheduleSection } from "../ScheduleSection"
import { FaqSection } from "../FaqSection"
import { NavBarV2 } from "./NavBarV2"
import { HeroSummary } from "./HeroSummary"
import { FeatureBoxSectionV2 } from "./FeatureBoxSectionV2"
import { PhilosophySectionV2 } from "./PhilosophySectionV2"
import { ReviewsSection } from "./ReviewsSection"
import { BookSectionV2 } from "./BookSectionV2"
import { ClosingSectionV2 } from "./ClosingSectionV2"
import { StickyApplyButtonV2 } from "./StickyApplyButtonV2"

/**
 * ── 개선안 프리뷰 랜딩 (2026-07-03 피드백 반영) ──
 * 원본 대비 변경점:
 *  1. 히어로 아래 핵심 요약 — 절제된 타이포(배지·이모지 없음), D-day 자동 계산(마감 7/16)
 *  2. 내비게이션: '모임소개'→실제 소개 섹션, '후기' 탭 추가
 *  3. 모임 소개 아코디언: 요약 항상 노출 + '불균형의 균형' 카드
 *  4. 후기 섹션 (손글씨 후기 사진 스트립 — 현 디자인 유지 확정)
 *  5. 책 소개 V2: 커버 선택 + 카드 슬라이드 + 기수 탭(지난 기수는 클릭 시 열람)
 *  6. 스티키 CTA에 마감 D-day 자동 표기
 * 보류·제외된 것 (운영자 결정):
 *  · 잔여석 표기 제외 / 참가 안내(가격 상세)는 기존처럼 인터뷰 페이지에서만
 *  · FAQ 기존 유지 / 4기 알림 받기 보류 / PC 여백 세로 타이포 제거
 */
export default function PreviewLandingPage() {
  return (
    <div className={pstyles.desktopFrame}>
      <NavBarV2 />
      <main className={styles.container} data-track-section="bookclub_home_preview">
        <HeroParallax />
        <HeroSummary />
        <BookSectionV2 />
        <PhilosophySectionV2 />
        <ReviewsSection />
        <FeatureBoxSectionV2 />
        <FifthSessionSection />
        <HowToSection />
        <ScheduleSection />
        <FaqSection />
        <ClosingSectionV2 />
      </main>

      <StickyApplyButtonV2 />
      <Footer
        instagramUrl="https://instagram.com/lazyday_bookclub"
        kakaoUrl="https://pf.kakao.com/_gixaAX"
      />
    </div>
  )
}
