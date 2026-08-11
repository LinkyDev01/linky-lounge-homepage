"use client"

/**
 * 워크룸 이식판 공유 셸 — 헤더·푸터·안내 토스트·임시 팔레트 (라운드 10 추출)
 * 홈·목록·상세·카트 페이지가 공유한다. 프리뷰 이동 바는 이 트리에서 숨김.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { IdleShuffle } from "./IdleShuffle"
import styles from "./home.module.css"

// 라운드 23: 토큰 링크 대신 실도메인 공유용 난수 경로로 개명 (운영자 "복잡한 하위페이지명")
// BASE 는 서버 컴포넌트도 쓰므로 지시어 없는 base-path.ts 로 분리 (2026-08-11 —
// "use client" 모듈의 상수를 서버에서 보간하면 프록시가 찍히는 버그). 기존 소비자용 re-export.
import { BASE } from "./base-path"
export { BASE }

// 라운드 30 (운영자 2026-08-06): coming soon은 lazy-club.com 전용 페이지(/coming-soon)로 분리 —
// 이 트리의 홈은 기존 기획안(전체 섹션)을 내부 검토용으로 유지.
// 라운드 31: 내비·푸터는 두 페이지가 완전히 동일 (분기 없음).

// 내비 — 라운드 75: 2행 구조로 전면 교체 (라운드 39의 NAV_ITEMS 폐기).
// 1행 = 로고(좌) + 계정·카트·검색 아이콘(우) / 2행 = 링크들.
// 모든 항목이 같은 색·같은 서체 — 크기·굵기로 위계를 만들지 않는다.
// 라운드 76: 로고 36px, 2행 좌 = 전체상품·제품·아카이브 / 2행 우 = 레이지데이 북클럽.
// 라운드 78: '전체상품' → **모임**으로 개명. '제품'은 굿즈 섹션 보류와 함께 내비에서도 제거.
// 라운드 82: '제품' 부활 — 모임과 아카이브 사이, 홈의 굿즈 섹션(#shop)으로
// (굿즈 블록도 SHOW_GOODS=true 로 다시 켬 — WorkroomHome.tsx)
// 라운드 83: 맨 왼쪽 '전체보기'(→ 홈 전체) 신설 — 모임은 모임 목록 페이지로.
// 라운드 85: 제품도 홈 앵커(#shop)가 아니라 **굿즈만 목록화된 전용 페이지**(/shop)로
// — "전체보기 페이지 하나에서 섹션이동이 아니라" (운영자)
const NAV_ROW2_LEFT: { label: string; href: string }[] = [
  { label: "전체보기", href: BASE },
  { label: "모임", href: `${BASE}/meetings` },
  { label: "제품", href: `${BASE}/shop` },
  // 라운드 121(운영자): 제품과 아카이브 사이에 **일정** — 캘린더 페이지
  { label: "일정", href: `${BASE}/calendar` },
  { label: "아카이브", href: `${BASE}/archive` },
]
// 라운드 79: 레이지데이 북클럽은 실도메인 절대 URL — lazy-club.com 위에서 /lazyday 는
// 미들웨어가 랜딩으로 되돌리므로 상대 경로로는 북클럽에 도달할 수 없다.
// 라운드 81: 북클럽으로 나가는 링크는 전부 **새 탭** (내비 + 기수 포스터 섹션, 운영자)
export const BOOKCLUB_URL = "https://www.lazyday-bookclub.com"
/** 기수별 진열은 북클럽 랜딩의 선정도서 섹션으로 (4기는 랜딩 상단이 곧 모집 화면) */
export const BOOKCLUB_BOOK_URL = `${BOOKCLUB_URL}/#book`

const NAV_ROW2_RIGHT: { label: string; href: string }[] = [
  { label: "레이지데이 북클럽", href: BOOKCLUB_URL },
]

const ToastContext = createContext<{ notify: (msg?: string) => void }>({ notify: () => {} })
export const useToast = () => useContext(ToastContext)

// 프리뷰 바 숨김 참조 카운트 — 사용처가 여러 곳(셸 + 랜딩 인트로)이라
// 마지막 사용처가 사라질 때만 바를 되살린다 (라운드 46·47)
let previewBarHideCount = 0

/** 이 트리에서 프리뷰 이동 바를 숨긴다 (운영자 2026-08-04) — 참조 카운트 방식 */
export function usePreviewBarHide() {
  useEffect(() => {
    previewBarHideCount++
    const els = Array.from(document.querySelectorAll<HTMLElement>('[class*="previewBar"]'))
    els.forEach((el) => {
      el.style.display = "none"
    })
    return () => {
      previewBarHideCount--
      if (previewBarHideCount === 0)
        els.forEach((el) => {
          el.style.display = ""
        })
    }
  }, [])
}

