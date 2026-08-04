"use client"

/**
 * 홈 v3 — 워크룸 이식판 (docs/redesign/03 구조 · 08 실측값 · 05 카피)
 * 정적 골격 + 캐러셀 조작(드래그/휠/도트)만 — 나머지 모션은 골격 승인 후 (02 v3).
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { season1Config, season2Config, season3Config, season4Config } from "../../book-config"
import { SEASON } from "../../season-config"
import { ONE_DAY_MEETINGS } from "./one-day-config"
import styles from "./home.module.css"

/** 섹션 라벨 화살표 ↗ (8×8 — 원문 문법의 관행적 화살표, 자체 드로잉) */
function ArrowIcon() {
  return (
    <span className={styles.labelIcon} aria-hidden>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 7L7 1M7 1H2.2M7 1V5.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </span>
  )
}

type NavLang = "ko" | "en"

// 내비 두 벌 (03: ?nav=ko|en, 기본 ko). ko 확정: 북클럽/원데이 클럽/브랜드 (운영자 2026-08-04)
const NAV_ITEMS: Record<NavLang, { label: string; href: string; anchor?: boolean }[]> = {
  ko: [
    { label: "북클럽", href: "/" },
    { label: "원데이 클럽", href: "#meetings", anchor: true },
    { label: "브랜드", href: "#", anchor: true },
  ],
  en: [
    { label: "books", href: "/" },
    { label: "meetings", href: "#meetings", anchor: true },
    { label: "about", href: "#", anchor: true },
  ],
}

// 역대 기수 선정 도서 — 최신 우선 (03), book-config 단일 출처
const ALL_BOOKS = [season4Config, season3Config, season2Config, season1Config].flatMap((s) =>
  s.books.map((b) => ({ key: `${s.label}-${b.week}`, alt: `${s.label} ${b.weekLabel} 『${b.title}』 ${b.author}`, src: b.imagePath })),
)

/** 랜딩 콘텐츠 인덱스 항목 — 문체는 워크룸 원문 뉘앙스(도록체 명사형·한다체, 운영자 2026-08-04) */
const LANDING_DOCS = [
  {
    category: "documents",
    title: "타인의 낯선 시선을 기꺼이 환대하며",
    meta: "모임 소개",
    link: "/#feature",
    thumbnail: "/linky-lounge/book-club/feature/feature-people.webp",
  },
  {
    category: "documents",
    title: "한 편의 발제문에서 시작되는 북토크",
    meta: "진행 방식",
    link: "/#howto",
    thumbnail: "/linky-lounge/book-club/feature/feature-questions.webp",
  },
  {
    category: "documents",
    title: "이야기가 무르익는 곳, 링키라운지",
    meta: "일정과 장소",
    link: "/#schedule",
    thumbnail: "/linky-lounge/book-club/feature/feature-space.webp",
  },
  {
    category: "documents",
    title: "멤버들이 남긴 문장들",
    meta: "후기",
    link: "/#reviews",
    thumbnail: "/linky-lounge/book-club/reviews/review-01.webp",
  },
]

/** shop 굿즈 — 드라이브 '굿즈' 폴더 실사진, 상품명은 운영자 확정 영문.
 *  카테고리는 'goods' 대신 워크룸 문법의 품목별 소분류(운영자 위임 2026-08-04):
 *  의류 apparel / 탁상 물성 tableware */
const GOODS = [
  { cat: "apparel", name: "Printed T-shirt", img: "/linky-lounge/book-club/home-v3/goods-tshirt.webp" },
  { cat: "tableware", name: "Acrylic Coaster", img: "/linky-lounge/book-club/home-v3/goods-coaster.webp" },
  { cat: "tableware", name: "Coffee Mug (5-color)", img: "/linky-lounge/book-club/home-v3/goods-mug.webp" },
]

