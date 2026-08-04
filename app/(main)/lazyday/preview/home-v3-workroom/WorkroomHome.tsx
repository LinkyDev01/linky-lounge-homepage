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

/** 랜딩 콘텐츠 인덱스 항목 — 문구는 랜딩 확정 카피 우선, 다듬기만 쓰레드 어조 */
const LANDING_DOCS = [
  {
    category: "documents",
    title: "타인의 낯선 시선을 기꺼이 환대하는 사람들",
    meta: "모임 소개",
    link: "/#feature",
    thumbnail: "/linky-lounge/book-club/feature/feature-people.webp",
  },
  {
    category: "documents",
    title: "대화는 한 편의 발제문에서 시작됩니다",
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
    title: "멤버들이 남긴 문장",
    meta: "후기",
    link: "/#reviews",
    thumbnail: "/linky-lounge/book-club/reviews/review-01.webp",
  },
]

/** 가로 스크롤 캐러셀 훅 — 드래그 + 휠 가로 변환 + 활성 인덱스 (02 유지 3번) */
function useDragCarousel(slideCount: number) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
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
    setActive(best)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    // 세로 휠 → 가로 스크롤 (02: 드래그/휠 가로 스크롤)
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      if (el.scrollWidth <= el.clientWidth) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

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
  const scrollTo = (i: number) => {
    const el = trackRef.current
    const child = el?.children[i] as HTMLElement | undefined
    if (!el || !child) return
    el.scrollTo({ left: child.offsetLeft + child.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" })
  }

  return { trackRef, active, slideCount, onScroll, onPointerDown, onPointerMove, onPointerUp, onClickCapture, scrollTo }
}

export function WorkroomHome({ lang }: { lang: NavLang }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const carousel = useDragCarousel(ALL_BOOKS.length)
  const shopCarousel = useDragCarousel(2) // 모바일 shop 스와이프 도트 (08)

  const nav = NAV_ITEMS[lang]
  const booktalks = [...ONE_DAY_MEETINGS].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1))
  const hasOpen = booktalks.some((m) => m.status === "open")
  const badge = (status: "open" | "closed") => (status === "open" ? "모집중" : "마감")

  // meetings 리스트: notice 고정 1행(03) → booktalk(모집중 먼저) → 랜딩 콘텐츠 documents
  const noticeMeta = `${SEASON.periodLabel.replaceAll("/", ".")} · ${SEASON.days.map((d) => d.label[0]).join("·")} · 링키라운지`
  const items: {
    category: string
    badgeText?: string
    title: string
    meta?: string
    link: string
    thumbnail?: string
  }[] = [
    {
      category: "notice",
      title: `레이지데이 북클럽 ${SEASON.name} 멤버를 모집합니다.`,
      meta: noticeMeta,
      link: "/",
      thumbnail: "/linky-lounge/book-club/4th-poster-typo.webp",
    },
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
    <div className={styles.page}>
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
                {/* 굿즈 진열 (03: 가격 미표기, 사진 플레이스홀더 + 품명) */}
                <article className={styles.shopItem}>
                  <div className={styles.shopFigure} role="img" aria-label="레이지데이 코스터 (사진 준비 중)" />
                  <div className={styles.shopBody}>
                    <div>
                      <div className={styles.itemCat}>goods</div>
                      <div className={styles.shopName}>레이지데이 코스터</div>
                    </div>
                  </div>
                </article>
                <article className={styles.shopItem}>
                  <div className={styles.shopFigure} role="img" aria-label="레이지데이 머그 5색 (사진 준비 중)" />
                  <div className={styles.shopBody}>
                    <div>
                      <div className={styles.itemCat}>goods</div>
                      <div className={styles.shopName}>레이지데이 머그 (5색)</div>
                    </div>
                  </div>
                </article>
              </div>
              <div className={styles.shopDots}>
                {[0, 1].map((i) => (
                  <button
                    key={i}
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
            {/* 화면 노출 로고 = mono-ink (로고 사용 규칙, §9) */}
            <img src="/assets/logo/logo-mono-ink.svg" alt="레이지데이 북클럽" />
          </figure>
          <div className={styles.footerDesc}>
            {/* 브랜드 단락 1문단 발췌 — 운영자 확정 원문 그대로 (05) */}
            문학과 철학, 예술의 한가운데서, 쉽게 공감하는 대화보다 서로 다른 시선과 부딪히는 순간을 기다리는
            사람들이 모입니다. 무색무취한 이야기에 고개만 끄덕이지 않습니다. 서로의 시선이 엇갈리는 순간, 고립되어
            있던 내 관점이 타인의 시선에 부딪혀 언제든 깨질 수 있음을 받아들이며 그 순간을 환대합니다.
          </div>
          <div className={styles.footerAbout}>
            {/* 브랜드 페이지 링크 — 페이지는 확산 단계 예정 (README 파이프라인 7) */}
            <a href="#">About Lazyday Bookclub</a>
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
    </div>
  )
}