/** paper (라운드 47, 랜딩 인트로 전용): 이 페이지의 종이색만 다르게 지정한다.
 *  (인트로 배경 #f8f3ef 와 최종 상태를 일치시키기 위함 — 기본값 없음, 타 페이지 무영향)
 *  chromeHidden (라운드 48): 내비·푸터를 배치는 그대로 둔 채 배경색으로 가린다.
 *  인트로 동안 자리를 미리 확보해 시작·종료 시점의 레이아웃이 완전히 같게 만든다. */
export function WorkroomShell({
  children,
  paper,
  chromeHidden = false,
}: {
  children: React.ReactNode
  paper?: string
  chromeHidden?: boolean
}) {
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = (msg = "준비 중인 기능입니다.") => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }


  usePreviewBarHide()

  return (
    <div
      className={`${styles.page}${chromeHidden ? ` ${styles.chromeVeiled}` : ""}`}
      style={paper ? ({ ["--paper"]: paper } as React.CSSProperties) : undefined}
    >
      {/* 모임 설명 헤더용 Gothic A1 (눈누 #891, OFL) — 550 지시 → 정적 9굵기 중 300/600 로드 */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;600&family=Space+Grotesk:wght@500&display=swap"
      />
      {/* ── 내비 (라운드 75) — 2행. 1행: 로고 + 계정·카트·검색 / 2행: 전체상품 + 링크 3개 ── */}
      <header className={styles.header}>
        {/* 1행 좌: 로고 → 랜딩(애니메이션) 페이지 */}
        {/* 라운드 78: 로고로 들어가면 인트로를 다시 재생하지 않는다 —
            ?still=1 은 최종 정지 화면으로 바로 진입 (색은 그때 새로 뽑는다) */}
        <LazydayLink href={`${BASE}/coming-soon?still=1`} className={styles.navLogo} aria-label="레이지클럽 랜딩으로">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/linky-lounge/book-club/home-v3/nav-logo-circle.png" alt="레이지 클럽" />
        </LazydayLink>
        {/* 1행 우: 아이콘 3종 — 자체 드로잉 SVG (푸터 SNS와 같은 문법: currentColor, 1.2 스트로크) */}
        <div className={styles.navIcons}>
          <button type="button" className={styles.navIconBtn} aria-label="계정" onClick={() => notify()}>
            <AccountIcon />
          </button>
          <LazydayLink href={`${BASE}/cart`} className={styles.navIconBtn} aria-label="카트">
            <CartIcon />
          </LazydayLink>
          <button type="button" className={styles.navIconBtn} aria-label="검색" onClick={() => notify()}>
            <SearchIcon />
          </button>
        </div>
        {/* 2행 좌: 전체상품 · 제품 · 아카이브 */}
        <nav className={styles.navAll}>
          {NAV_ROW2_LEFT.map((item) => (
            <LazydayLink key={item.label} href={item.href}>
              {item.label}
            </LazydayLink>
          ))}
        </nav>
        {/* 2행 우: 레이지데이 북클럽 — 절대 URL은 일반 <a> (LazydayLink는 내부 경로 전용).
            라운드 81: 다른 도메인이므로 새 탭 */}
        <nav className={styles.navMenu}>
          {NAV_ROW2_RIGHT.map((item) =>
            item.href.startsWith("http") ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">
                {item.label}
              </a>
            ) : (
              <LazydayLink key={item.label} href={item.href}>
                {item.label}
              </LazydayLink>
            ),
          )}
        </nav>
      </header>

      <ToastContext.Provider value={{ notify }}>{children}</ToastContext.Provider>

      {/* 유휴 60초 → 난수 셔플 오버레이 — 트리 전 페이지 공통 (라운드 79) */}
      <IdleShuffle />

      {/* ── 푸터 — 전 섹션 동일 유지 (운영자 라운드 31: coming soon도 같은 푸터) ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <figure className={styles.footerLogo}>
            {/* 레이지 클럽 로고 (운영자 제공 — 라운드 49 교체: 새 워드서치 마크 CWEL/LAZY/UCOM/BETO) */}
            <img src="/linky-lounge/book-club/home-v3/logo-lazyclub-v2.png" alt="레이지 클럽" />
          </figure>
          <div className={styles.footerDesc}>
            {/* 브랜드 문단 (About 링크는 라운드 14에서 제거 — 내비 Brand로 대체) */}
            <p>저마다 다른 삶의 궤적 속 불협화음이 예술의 본질을 관통하며 하나의 선율이 되는 순간을 믿습니다.</p>
          </div>
          <div className={styles.footerBiz}>
            <div>
              <span>주식회사 링키</span>
              <br />
              <span>대표: 안동민</span>
              <br />
              <span>사업자등록번호 557-81-03588</span>
              <br />
              <span>통신판매업신고 2026-별내-0077</span>
              <br />
              <span>개인정보관리책임자: 안동민</span>
            </div>
          </div>
          <div className={styles.footerContact}>
            <div>
              경기도 남양주시 별내3로 322, 404호
              <br />
              010-7444-5790
              <br />
              contact@linkylounge.com
            </div>
            {/* 모바일 전용 이용약관 — 인스타·카카오 바로가기 **바로 윗줄** (라운드 83, 운영자).
                데스크톱은 종전대로 우측 끝(.contracts)이 담당 — 이 줄은 모바일에서만 보인다 */}
            <ul className={styles.contractsInline}>
              <li>
                <a href="/policy">이용약관</a>
              </li>
              <li>
                <a href="/privacy">개인정보처리방침</a>
              </li>
            </ul>
            {/* SNS 아이콘 — 원문 문법(작은 아이콘 행). 자체 드로잉 SVG */}
            <div className={styles.footerSns}>
              <a href="https://instagram.com/lazyday_bookclub" target="_blank" rel="noopener noreferrer" aria-label="인스타그램">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.7" y="0.7" width="12.6" height="12.6" rx="3.4" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="10.7" cy="3.3" r="0.9" fill="currentColor" />
                </svg>
              </a>
              <a href="https://pf.kakao.com/_gixaAX/chat" target="_blank" rel="noopener noreferrer" aria-label="카카오톡 채널">
                <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M7.5 1C3.9 1 1 3.3 1 6.1c0 1.8 1.2 3.4 3 4.3l-.7 2.7c-.06.24.2.43.4.29l3.1-2.05c.23.02.46.03.7.03 3.6 0 6.5-2.3 6.5-5.17S11.1 1 7.5 1Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </div>
          </div>
          {/* 이용약관 — 로고가 좌측 끝에 붙듯 우측 끝에 우측정렬 (라운드 74) */}
          <ul className={styles.contracts}>
            <li>
              <a href="/policy">이용약관</a>
            </li>
            <li>
              <a href="/privacy">개인정보처리방침</a>
            </li>
          </ul>
        </div>
      </footer>

      {/* 미구현 기능 안내 토스트 */}
      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}

    </div>
  )
}

