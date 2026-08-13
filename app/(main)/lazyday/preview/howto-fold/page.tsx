import type { Metadata } from "next"
import { DraftShell, type NavItem } from "../bookclub-responsive/DraftShell"
import s from "../bookclub-responsive/draft.module.css"
import f from "./fold.module.css"
import pageStyles from "../../page.module.css"
import { HashScrollOnLoad } from "../../HashScrollOnLoad"
import { HeroParallax } from "../../HeroParallax"
import { HeroSummary } from "../../HeroSummary"
import { BookSection } from "../../BookSection"
import { FeatureQuietSection } from "../../FeatureQuietSection"
import { HowToBrief } from "./HowToBrief"
import { ScheduleSection } from "../../ScheduleSection"
import { ReviewsSection } from "../../ReviewsSection"
import { FaqSection } from "../../FaqSection"
import { DraftSeasonCountCta, DraftBrandClose } from "../bookclub-responsive/DraftClosing"
import { StickyApplyButton } from "../../sticky-apply-button"

/**
 * 시안 A — 진행순서를 모임소개 하단으로 접어 넣기 (운영자 2026-08-13).
 *
 * 현행 랜딩과의 차이 세 가지만:
 *  ① 진행방식 섹션(HowToSection) 삭제 → HowToBrief 로 모임소개 밴드 안에 흡수
 *  ② 상단 내비에서 '진행방식' 탭 제거 (4탭)
 *  ③ 배경 A/B 교차 재배정 — ①로 B 하나가 빠지면서 모임소개(A)–일정(A) 가 붙는다.
 *     일정을 B, 후기를 A 로 옮겨 Book(B)–모임소개(A)–일정(B)–후기(A)–FAQ(B)–클로징(A)
 *     완전 교차를 만든다. 덤으로 2026-07-22 부터 예외로 두고 있던 후기–FAQ 의
 *     B–B 인접도 해소된다. (§3 — 배경 재배정은 운영자 확인 항목이라 프리뷰에서만 적용)
 *
 * 실사이트 컴포넌트를 그대로 import 하므로 내용·조판은 현행과 동일하다.
 */

export const metadata: Metadata = {
  title: "시안 A · 진행순서 접기 — 레이지데이 북클럽",
  robots: { index: false, follow: false },
}

// '진행방식' 탭을 뺀 4탭
const NAV_ITEMS: NavItem[] = [
  { id: "book", label: "선정도서" },
  { id: "feature", label: "모임소개" },
  { id: "schedule", label: "일정·장소" },
  { id: "reviews", label: "후기·FAQ" },
]

export default function HowToFoldPreview() {
  return (
    <DraftShell navItems={NAV_ITEMS}>
      <HashScrollOnLoad />
      <main className={`${pageStyles.container} ${s.body}`}>
        <div className={s.heroRow}>
          <HeroParallax />
          <HeroSummary />
        </div>

        <BookSection />

        {/* ① 모임소개 밴드 — 섹션 하단에 진행 순서 요약을 이어 붙인다 */}
        <div className={f.featureBand}>
          <FeatureQuietSection />
          <div className={f.briefWrap}>
            <HowToBrief />
          </div>
        </div>

        {/* ③ 배경 재배정 — 일정 B / 후기 A */}
        <div className={f.bandB}>
          <ScheduleSection />
        </div>
        <div className={f.bandA}>
          <ReviewsSection />
        </div>

        <FaqSection />
        <DraftSeasonCountCta />
        <StickyApplyButton />
        <DraftBrandClose />
      </main>
    </DraftShell>
  )
}
