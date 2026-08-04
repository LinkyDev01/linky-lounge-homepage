"use client"

/**
 * 워크룸 이식판 공유 셸 — 헤더·푸터·안내 토스트·임시 팔레트 (라운드 10 추출)
 * 홈·목록·상세·카트 페이지가 공유한다. 프리뷰 이동 바는 이 트리에서 숨김.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { useCart } from "./store"
import styles from "./home.module.css"

// 라운드 23: 토큰 링크 대신 실도메인 공유용 난수 경로로 개명 (운영자 "복잡한 하위페이지명")
export const BASE = "/preview/lazyclub-4b073000ddec094f"

// 내비 — 라운드 19: 이 페이지의 브랜드는 '레이지 클럽'(허브). 4항목 확정
// LazyClub(홈) / LazydayBookclub(기수제 랜딩) / OneDayTalk(목록) / About
const NAV_ITEMS: { label: string; href?: string; pending?: string }[] = [
  { label: "LazydayBookclub", href: "/" },
  { label: "OneDayTalk", href: `${BASE}/meetings` },
  { label: "About", pending: "소개 페이지는 준비 중입니다." },
]

const ToastContext = createContext<{ notify: (msg?: string) => void }>({ notify: () => {} })
export const useToast = () => useContext(ToastContext)

export function WorkroomShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cart = useCart()

  const notify = (msg = "준비 중인 기능입니다.") => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }


  // 이 트리에서만 프리뷰 이동 바 숨김 (운영자 2026-08-04)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[class*="previewBar"]'))
    els.forEach((el) => {
      el.style.display = "none"
    })
    return () =>
      els.forEach((el) => {
        el.style.display = ""
      })
  }, [])

  const nav = NAV_ITEMS

  return (
    <div className={styles.page}>
      {/* 모임 설명 헤더용 Gothic A1 (눈누 #891, OFL) — 550 지시 → 정적 9굵기 중 300/600 로드 */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;600&display=swap"
      />
      {/* ── 내비 ── */}
      <header className={`${styles.header} ${menuOpen ? styles.headerOpen : ""}`}>
        <div className={styles.headerLeft}>
          <LazydayLink href={BASE} className={styles.current}>
            LazyClub
          </LazydayLink>
          <nav className={styles.navMenu}>
            {nav.map((item) =>
              item.href ? (
                <LazydayLink key={item.label} href={item.href}>
                  {item.label}
                </LazydayLink>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className={styles.searchTrigger}
                  onClick={() => notify(item.pending)}
                >
                  {item.label}
                </button>
              ),
            )}
          </nav>
        </div>
        <div className={`${styles.headerSearch} ${searchOpen ? styles.headerSearchActive : ""}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              notify("검색은 준비 중입니다.")
            }}
          >
            <input type="text" placeholder="search" aria-label="search" />
          </form>
        </div>
        <div className={styles.headerRight}>
          {/* 구성요소 전부 노출, 미구현은 클릭 시 안내 (운영자 2026-08-04) */}
          <button type="button" className={styles.searchTrigger} onClick={() => setSearchOpen((v) => !v)}>
            search
          </button>
          <button type="button" className={styles.searchTrigger} onClick={() => notify("로그인은 준비 중입니다.")}>
            login
          </button>
          <LazydayLink href={`${BASE}/cart`}>cart{cart.count > 0 ? ` (${cart.count})` : ""}</LazydayLink>
        </div>
        <button type="button" className={styles.menuTrigger} onClick={() => setMenuOpen((v) => !v)}>
          menu
        </button>
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <ul>
              {nav.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <LazydayLink href={item.href}>{item.label}</LazydayLink>
                  ) : (
                    <button type="button" className={styles.searchTrigger} onClick={() => notify(item.pending)}>
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
              <li>
                <LazydayLink href={`${BASE}/cart`}>cart{cart.count > 0 ? ` (${cart.count})` : ""}</LazydayLink>
              </li>
            </ul>
          </div>
        )}
      </header>

      <ToastContext.Provider value={{ notify }}>{children}</ToastContext.Provider>

      {/* ── 푸터 ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <figure className={styles.footerLogo}>
            {/* 레이지 클럽 투명배경 로고 (운영자 제공, 라운드 19) */}
            <img src="/linky-lounge/book-club/home-v3/logo-lazyclub.png" alt="레이지 클럽" />
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
            <ul className={styles.contracts}>
              <li>
                <a href="/policy">이용약관</a>
              </li>
            </ul>
          </div>
          <div className={styles.footerContact}>
            <div>
              경기도 남양주시 별내3로 322, 404호
              <br />
              010-7444-5790
              <br />
              contact@linkylounge.com
            </div>
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
