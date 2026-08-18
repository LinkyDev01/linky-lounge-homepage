import type { Metadata } from "next"
import styles from "./page.module.css"
import { StickyApplyButton } from "./sticky-apply-button"
import { LandingShell } from "./LandingShell"
import { HashScrollOnLoad } from "./HashScrollOnLoad"
import { HeroParallax } from "./HeroParallax"
import { HeroSummary } from "./HeroSummary"
import { HowToBrief } from "./HowToBrief"
import { ScheduleSection } from "./ScheduleSection"
import { ReviewsSection } from "./ReviewsSection"
import { BookSection } from "./BookSection"
import { FaqSection } from "./FaqSection"
import { FeatureQuietSection } from "./FeatureQuietSection"
import { SeasonCountCta, BrandCloseV2 } from "./SeasonCountCta"
import { NextSeasonNotify } from "./NextSeasonNotify"
import { SEASON } from "./season-config"
import { JsonLd } from "./JsonLd"
import shell from "./landing-shell.module.css"

// SEO 개편 (2026-08-12, 대화상점 패턴): description 정보형 + keywords(네이버 계열 참고용).
// ⚠ title·OG는 **운영자 지정값 유지** — 임의 문구로 바꾸지 않는다 (운영자 2026-08-12
// "오픈그래프 타이틀은 유지할건데 임의로 작성한 값 틀어버리면 안돼" — 카테고리 서술형
// title 시도는 원복. 검색어는 description·keywords·JSON-LD로만).
export const metadata: Metadata = {
  title: "레이지데이 북클럽",
  description:
    "저마다 다른 사유의 궤적 속 불협화음이 고전의 본질을 관통하여 하나의 선율이 되는 순간을 기대합니다.",
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
    description: "저마다 다른 사유의 궤적 속 불협화음이 고전의 본질을 관통하여 하나의 선율이 되는 순간을 기대합니다.",
    images: ["/linky-lounge/book-club/og-lazyday-heart-v5.png"],
    type: "website",
  },
}

export default function StudyForeignPage() {
  return (
    <>
      <HashScrollOnLoad />
      <JsonLd brand="bookclub" />
      {/* 2026-08-12: 반응형 개편 이식 — 구 NavBar/Footer 대신 레이지클럽 문법 셸
          (LandingShell 이 내비·푸터를 모두 담당). 구 컴포넌트는 고아 보존 */}
      <LandingShell>
      <main className={`${styles.container} ${shell.body}`} data-track-section="bookclub_home">
        {/* '복잡함 속에서 찾는 단순함'(AboutSection)은 보류 — 컴포넌트는 보존 (운영자 결정 2026-07-03) */}
        {/* 히어로 행 — 데스크톱에서 포스터(좌)+요약 카드(우) 병치 (초안 구조 그대로.
            래퍼가 없으면 포스터가 전폭으로 터진다 — 이식 검증에서 실측) */}
        <div className={shell.heroRow}>
          <HeroParallax />
          {/* 상단 압축 요약 카드 — 10b 정본 이식. 프리뷰 쌍: preview/HeroSummary */}
          <HeroSummary />
        </div>
        <BookSection />
        {/* 5회차(FifthSessionSection)는 섹션 삭제 — 내용은 FAQ '5회차 자유 독서모임' 문항으로 이관, 컴포넌트는 고아 보존 (운영자 결정 2026-07-06) */}
        {/* 모임 소개: 콰이어트 '①+ 페이드 이어 읽기' + 보완 원고 (2026-07-06 배포 승인) — FeatureBoxSection은 고아 보존.
            2026-08-17: 진행방식(HowToSection)이 **독립 섹션에서 이 밴드 하단 요약으로 접혀** 들어왔다
            (운영자 "별도로 상단 네비 메뉴까지 있을 정도로 중요해보이진 않아서 모임 소개 하단에 간략히").
            HowToSection 은 삭제하지 않고 고아 보존 — 되돌릴 땐 이 밴드를 풀고 다시 렌더하면 된다 */}
        <div className={shell.featureBand}>
          <FeatureQuietSection />
          <div className={shell.briefWrap}>
            <HowToBrief />
          </div>
        </div>
        <ScheduleSection />
        {/* 후기(멤버들이 남긴 문장) — 프리뷰 확정 디자인 이식, FAQ 바로 위 (운영자 지시 2026-07-21). 실물 사진 업로드 대기 */}
        <ReviewsSection />
        <FaqSection />
        <SeasonCountCta />
        {/* 조기마감 모드: 4기 오픈 알림 폼 — 브랜드 클로즈 직전 B밴드 (A/B 교차 유지, 운영자 확정 2026-07-13) */}
        {SEASON.status === "closedEarly" && <NextSeasonNotify />}
        {/* 거북이 레인은 제거 — 캐릭터는 로더(레이지클럽 turtle 트랙) 전용으로 아껴둔다
            (운영자 2026-08-12 "b, 레인 지우고". TurtleProgress 컴포넌트는 고아 보존) */}
        {/* 하단 CTA — sticky 라 **문서 흐름상 이 자리**(클로징 CTA 와 로고 사이)에 내려앉는다.
            스크롤 중에는 뷰포트 바닥에 붙어 종전과 같이 보인다 (운영자 2026-08-09) */}
        <StickyApplyButton />
        <BrandCloseV2 />
      </main>
      </LandingShell>
    </>
  )
}
