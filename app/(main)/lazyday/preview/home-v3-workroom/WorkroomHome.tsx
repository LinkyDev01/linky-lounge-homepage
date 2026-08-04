"use client"

/**
 * 홈 v3 — 워크룸 이식판 (docs/redesign/03 구조 · 08 실측값 · 05 카피)
 * 정적 골격 + 캐러셀 조작(드래그/휠/도트)만 — 나머지 모션은 골격 승인 후 (02 v3).
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
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

// 내비 두 벌 (03: ?nav=ko|en, 기본 ko). ko 2번째 항목 '모임'은 01 미결 — 확정 시 교체
const NAV_ITEMS: Record<NavLang, { label: string; href: string; anchor?: boolean }[]> = {
  ko: [
    { label: "기수제", href: "/" },
    { label: "모임", href: "#meetings", anchor: true },
    { label: "브랜드", href: "#", anchor: true },
  ],
  en: [
    { label: "books", href: "/" },
    { label: "meetings", href: "#meetings", anchor: true },
    { label: "about", href: "#", anchor: true },
  ],
}

const PLACEHOLDER_COUNT = 12 // 03: 세로 판형 회색 12칸

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
  const carousel = useDragCarousel(PLACEHOLDER_COUNT)
  const shopCarousel = useDragCarousel(2) // 모바일 shop 스와이프 도트 (08)

  const nav = NAV_ITEMS[lang]
  // meetings 리스트: notice 고정 1행(03) + booktalk (모집중 먼저)
  const meetings = [...ONE_DAY_MEETINGS].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1))
  const itemCount = 1 + meetings.length
  const lastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1) // 데스크톱 2열 마지막 행
  const hasOpen = meetings.some((m) => m.status === "open")

  const badge = (status: "open" | "closed") => (status === "open" ? "모집중" : "마감")

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
        {/* ── ① 도서 캐러셀 (역대 기수 표지 — 플레이스홀더 12칸) ── */}
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
            {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
              <LazydayLink key={i} href="/" className={styles.bookSlide} aria-label={`선정 도서 ${i + 1} (표지 준비 중)`} />
            ))}
          </div>
          <div className={styles.dots}>
            {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
              <button
                key={i}
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
              {/* 고정 notice — 모집 진입점은 이 1곳 (03) */}
              <article
                className={`${styles.item} ${0 >= lastRowStart ? styles.rowLast : ""}`}
              >
                <LazydayLink href="/" className={styles.itemLink} aria-label="레이지데이 북클럽 4기 안내로 이동" />
                <div className={styles.itemBody}>
                  <div>
                    <div className={styles.itemCat}>notice</div>
                    <div className={styles.itemTitle}>레이지데이 북클럽 4기 멤버를 모집합니다.</div>
                  </div>
                </div>
              </article>
              {meetings.map((m, i) => {
                const idx = i + 1
                const isLastRow = idx >= lastRowStart
                const isLast = idx === itemCount - 1
                return (
                  <article
                    key={m.title}
                    className={`${styles.item} ${isLastRow ? styles.rowLast : ""} ${isLast ? styles.itemLast : ""}`}
                  >
                    <LazydayLink href={m.link} className={styles.itemLink} aria-label={`${m.title} 안내로 이동`} />
                    <div className={styles.itemBody}>
                      <div>
                        <div className={styles.itemCat}>
                          {m.category} · {badge(m.status)}
                        </div>
                        <div className={styles.itemTitle}>{m.title}</div>
                      </div>
                      <div className={styles.itemDate}>{m.date}</div>
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
