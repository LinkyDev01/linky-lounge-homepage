import styles from "../page.module.css"
import pstyles from "./preview.module.css"
import { Footer } from "@/components/footer"
import { HeroParallax } from "../HeroParallax"
import { HowToSectionV2 } from "./HowToSectionV2"
import { ScheduleSectionV2 } from "./ScheduleSectionV2"
import { NavBarV2 } from "./NavBarV2"
import { HeroSummary } from "./HeroSummary"
import { FeatureQuietSection } from "./FeatureQuietSection"
import { ReviewsSection } from "./ReviewsSection"
import { BookSectionV2 } from "./BookSectionV2"
import { FaqSectionV2 } from "./FaqSectionV2"
import { ScenesSection } from "./ScenesSection"
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
 *  7. FAQ도 모임 소개와 동일한 '핵심 문장 상시 노출 + 페이드 힌트 + 더보기'
 *     구조로 실험(FaqSectionV2, 2026-07-03 제안) — 실사이트 미반영
 * 보류·제외된 것 (운영자 결정):
 *  · 잔여석 표기 제외 / 참가 안내(가격 상세)는 기존처럼 인터뷰 페이지에서만
 *  · 4기 알림 받기 보류 / PC 여백 세로 타이포 제거
 */
export default function PreviewLandingPage() {
  return (
    <div className={pstyles.desktopFrame}>
      <NavBarV2 />
      <main className={styles.container} data-track-section="bookclub_home_preview">
        <HeroParallax />
        <HeroSummary />
        <BookSectionV2 />
        {/* '우리가 믿는 것'(PhilosophySectionV2)은 당분간 제외 — 컴포넌트·원고는 보존 (운영자 결정 2026-07-04) */}
        <ReviewsSection />
        {/* 5회차(FifthSessionSection)는 섹션 삭제 — 내용은 FAQ로 이관 (운영자 결정 2026-07-06) */}
        {/* 모임 소개: 콰이어트 '①+ 페이드 이어 읽기'로 교체 (2026-07-06 확정) — FeatureBoxSectionV2는 보존 */}
        <FeatureQuietSection />
        {/* 진행 순서·일정/장소: 콰이어트 리스트로 개편 (2026-07-06 확정, 프리뷰 전용) — 원본은 V2 없이 직접 import하던 구조라 신설 */}
        <HowToSectionV2 />
        <ScheduleSectionV2 />
        <FaqSectionV2 />
        {/* 장면들(SCENES): 사진 콜라주 (프리뷰 전용, 2026-07-07 신설) — scenes-config가 비면 미렌더. 실사이트 이식은 사진 확보+승인 대기 */}
        <ScenesSection />
        <ClosingSectionV2 />
      </main>

      <StickyApplyButtonV2 />
      <Footer
        instagramUrl="https://instagram.com/lazyday_bookclub"
        kakaoUrl="https://pf.kakao.com/_gixaAX"
        policyLabel="이용약관"
      />
    </div>
  )
}
