"use client"

/**
 * 워크룸 이식판 공유 셸 — 헤더·푸터·안내 토스트·임시 팔레트 (라운드 10 추출)
 * 홈·목록·상세·카트 페이지가 공유한다. 프리뷰 이동 바는 이 트리에서 숨김.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { useCart } from "./store"
import styles from "./home.module.css"

export const BASE = "/preview/home-v3-workroom"

type NavLang = "ko" | "en"

// 내비 (ko 확정: 북클럽/원데이 토크/브랜드 — 원데이 토크는 목록 페이지로)
const NAV_ITEMS: Record<NavLang, { label: string; href?: string; pending?: string }[]> = {
  ko: [
    { label: "북클럽", href: "/" },
    { label: "원데이 토크", href: `${BASE}/meetings` },
    { label: "브랜드", pending: "브랜드 페이지는 준비 중입니다." },
  ],
  en: [
    { label: "books", href: "/" },
    { label: "meetings", href: `${BASE}/meetings` },
    { label: "about", pending: "브랜드 페이지는 준비 중입니다." },
  ],
}

// 임시 팔레트 프리셋 (시안 검토 전용) — 배경/텍스트·괘선/보조 회색 3집합만
const PALETTE_PRESETS = [
  { name: "백지·잉크", paper: "#ffffff", ink: "#000000", gray: "#e8e7e6" },
  { name: "오트", paper: "#f7f3ee", ink: "#1a1208", gray: "#ece5da" },
  { name: "크림", paper: "#f5f0e6", ink: "#1c1814", gray: "#e9e2d4" },
  { name: "반전", paper: "#1c1814", ink: "#f5f0e6", gray: "#2a241d" },
]

type PaletteKey = "paper" | "ink" | "gray"
const PALETTE_LABELS: Record<PaletteKey, string> = { paper: "배경", ink: "텍스트·괘선", gray: "보조 회색" }

/* hex ↔ HSL 변환 — 채도·명도 슬라이더용 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return { h: 0, s: 0, l: 0 }
  const n = parseInt(m[1], 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === r) h = 60 * (((g - b) / d) % 6)
    else if (max === g) h = 60 * ((b - r) / d + 2)
    else h = 60 * ((r - g) / d + 4)
    if (h < 0) h += 360
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) }
}
function hslToHex(h: number, s: number, l: number): string {
  const S = s / 100
  const L = l / 100
  const c = (1 - Math.abs(2 * L - 1)) * S
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = L - c / 2
  let rgb: [number, number, number]
  if (h < 60) rgb = [c, x, 0]
  else if (h < 120) rgb = [x, c, 0]
  else if (h < 180) rgb = [0, c, x]
  else if (h < 240) rgb = [0, x, c]
  else if (h < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const to2 = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${to2(rgb[0])}${to2(rgb[1])}${to2(rgb[2])}`
}

const ToastContext = createContext<{ notify: (msg?: string) => void }>({ notify: () => {} })
export const useToast = () => useContext(ToastContext)

export function WorkroomShell({ lang = "ko", children }: { lang?: NavLang; children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [palette, setPalette] = useState(PALETTE_PRESETS[0])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteTarget, setPaletteTarget] = useState<PaletteKey>("paper")
  const [hexDraft, setHexDraft] = useState<Record<PaletteKey, string> | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cart = useCart()

  const notify = (msg = "준비 중인 기능입니다.") => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  const setColor = (key: PaletteKey, hex: string) => {
    setPalette((p) => ({ ...p, name: "custom", [key]: hex }))
    setHexDraft(null)
  }
  const targetHsl = hexToHsl(palette[paletteTarget])

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

  const nav = NAV_ITEMS[lang]

  return (
    <div
      className={styles.page}
      style={{ "--paper": palette.paper, "--ink": palette.ink, "--ph-gray": palette.gray } as React.CSSProperties}
    >
      {/* 모임 설명 헤더용 Gothic A1 (눈누 #891, OFL) — 550 지시 → 정적 9굵기 중 300/600 로드 */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;600&display=swap"
      />
      {/* ── 내비 ── */}
      <header className={`${styles.header} ${menuOpen ? styles.headerOpen : ""}`}>
        <div className={styles.headerLeft}>
          <LazydayLink href={BASE} className={styles.current}>
            lazyday bookclub
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
            {/* 로고는 원본 3색 풀컬러 사용 (운영자 2026-08-04 — 색 제한 완화) */}
            <img src="/assets/logo/lazyday_logo.svg" alt="레이지데이 북클럽" />
          </figure>
          <div className={styles.footerDesc}>
            {/* 문단 + About 링크 한 블록 (운영자 2026-08-04) */}
            <p>
              결이 맞물리는 사람들과 철학과 고전을 함께 읽습니다. 저마다 다른 사유의 궤적 속 불협화음이 고전의
              본질을 관통하는 하나의 선율이 되는 순간을 믿습니다.
            </p>
            <div className={styles.footerAboutLink}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  notify("브랜드 페이지는 준비 중입니다.")
                }}
              >
                About Lazyday Bookclub
              </a>
            </div>
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
            <div className={styles.footerSns}>
              <a href="https://instagram.com/lazyday_bookclub" target="_blank" rel="noopener noreferrer">
                instagram
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

      {/* ── 임시 팔레트 패널 — 시안 색 검토 전용, 이식 시 제거 ── */}
      {paletteOpen ? (
        <div className={styles.palettePanel}>
          <div className={styles.paletteRow}>
            <strong>팔레트 (임시)</strong>
            <button type="button" onClick={() => setPaletteOpen(false)}>
              닫기
            </button>
          </div>
          {(Object.keys(PALETTE_LABELS) as PaletteKey[]).map((key) => (
            <div key={key} className={styles.paletteRow}>
              <button
                type="button"
                className={`${styles.paletteTarget} ${paletteTarget === key ? styles.paletteTargetActive : ""}`}
                onClick={() => setPaletteTarget(key)}
              >
                {PALETTE_LABELS[key]}
              </button>
              <input type="color" value={palette[key]} onChange={(e) => setColor(key, e.target.value)} />
              <input
                type="text"
                className={styles.paletteHex}
                value={hexDraft?.[key] ?? palette[key]}
                spellCheck={false}
                onChange={(e) => {
                  const v = e.target.value
                  setHexDraft((d) => ({ ...(d ?? { ...palette }), [key]: v }) as Record<PaletteKey, string>)
                  const withHash = v.startsWith("#") ? v : `#${v}`
                  if (/^#[0-9a-f]{6}$/i.test(withHash)) setColor(key, withHash.toLowerCase())
                }}
                onBlur={() => setHexDraft(null)}
              />
            </div>
          ))}
          <label className={styles.paletteRow}>
            채도 {targetHsl.s}
            <input
              type="range"
              min={0}
              max={100}
              value={targetHsl.s}
              onChange={(e) => setColor(paletteTarget, hslToHex(targetHsl.h, Number(e.target.value), targetHsl.l))}
            />
          </label>
          <label className={styles.paletteRow}>
            명도 {targetHsl.l}
            <input
              type="range"
              min={0}
              max={100}
              value={targetHsl.l}
              onChange={(e) => setColor(paletteTarget, hslToHex(targetHsl.h, targetHsl.s, Number(e.target.value)))}
            />
          </label>
          <div className={styles.palettePresets}>
            {PALETTE_PRESETS.map((p) => (
              <button key={p.name} type="button" onClick={() => setPalette(p)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" className={styles.paletteToggle} onClick={() => setPaletteOpen(true)}>
          팔레트
        </button>
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