/** 가로 스크롤 캐러셀 훅 — 드래그 + 휠 가로 변환 + 활성 인덱스 (+선택적 자동 넘김) */
function useDragCarousel(slideCount: number, autoplay = false) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false })

  const onScroll = useCallback(() => {
    const el = trackRef.current
    if (!el || el.children.length === 0) return
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement
      const center = c.offsetLeft + c.offsetWidth / 2
      const d = Math.abs(center - mid)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    activeRef.current = best
    setActive(best)
  }, [])

  // 세로 휠 하이재킹 없음 — 캐러셀 위에서도 페이지 상하 스크롤만 (운영자 2026-08-04).
  // 가로 이동은 드래그·도트·자동 넘김으로만.

  const onPointerDown = (e: React.PointerEvent) => {
    const el = trackRef.current
    if (!el) return
    drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false }
    el.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const el = trackRef.current
    if (!el || !drag.current.down) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 4) drag.current.moved = true
    el.scrollLeft = drag.current.startLeft - dx
  }
  const onPointerUp = () => {
    drag.current.down = false
  }
  /** 드래그 직후 슬라이드 링크 오클릭 방지 */
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.moved = false
    }
  }
  const scrollTo = useCallback((i: number) => {
    const el = trackRef.current
    const child = el?.children[i] as HTMLElement | undefined
    if (!el || !child) return
    el.scrollTo({ left: child.offsetLeft + child.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" })
  }, [])

  // 자동 넘김 — 원문 문법(간격 2000ms·전환 1000ms, 조작 후에도 지속) 재현.
  // prefers-reduced-motion에서는 정지 (02 불변 조항)
  useEffect(() => {
    if (!autoplay) return
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => {
      const el = trackRef.current
      if (!el || drag.current.down || document.hidden) return
      const max = el.scrollWidth - el.clientWidth
      if (el.scrollLeft >= max - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" }) // 끝에 닿으면 처음으로 되감기
      } else {
        const cur = el.children[Math.min(activeRef.current, el.children.length - 1)] as HTMLElement | undefined
        el.scrollBy({ left: (cur?.offsetWidth ?? el.clientWidth / 5) + 15, behavior: "smooth" })
      }
    }, 3000)
    return () => clearInterval(t)
  }, [autoplay, scrollTo])

  return { trackRef, active, slideCount, onScroll, onPointerDown, onPointerMove, onPointerUp, onClickCapture, scrollTo }
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

export function WorkroomHome({ lang }: { lang: NavLang }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [palette, setPalette] = useState(PALETTE_PRESETS[0])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteTarget, setPaletteTarget] = useState<PaletteKey>("paper")
  // 헥스 입력 초안 (유효할 때만 반영)
  const [hexDraft, setHexDraft] = useState<Record<PaletteKey, string> | null>(null)

  const setColor = (key: PaletteKey, hex: string) => {
    setPalette((p) => ({ ...p, name: "custom", [key]: hex }))
    setHexDraft(null)
  }
  const targetHsl = hexToHsl(palette[paletteTarget])
  const carousel = useDragCarousel(ALL_BOOKS.length, true) // 자동 넘김 (운영자 2026-08-04)
  const shopCarousel = useDragCarousel(GOODS.length) // 모바일 shop 스와이프 도트 (08)

  const nav = NAV_ITEMS[lang]
  const booktalks = [...ONE_DAY_MEETINGS].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1))
  const hasOpen = booktalks.some((m) => m.status === "open")
  const badge = (status: "open" | "closed") => (status === "open" ? "모집중" : "마감")

  // meetings 리스트: booktalk(모집중 먼저) → 랜딩 콘텐츠 documents
  // (4기 모집 notice는 상단 상품 모듈로 승격 — 모집 진입점 1곳 유지, 운영자 2026-08-04)
  const items: {
    category: string
    badgeText?: string
    title: string
    meta?: string
    link: string
    thumbnail?: string
  }[] = [
    ...booktalks.map((m) => ({
      category: m.category,
      badgeText: badge(m.status),
      title: m.title,
      meta: m.date,
      link: m.link,
      thumbnail: m.thumbnail,
    })),
    ...LANDING_DOCS,
  ]
  const itemCount = items.length
  const lastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1) // 데스크톱 2열 마지막 행

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
          <LazydayLink href="/preview/home-v3-workroom" className={styles.current}>
            lazyday bookclub
          </LazydayLink>
          <nav className={styles.navMenu}>
            {nav.map((item) =>
              item.anchor ? (
                <a key={item.label} href={item.href}>
                  {item.label}
                </a>
              ) : (
                <LazydayLink key={item.label} href={item.href}>
                  {item.label}
                </LazydayLink>
              ),
            )}
          </nav>
        </div>
        <div className={`${styles.headerSearch} ${searchOpen ? styles.headerSearchActive : ""}`}>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="search" aria-label="search" />
          </form>
        </div>
        <div className={styles.headerRight}>
          {/* 1차는 search만 — login·cart는 커머스 도입 전까지 미노출 (03) */}
          <button type="button" className={styles.searchTrigger} onClick={() => setSearchOpen((v) => !v)}>
            search
          </button>
        </div>
        <button type="button" className={styles.menuTrigger} onClick={() => setMenuOpen((v) => !v)}>
          menu
        </button>
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <ul>
              {nav.map((item) => (
                <li key={item.label}>
                  {item.anchor ? (
                    <a href={item.href} onClick={() => setMenuOpen(false)}>
                      {item.label}
                    </a>
                  ) : (
                    <LazydayLink href={item.href}>{item.label}</LazydayLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <main className={styles.content}>
        {/* ── ⓪ 정규 독서모임 상품 모듈 (워크룸 상품 상세 구성 차용 — 운영자 2026-08-04)
             맨 윗란은 4기 모집만 홍보. 모집 진입점은 이 1곳 ── */}
        <section className={styles.productHero}>
          <figure className={styles.productFigure}>
            <LazydayLink href="/" aria-label="레이지데이 북클럽 4기 안내로 이동">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/linky-lounge/book-club/home-v3/hero-4th-poster.webp" alt={`레이지데이 북클럽 ${SEASON.name} 모집 포스터`} />
            </LazydayLink>
          </figure>
          <div className={styles.productInfo}>
            <div className={styles.itemCat}>bookclub · 모집중</div>
            <h1 className={styles.productTitle}>
              <LazydayLink href="/">레이지데이 북클럽 {SEASON.name}</LazydayLink>
            </h1>
            <p className={styles.productSub}>오프라인 독서모임</p>
            <div className={styles.productSchedule}>
              <p>{SEASON.periodLabel.replaceAll("/", ".")} · 링키라운지</p>
              {SEASON.days.map((d) => (
                <p key={d.label}>
                  {d.label} {d.time}
                </p>
              ))}
            </div>
            <div className={styles.productDesc}>
              <p className={styles.productLead}>타인의 낯선 시선을 기꺼이 환대하는 분들과</p>
              {/* 브랜드 단락 — 운영자 확정 원문 그대로 (라운드 6에서 원문 원복) */}
              <p>
                문학과 철학, 예술의 한가운데서, 쉽게 공감하는 대화보다 서로 다른 시선과 부딪히는 순간을 기다리는
                사람들이 모입니다. 무색무취한 이야기에 고개만 끄덕이지 않습니다. 서로의 시선이 엇갈리는 순간,
                고립되어 있던 내 관점이 타인의 시선에 부딪혀 언제든 깨질 수 있음을 받아들이며 그 순간을 환대합니다.
              </p>
              {/* 아래 두 문단은 모바일에서 텍스트량 조정을 위해 미노출 (운영자 2026-08-04) */}
              <p className={styles.productDescMore}>
                비슷한 결을 가졌다고 같은 결론에 도달할 필요는 없습니다. 같은 이야기 앞에 멈춰 서도 이어지는 생각은
                저마다 엇갈리고, 그 불협화음 속에서 우리가 가진 생각의 윤곽은 더 또렷해집니다.
              </p>
              <p className={styles.productDescMore}>
                그래서 모든 멤버는 참여에 앞서 인터뷰를 진행합니다. 서로의 결을 미리 엿보며, 우리의 대화가 앞으로
                어떻게 얽혀 나갈지 함께 가늠해 보는 첫 출발점이 되어 줍니다.
              </p>
            </div>
          </div>
        </section>

        {/* ── ① 도서 캐러셀 (역대 기수 표지 16권, 최신 우선 — book-config 단일 출처) ── */}
        <section className={styles.books}>
          <div className={styles.sectionTitle}>
            <LazydayLink href="/">
              <span>books</span>
              <ArrowIcon />
            </LazydayLink>
          </div>
          <div
            ref={carousel.trackRef}
            className={styles.booksTrack}
            onScroll={carousel.onScroll}
            onPointerDown={carousel.onPointerDown}
            onPointerMove={carousel.onPointerMove}
            onPointerUp={carousel.onPointerUp}
            onClickCapture={carousel.onClickCapture}
          >
            {ALL_BOOKS.map((b) => (
              <LazydayLink key={b.key} href="/#book" className={styles.bookSlide} aria-label={b.alt}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt={b.alt} draggable={false} />
              </LazydayLink>
            ))}
          </div>
          <div className={styles.dots}>
            {ALL_BOOKS.map((b, i) => (
              <button
                key={b.key}
                type="button"
                className={`${styles.dot} ${i === carousel.active ? styles.dotActive : ""}`}
                aria-label={`${i + 1}번째 표지로 이동`}
                onClick={() => carousel.scrollTo(i)}
              />
            ))}
          </div>
        </section>

        {/* ── ②③ meetings 리스트 + shop 사이드바 ── */}
        <div className={styles.textsShop} id="meetings">
          <section className={styles.meetings}>
            <div className={styles.sectionTitle}>
              <a href="#meetings">
                <span>meetings</span>
                <ArrowIcon />
              </a>
            </div>
            <div className={styles.meetingsList}>
              {/* notice 고정 1행(모집 진입점) → booktalk → 랜딩 콘텐츠 documents */}
              {items.map((m, idx) => {
                const isLastRow = idx >= lastRowStart
                const isLast = idx === itemCount - 1
                return (
                  <article
                    key={m.title}
                    className={`${styles.item} ${isLastRow ? styles.rowLast : ""} ${isLast ? styles.itemLast : ""}`}
                  >
                    <LazydayLink href={m.link} className={styles.itemLink} aria-label={`${m.title} 안내로 이동`} />
                    {m.thumbnail && (
                      <figure className={styles.itemFigure}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.thumbnail} alt="" draggable={false} />
                      </figure>
                    )}
                    <div className={styles.itemBody}>
                      <div>
                        <div className={styles.itemCat}>
                          {m.category}
                          {m.badgeText ? ` · ${m.badgeText}` : ""}
                        </div>
                        <div className={styles.itemTitle}>{m.title}</div>
                      </div>
                      {m.meta && <div className={styles.itemDate}>{m.meta}</div>}
                    </div>
                  </article>
                )
              })}
            </div>
            {/* 빈 상태 (03) — 예정 모임이 없을 때만 */}
            {!hasOpen && (
              <div className={styles.emptyBlock}>
                <div className={styles.itemCat}>notice</div>
                <div className={styles.itemTitle}>모집 알림 신청</div>
                <form onSubmit={(e) => e.preventDefault()}>
                  <input type="email" placeholder="email" aria-label="모집 알림 이메일" />
                </form>
              </div>
            )}
          </section>

          <aside className={styles.shop} id="shop">
            <div className={styles.sectionTitle}>
              <a href="#shop">
                <span>shop</span>
                <ArrowIcon />
              </a>
            </div>
            <div className={styles.shopList}>
              <div
                ref={shopCarousel.trackRef}
                className={styles.shopTrack}
                onScroll={shopCarousel.onScroll}
              >
                {/* 굿즈 진열 (03: 가격 미표기 — 드라이브 실사진 + 품명) */}
                {GOODS.map((g) => (
                  <article key={g.name} className={styles.shopItem}>
                    <figure className={styles.shopFigure}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.img} alt={g.name} draggable={false} />
                    </figure>
                    <div className={styles.shopBody}>
                      <div>
                        <div className={styles.itemCat}>{g.cat}</div>
                        <div className={styles.shopName}>{g.name}</div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className={styles.shopDots}>
                {GOODS.map((g, i) => (
                  <button
                    key={g.name}
                    type="button"
                    className={`${styles.dot} ${i === shopCarousel.active ? styles.dotActive : ""}`}
                    aria-label={`${i + 1}번째 굿즈로 이동`}
                    onClick={() => shopCarousel.scrollTo(i)}
                  />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── 푸터 ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <figure className={styles.footerLogo}>
            {/* 로고는 원본 3색 풀컬러 사용 (운영자 2026-08-04 — 색 제한 완화) */}
            <img src="/assets/logo/lazyday_logo.svg" alt="레이지데이 북클럽" />
          </figure>
          <div className={styles.footerDesc}>
            {/* 문단 + About 링크 한 블록 (운영자 2026-08-04 — 문단 아래 행에 링크) */}
            <p>
              결이 맞물리는 사람들과 철학과 고전을 함께 읽습니다. 저마다 다른 사유의 궤적 속 불협화음이 고전의
              본질을 관통하는 하나의 선율이 되는 순간을 믿습니다.
            </p>
            <div className={styles.footerAboutLink}>
              {/* 브랜드 페이지 링크 — 페이지는 확산 단계 예정 (README 파이프라인 7) */}
              <a href="#">About Lazyday Bookclub</a>
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
              {/* 컬러코드 직접 입력 — 유효한 6자리 hex일 때 즉시 반영 */}
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
          {/* 채도·명도 — 위에서 선택된 대상에 적용 (색상 H 유지) */}
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
