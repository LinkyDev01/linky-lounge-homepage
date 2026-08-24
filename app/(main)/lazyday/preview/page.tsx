import styles from "../page.module.css"
import shell from "../landing-shell.module.css"
import pstyles from "./preview.module.css"
import { LandingShell } from "../LandingShell"
import { HashScrollOnLoad } from "../HashScrollOnLoad"
import { HeroParallax } from "../HeroParallax"
import { HeroSummary } from "./HeroSummary"
import { BookSectionV2 } from "./BookSectionV2"
import { FeatureQuietSection } from "./FeatureQuietSection"
import { ProcessSection } from "../ProcessSection"
import { ScheduleSectionV2 } from "./ScheduleSectionV2"
import { ReviewsSection } from "../ReviewsSection"
import { ScenesSection } from "./ScenesSection"
import { FaqSectionV2 } from "./FaqSectionV2"
import { SeasonCountCta, BrandCloseV2 } from "../SeasonCountCta"
import { NextSeasonNotify } from "../NextSeasonNotify"
import { SEASON } from "../season-config"
import { StickyApplyButtonV2 } from "./StickyApplyButtonV2"
import { SectionIndicator } from "../SectionIndicator"

/**
 * ── 개선안 프리뷰 랜딩 — 2026-08-24 아키텍처 재동기화 ──
 *
 * 실사이트가 2026-08-12(반응형 개편)·08-17(진행순서 흡수·후기 재배정) 두 차례
 * 구조 변경을 겪는 동안 이 파일은 2026-07 상태로 멈춰 있었다(운영자 지적:
 * "프리뷰페이지가 원본 페이지와 너무 많이 갭이 커져서"). 이번에 실사이트
 * 현재 구조에 맞춰 재동기화 — 개별 V2 컴포넌트 내부 디자인은 손대지 않고
 * **셸·조립 구조만** 맞췄다:
 *  · 내비·푸터: 구 NavBarV2·Footer → LandingShell (레이지클럽 문법 셸, 실사이트 것을
 *    직접 import — V2 없음. NavBarV2·Footer 는 다른 고아들과 같이 보존, 렌더 안 함)
 *  · 진행 순서: 구 독립 섹션 HowToSectionV2 → (08-24 5안 확정으로) 실사이트
 *    ProcessSection('진행 방식') 직접 import. HowToSectionV2·HowToBrief 는 고아 보존
 *  · 후기: "실물 사진 업로드 대기" 시절 플레이스홀더(구 preview/ReviewsSection,
 *    ⚠️ 보존 모듈 삭제 금지)는 이미 오래전에 실물 사진+핀치줌으로 대체됐다 →
 *    실사이트 ReviewsSection 을 직접 import
 *  · 클로징: 구 ClosingSectionV2 → SeasonCountCta+BrandCloseV2 (실사이트 것을
 *    직접 import. ClosingSectionV2 는 고아 보존)
 *  · 섹션 순서·배경 교차를 실사이트와 동일하게: 책(B)→모임소개(A)+진행 방식(A)→
 *    일정(B)→후기(A)→[ScenesSection]→FAQ(B)→클로징(A)
 *  · 데스크톱(≥721px) 반응형 훅(--lz-*) 도 Book·Schedule·모임소개 세 프리뷰
 *    CSS 파일에 포트 완료(2026-08-24) — 390·1280px 모두 실사이트와 픽셀 동일
 *  · 일정 배경 A→B 재배정(2026-08-24, 운영자 확인) — 진행순서 흡수로 A를
 *    유지하던 근거가 사라져 실사이트와 같은 값으로
 *
 * ⚠ ScenesSection(A, #f7f3ee, 사진 확보 대기 중인 프리뷰 전용 보류 항목)은
 *   실사이트에 대응 섹션이 없다 — 이미 교차 중인 두 색(후기 A / FAQ B) 사이에
 *   섹션 하나를 끼워 넣는 이상 어느 색을 골라도 한쪽과는 같은 색이 되는
 *   수학적 한계(2색 교차 + 홀수 삽입)라 완전한 해소는 불가능. 위 Schedule
 *   재배정으로 나머지 전 구간은 실사이트와 동일해졌고, 후기(A)-Scenes(A)
 *   인접만 예외로 남긴다 — 선례: 2026-07-22~08-17 후기-FAQ B-B 인접도 같은
 *   방식으로 한동안 용인됐다(DECISIONS). 운영자 확인 2026-08-24("그래보자").
 *
 * 남겨둔 것(이번 라운드 범위 밖 — 개별 V2 내부 값 대조는 안 함):
 *  BookSectionV2·ScheduleSectionV2·FeatureQuietSection·FaqSectionV2·
 *  StickyApplyButtonV2 는 기존 그대로. 자체 디자인 포크라 실사이트 값과
 *  달라도 정상(TSX 쌍 동기화 대상일 뿐 동일 컴포넌트가 아님).
 */
export default function PreviewLandingPage() {
  return (
    <div className={pstyles.desktopFrame}>
      <HashScrollOnLoad />
      <LandingShell>
        <main className={`${styles.container} ${shell.body}`} data-track-section="bookclub_home_preview">
          <div className={shell.heroRow}>
            <HeroParallax />
            <HeroSummary />
          </div>
          <BookSectionV2 />
          {/* '우리가 믿는 것'(PhilosophySectionV2)은 당분간 제외 — 컴포넌트·원고는 보존 (운영자 결정 2026-07-04) */}
          {/* 5회차(FifthSessionSection)는 섹션 삭제 — 내용은 FAQ로 이관 (운영자 결정 2026-07-06) */}
          {/* 2026-08-24: 5안 확정 — 시안 스위처(IntroRuleLab)를 걷어내고 실사이트와
              같은 구조로 고정했다. 진행 순서는 밴드 안 요약이 아니라 독립 섹션
              ProcessSection('진행 방식')이며, 실사이트 것을 직접 import 한다(V2 없음). */}
          {/* featureBand 래퍼 제거 — 실사이트와 동일 (2026-08-24 여백 수리, page.tsx 주석 참조) */}
          <FeatureQuietSection />
          <ProcessSection />
          <ScheduleSectionV2 />
          <ReviewsSection />
          {/* 장면들(SCENES): 사진 콜라주 (프리뷰 전용, 2026-07-07 신설) — scenes-config가 비면 미렌더.
              실사이트 이식은 사진 확보+승인 대기. 위 주석 참조 — A-A 인접 발생 중 */}
          <ScenesSection />
          <FaqSectionV2 />
          <SeasonCountCta />
          {SEASON.status === "closedEarly" && <NextSeasonNotify />}
          <StickyApplyButtonV2 />
          <BrandCloseV2 />
        </main>
      </LandingShell>
      <SectionIndicator />
    </div>
  )
}
