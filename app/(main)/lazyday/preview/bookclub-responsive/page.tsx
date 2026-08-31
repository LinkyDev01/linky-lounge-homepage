import type { Metadata } from "next"
import { DraftShell } from "./DraftShell"
import { FeatureVariantZone } from "./FeatureVariantZone"
import s from "./draft.module.css"
import pageStyles from "../../page.module.css"
import { HashScrollOnLoad } from "../../HashScrollOnLoad"
import { HeroParallax } from "../../HeroParallax"
import { HeroSummary } from "../../HeroSummary"
import { BookSection } from "../../BookSection"
import { FeatureQuietSection } from "../../FeatureQuietSection"
import { HowToSection } from "../../HowToSection"
import { ScheduleSection } from "../../ScheduleSection"
import { ReviewsSection } from "../../ReviewsSection"
import { FaqSection } from "../../FaqSection"
import { DraftSeasonCountCta, DraftBrandClose } from "./DraftClosing"
import { StickyApplyButton } from "../../sticky-apply-button"

/**
 * 레이지데이 북클럽 — **웹 반응형 개편 초안** (운영자 2026-08-12)
 *
 * 지시: "레이지클럽 레이아웃 레퍼런스 기반으로 현재 모바일 폭 고정을 웹 반응형으로.
 *        네비/푸터 등은 레이지클럽 레퍼런스 최대한 살리고 … 현재 애니메이션 베이스는 유지"
 *
 * 그래서 이 초안은:
 *  1) 섹션 컴포넌트를 **실사이트 것 그대로 재사용** — 애니메이션(포스터 SMIL, FadeUp,
 *     캐러셀, FAQ 접힘)이 한 줄도 바뀌지 않는다. 실사이트 CSS 는 폭 하드코딩만
 *     변수화(기본값 현행 유지)해 두었고, 여기서 그 변수만 갈아끼운다.
 *  2) 내비·푸터는 레이지클럽 셸 문법(2행 고정 내비·15컬럼 푸터)의 북클럽 팔레트 사본.
 *  3) ≤720px 은 변수를 건드리지 않아 **현행 모바일과 픽셀 동일**. 데스크톱만 펼쳐진다.
 *
 * 미해결(초안 이후 판단할 것): 데스크톱에서 캐러셀을 그대로 둘지 그리드로 펼칠지,
 * 후기 3열 여부, 히어로 병치 비율. 승인 시 lazyday-preview-migrate 절차로 이식.
 */
export const metadata: Metadata = {
  title: "반응형 초안 · 레이지데이 북클럽",
  robots: { index: false, follow: false },
}

export default function BookclubResponsiveDraftPage() {
  return (
    <DraftShell>
      <HashScrollOnLoad />
      <main className={`${pageStyles.container} ${s.body}`} data-track-section="bookclub_responsive_draft">
        <div className={s.heroRow}>
          <HeroParallax />
          <HeroSummary />
        </div>
        <BookSection />
        {/* 모임소개 데스크톱 2시안 (운영자: "각각 프리뷰 필요") — A 2×2 그리드 / B 사진 풀블리드 */}
        <FeatureVariantZone>
          <FeatureQuietSection />
        </FeatureVariantZone>
        <HowToSection />
        <ScheduleSection />
        <ReviewsSection />
        <FaqSection />
        {/* 클로징·로고는 **초안 전용 사본** — 실사이트 컴포넌트를 그대로 쓰면
            제목(기수 카운트)·로고 교체가 실사이트까지 바뀐다 (운영자 2026-08-12) */}
        <DraftSeasonCountCta />
        {/* 거북이 레인 제거 — 로더 전용으로 아껴둠 (운영자 2026-08-12 "b, 레인 지우고".
            실 랜딩과 쌍 동기화, TurtleProgress 는 고아 보존) */}
        <StickyApplyButton />
        <DraftBrandClose />
      </main>
      <p className={s.draftNote}>
        반응형 초안 — 섹션·애니메이션은 실사이트 그대로, 폭 시스템과 내비·푸터만 레이지클럽 문법
      </p>
    </DraftShell>
  )
}
