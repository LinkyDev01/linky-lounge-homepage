"use client"

/**
 * 홈 v3 — 워크룸 이식판 (docs/redesign/03 구조 · 08 실측값 · 05 카피)
 * 셸(헤더·푸터·토스트·팔레트)은 Shell.tsx 공유 (라운드 10 추출).
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { season1Config, season2Config, season3Config, season4Config } from "../../book-config"
import { SEASON } from "../../season-config"
import { ONE_DAY_MEETINGS } from "./one-day-config"
import { GOODS } from "./goods-config"
import { ArrowIcon, BASE, SaveIcon, StatusOverlay, useToast, WorkroomShell } from "./Shell"
import { useSaved } from "./store"
import styles from "./home.module.css"

type NavLang = "ko" | "en"

// 역대 기수 선정 도서 — 최신 우선 (03), book-config 단일 출처
const ALL_BOOKS = [season4Config, season3Config, season2Config, season1Config].flatMap((s) =>
  s.books.map((b) => ({ key: `${s.label}-${b.week}`, alt: `${s.label} ${b.weekLabel} 『${b.title}』 ${b.author}`, src: b.imagePath })),
)

/** 랜딩 콘텐츠 인덱스 항목 — 카테고리가 성격을 말하고 별도 메타 텍스트는 없음
 *  (운영자 2026-08-04 라운드 14: "후기 → reviews, 일정과 장소 → place 식으로 정돈") */
export const LANDING_DOCS = [
  {
    category: "about",
    title: "타인의 낯선 시선을 기꺼이 환대하며",
    link: "/#feature",
    thumbnail: "/linky-lounge/book-club/feature/feature-people.webp",
  },
  {
    category: "process",
    title: "한 편의 발제문에서 시작되는 북토크",
    link: "/#howto",
    thumbnail: "/linky-lounge/book-club/feature/feature-questions.webp",
  },
  {
    category: "place",
    title: "이야기가 무르익는 곳, 링키라운지",
    link: "/#schedule",
    thumbnail: "/linky-lounge/book-club/feature/feature-space.webp",
  },
  {
    category: "reviews",
    title: "멤버들이 남긴 문장들",
    link: "/#reviews",
    thumbnail: "/linky-lounge/book-club/reviews/review-01.webp",
  },
]

/** 지난 기수 — sold out 진열 (라운드 11; 라운드 14에서 메타·뱃지 제거, 오버레이가 상태 표시) */
export const PAST_SEASONS = [
  {
    id: "bookclub-3",
    category: "bookclub",
    status: "soldout" as const,
    title: "레이지데이 북클럽 3기",
    link: "/#book",
    thumbnail: "/linky-lounge/book-club/home-v3/poster-3rd.webp",
  },
  {
    id: "bookclub-2",
    category: "bookclub",
    status: "soldout" as const,
    title: "레이지데이 북클럽 2기",
    link: "/#book",
    thumbnail: "/linky-lounge/book-club/home-v3/poster-2nd.webp",
  },
]

/** 가로 스크롤 캐러셀 훅 — 드래그 + 활성 인덱스 + 자동 넘김 (휠 하이재킹 없음) */
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

  // 자동 넘김 — 3초 간격, 끝에서 되감기. 드래그 중·숨김 탭·reduced-motion 시 정지
  useEffect(() => {
    if (!autoplay) return
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => {
      const el = trackRef.current
      if (!el || drag.current.down || document.hidden) return
      const max = el.scrollWidth - el.clientWidth
      if (el.scrollLeft >= max - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" })
      } else {
        const cur = el.children[Math.min(activeRef.current, el.children.length - 1)] as HTMLElement | undefined
        el.scrollBy({ left: (cur?.offsetWidth ?? el.clientWidth / 5) + 15, behavior: "smooth" })
      }
    }, 3000)
    return () => clearInterval(t)
  }, [autoplay, scrollTo])

  return { trackRef, active, slideCount, onScroll, onPointerDown, onPointerMove, onPointerUp, onClickCapture, scrollTo }
}