/* ── 내비 아이콘 3종 (라운드 75) — noahny.kr 골격(가는 스트로크·미니멀)을 참고해
      직접 그린 SVG. 푸터 SNS 아이콘과 같은 규칙: 16px, currentColor, strokeWidth 1.2 ── */

/** 계정 — 어깨선 위에 원 하나 */
function AccountIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="8" cy="5.4" r="2.9" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.4 14.2c0-2.7 2.5-4.4 5.6-4.4s5.6 1.7 5.6 4.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** 카트 — 사다리꼴 바구니 + 손잡이 (담는 그릇 형태) */
function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M2.2 5.4h11.6l-1.1 8.4H3.3L2.2 5.4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.6 7.2V4.6a2.4 2.4 0 0 1 4.8 0v2.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** 검색 — 원 + 손잡이 */
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="7.1" cy="7.1" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** 북마크(저장) 아이콘 — 원문 14×18 플래그 문법. filled = 저장됨 */
export function SaveIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M13 16.8182L7 12.5077L1 16.8182V1H13V16.8182Z"
        fill={filled ? "currentColor" : "var(--paper)"}
        stroke="currentColor"
        strokeMiterlimit="10"
      />
    </svg>
  )
}

/** 섹션 라벨 화살표 ↗ (8×8) */
export function ArrowIcon() {
  return (
    <span className={styles.labelIcon} aria-hidden>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 7L7 1M7 1H2.2M7 1V5.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** sold out / coming soon 오버레이 (라운드 10 — 저장·카트는 계속 가능) */
export function StatusOverlay({ status }: { status: "soldout" | "upcoming" }) {
  return <div className={styles.figOverlay}>{status === "soldout" ? "sold out" : "coming soon"}</div>
}
