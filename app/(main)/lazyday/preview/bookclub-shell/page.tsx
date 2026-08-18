import type { Metadata } from "next"
import { HashScrollOnLoad } from "../../HashScrollOnLoad"
import { HeroParallax } from "../../HeroParallax"
import { HeroSummary } from "../../HeroSummary"
import { SectionIndicator } from "../../SectionIndicator"
import { HowToSection } from "../../HowToSection"
import { ScheduleSection } from "../../ScheduleSection"
import { ReviewsSection } from "../../ReviewsSection"
import { BookSection } from "../../BookSection"
import { FaqSection } from "../../FaqSection"
import { FeatureQuietSection } from "../../FeatureQuietSection"
import { ClosingCtaSection } from "../../ClosingCtaSection"
import { BrandCloseSection } from "../../BrandCloseSection"
import { StickyApplyButton } from "../../sticky-apply-button"
import pageStyles from "../../page.module.css"
import styles from "./bookclub-shell.module.css"

export const metadata: Metadata = {
  title: "북클럽 × 레이지클럽 셸 초안",
  robots: { index: false },
}

/**
 * 초안 (2026-08-12, 운영자): 북클럽 랜딩을 **레이지클럽 셸 문법**으로 —
 * 브라운 반투명 하단탭(NavBar) → 종이색 고정 상단 내비(2행: 로고+신청 / 링크 행),
 * 라운지 공용 Footer → 워크룸 푸터(브랜드 문단 명조 + 사업자 정보 Gothic A1 300).
 * 본문 섹션·등장 리빌·스티키 CTA는 실사이트 컴포넌트 그대로 (애니메이션 베이스 유지).
 * 반응형: 내비·푸터는 1100px 컨테이너(웹) ↔ 스택·가로 스크롤 링크(모바일).
 */

const NAV_LINKS = [
  { href: "#book", label: "선정도서" },
  { href: "#feature", label: "모임소개" },
  { href: "#howto", label: "진행방식" },
  { href: "#schedule", label: "일정·장소" },
  { href: "#reviews", label: "후기" },
  { href: "#faq", label: "FAQ" },
]

export default function BookclubShellDraftPage() {
  return (
    <div className={styles.shell}>
      {/* Gothic A1 — 전역 미로드라 페이지에서 로드 (레이지클럽 calendar 페이지 방식) */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;600&display=swap" />
      <HashScrollOnLoad />

      {/* ── 레이지클럽 문법 고정 내비 ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerTop}>
            <a href="#" className={styles.logo} aria-label="레이지데이 북클럽">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/linky-lounge/book-club/ldbc-logo-text.png" alt="레이지데이 북클럽" />
            </a>
            <a href="/apply" className={styles.applyLink}>
              4기 신청 ↗
            </a>
          </div>
          <nav className={styles.navRow} aria-label="섹션 이동">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className={`${pageStyles.container} ${styles.body}`} data-track-section="bookclub_shell_draft">
        <HeroParallax />
        <HeroSummary />
        <BookSection />
        <FeatureQuietSection />
        <HowToSection />
        <ScheduleSection />
        <ReviewsSection />
        <FaqSection />
        <ClosingCtaSection />
        <StickyApplyButton />
        <BrandCloseSection />
      </main>

      <SectionIndicator />

      {/* ── 워크룸 푸터 문법 (북클럽 팔레트) ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/linky-lounge/book-club/lazyday_logo.png" alt="레이지데이" />
          </div>
          <div>
            <p className={styles.footerDesc}>
              저마다 다른 삶의 궤적 속 불협화음이 예술의 본질을 관통하며 하나의 선율이 되는 순간을 소망합니다.
            </p>
            <div className={styles.footerLinks}>
              <a href="/policy">이용약관</a>
              <a href="/privacy">개인정보처리방침</a>
            </div>
            <div className={styles.footerSns}>
              <a
                href="https://instagram.com/lazyday_bookclub"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="인스타그램"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.7" y="0.7" width="12.6" height="12.6" rx="3.4" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="10.7" cy="3.3" r="0.9" fill="currentColor" />
                </svg>
              </a>
              <a
                href="https://pf.kakao.com/_gixaAX/chat"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="카카오톡 채널"
              >
                <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M7.5 1C3.9 1 1 3.3 1 6.1c0 1.8 1.2 3.4 3 4.3l-.7 2.7c-.06.24.2.43.4.29l3.1-2.05c.23.02.46.03.7.03 3.6 0 6.5-2.3 6.5-5.17S11.1 1 7.5 1Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </div>
          </div>
          <div className={styles.footerBiz}>
            주식회사 링키
            <br />
            대표: 안동민 · 개인정보관리책임자: 안동민
            <br />
            사업자등록번호 557-81-03588
            <br />
            통신판매업신고 2026-별내-0077
            <br />
            경기도 남양주시 별내3로 322, 404호
            <br />
            010-7444-5790 · contact@linkylounge.com
          </div>
        </div>
      </footer>
    </div>
  )
}
