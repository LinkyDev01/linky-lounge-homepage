import styles from "../page.module.css"
import pstyles from "./preview.module.css"
import { Footer } from "@/components/footer"
import { HeroParallax } from "../HeroParallax"
import { AboutSection } from "../AboutSection"
import { BookSection } from "../BookSection"
import { FifthSessionSection } from "../FifthSessionSection"
import { HowToSection } from "../HowToSection"
import { NavBarV2 } from "./NavBarV2"
import { HeroSummary } from "./HeroSummary"
import { FeatureBoxSectionV2 } from "./FeatureBoxSectionV2"
import { ReviewsSection } from "./ReviewsSection"
import { ScheduleSectionV2 } from "./ScheduleSectionV2"
import { FaqSectionV2 } from "./FaqSectionV2"
import { ClosingSectionV2 } from "./ClosingSectionV2"
import { StickyApplyButtonV2 } from "./StickyApplyButtonV2"

/**
 * ── 개선안 프리뷰 랜딩 ──
 * 원본 대비 변경점:
 *  1. 히어로 아래 핵심 요약 스트립 (무엇을·언제·어디서 + 마감 D-day)
 *  2. 내비게이션: '모임소개'→실제 소개 섹션, '후기' 탭 추가
 *  3. 모임 소개 아코디언: 요약 항상 노출 + '불균형의 균형' 카드 추가
 *  4. 후기 섹션 신설 (손글씨 후기 사진 스트립)
 *  5. 일정 섹션: 요일별 잔여석 + 참가비·환불·결제시점 '참가 안내' 박스
 *  6. FAQ: 핵심 답 항상 노출 + 참가비 금액 명시 + '신청하면 어떻게 진행되나요' 추가
 *  7. 클로징: 마감 정보 + 다음 기수 알림 받기
 *  8. 스티키 CTA에 마감 D-day 표기
 *  9. PC 여백: 은은한 세로 타이포 장식 (A안)
 */
export default function PreviewLandingPage() {
  return (
    <div className={pstyles.desktopFrame}>
      <NavBarV2 />
      <main className={styles.container} data-track-section="bookclub_home_preview">
        <HeroParallax />
        <HeroSummary />
        <AboutSection />
        <FeatureBoxSectionV2 />
        <ReviewsSection />
        <BookSection />
        <FifthSessionSection />
        <HowToSection />
        <ScheduleSectionV2 />
        <FaqSectionV2 />
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