function HomeContent() {
  const { notify } = useToast()
  const saved = useSaved()
  const carousel = useDragCarousel(ALL_BOOKS.length, true)
  const shopCarousel = useDragCarousel(GOODS.length)

  const booktalks = [...ONE_DAY_MEETINGS].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1))

  // meetings 리스트: booktalk(모집중 먼저) → 랜딩 콘텐츠 → 지난 기수(sold out)
  // 메타·뱃지 텍스트 없음 — 카테고리와 오버레이만으로 상태 전달 (라운드 14)
  const items = [
    ...booktalks.map((m) => ({
      id: `meeting-${m.slug}`,
      category: m.category,
      status: m.status,
      title: m.title,
      link: `${BASE}/meetings/${m.slug}`,
      thumbnail: m.thumbnail,
    })),
    ...LANDING_DOCS.map((d) => ({ id: `doc-${d.category}`, status: "open" as const, ...d })),
    ...PAST_SEASONS,
  ]
  const itemCount = items.length
  const lastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1)

  const toggleSave = (id: string) => {
    notify(saved.toggle(id) ? "저장했습니다." : "저장을 해제했습니다.")
  }

  return (
    <main className={styles.content}>
      {/* ── ⓪ 정규 독서모임 모듈 — 워크룸 '책 상세' 3열 구성 (라운드 16)
           좌 포스터(축소·오프셋 — 불균형 재해석) / 중 제목 블록 / 우 정보.
           이 상품만 구매·카트 없음: '자세히 보기'·포스터 → 기존 랜딩 ── */}
      <section className={styles.productHero}>
        <figure className={styles.heroFigure}>
          <LazydayLink href="/" aria-label="레이지데이 북클럽 4기 안내로 이동">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/linky-lounge/book-club/home-v3/hero-4th-poster.webp" alt={`레이지데이 북클럽 ${SEASON.name} 모집 포스터`} />
          </LazydayLink>
        </figure>
        <div className={styles.heroMid}>
          <div className={styles.itemCat}>오프라인 독서모임</div>
          <h1 className={styles.productTitle}>
            <LazydayLink href="/">레이지데이 북클럽 {SEASON.name}</LazydayLink>
          </h1>
          <p className={styles.heroDates}>{"'26.09.07-'26.11.01"}</p>
          <button
            type="button"
            className={styles.saveBtn}
            aria-label="저장"
            onClick={() => toggleSave("bookclub-4")}
          >
            <SaveIcon filled={saved.has("bookclub-4")} />
          </button>
        </div>
        <div className={styles.productInfo}>
          <div className={styles.productFields}>
            <div className={styles.productField}>
              <p>장소</p>
              <p>링키라운지(사당역 10번 출구 도보 3분)</p>
            </div>
            <div className={styles.productField}>
              <p>{SEASON.name} 커리큘럼 및 대상 도서</p>
              <p>• 1회차 | 『변신』 - 프란츠 카프카</p>
              <p>• 2회차 | 『피로사회』 - 한병철</p>
              <p>• 3회차 | 『인간 실격』 - 다자이 오사무</p>
              <p>• 4회차 | 『사람, 장소, 환대』 - 김현경</p>
              <p>• 5회차 | 자유 독서모임</p>
            </div>
          </div>
          {/* 가격 미노출 (운영자 라운드 17) · 구매·카트 대신 자세히 보기 → 기존 랜딩 */}
          <div className={styles.productActions}>
            <LazydayLink href="/" className={styles.chipBtn}>
              자세히 보기
            </LazydayLink>
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
            <LazydayLink href={`${BASE}/meetings`}>
              <span>meetings</span>
              <ArrowIcon />
            </LazydayLink>
          </div>
          <div className={styles.meetingsList}>
            {items.map((m, idx) => {
              const isLastRow = idx >= lastRowStart
              const isLast = idx === itemCount - 1
              return (
                <article
                  key={m.id}
                  className={`${styles.item} ${isLastRow ? styles.rowLast : ""} ${isLast ? styles.itemLast : ""}`}
                >
                  <LazydayLink href={m.link} className={styles.itemLink} aria-label={`${m.title} 안내로 이동`} />
                  {m.thumbnail && (
                    <figure className={styles.itemFigure}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.thumbnail} alt="" draggable={false} />
                      {m.status !== "open" && <StatusOverlay status={m.status} />}
                    </figure>
                  )}
                  <div className={styles.itemBody}>
                    <div>
                      <div className={styles.itemCat}>{m.category}</div>
                      <div className={styles.itemTitle}>{m.title}</div>
                    </div>
                    <div className={styles.itemBottom}>
                      <button
                        type="button"
                        className={styles.saveBtn}
                        aria-label={`${m.title} 저장`}
                        onClick={() => toggleSave(m.id)}
                      >
                        <SaveIcon filled={saved.has(m.id)} />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className={styles.shop} id="shop">
          <div className={styles.sectionTitle}>
            <a href="#shop">
              <span>shop</span>
              <ArrowIcon />
            </a>
          </div>
          <div className={styles.shopList}>
            <div ref={shopCarousel.trackRef} className={styles.shopTrack} onScroll={shopCarousel.onScroll}>
              {GOODS.map((g) => (
                <article key={g.slug} className={styles.shopItem}>
                  <LazydayLink href={`${BASE}/shop/${g.slug}`} className={styles.itemLink} aria-label={`${g.name} 상세로 이동`} />
                  <figure className={styles.shopFigure}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.img} alt={g.name} draggable={false} />
                    {g.status !== "open" && <StatusOverlay status={g.status} />}
                  </figure>
                  <div className={styles.shopBody}>
                    <div>
                      <div className={styles.itemCat}>{g.cat}</div>
                      <div className={styles.shopName}>{g.name}</div>
                    </div>
                    <div className={styles.itemBottom}>
                      <button
                        type="button"
                        className={styles.saveBtn}
                        aria-label={`${g.name} 저장`}
                        onClick={() => toggleSave(`goods-${g.slug}`)}
                      >
                        <SaveIcon filled={saved.has(`goods-${g.slug}`)} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.shopDots}>
              {GOODS.map((g, i) => (
                <button
                  key={g.slug}
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
  )
}

export function WorkroomHome() {
  return (
    <WorkroomShell>
      <HomeContent />
    </WorkroomShell>
  )
}
