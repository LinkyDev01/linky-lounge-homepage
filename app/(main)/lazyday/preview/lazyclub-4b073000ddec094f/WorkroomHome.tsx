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
import { ArrowIcon, BASE, BOOKCLUB_BOOK_URL, BOOKCLUB_URL, SaveIcon, StatusOverlay, useToast, WorkroomShell } from "./Shell"
import { useSaved } from "./store"
import styles from "./home.module.css"

type NavLang = "ko" | "en"

/** 굿즈(제품) 섹션 — 라운드 78에서 잠정 보류(false)했다가 **라운드 82에서 부활** (운영자).
 *  내비 '제품' 항목도 함께 복귀 (Shell.tsx — 모임과 아카이브 사이, #shop 앵커). */
const SHOW_GOODS = true

/** 전체보기 홈 맨 아래 **아카이브 캐러셀**(역대 기수 표지 16권) — 라운드 92에서
 *  운영자 지시로 **일단 숨김**. 구현·데이터(book-config)는 그대로, 렌더만 끈다 —
 *  다시 켜려면 true 로. 내비의 '아카이브'(→ /archive 별도 페이지)는 영향 없음. */
const SHOW_ARCHIVE = false

// 역대 기수 선정 도서 — 최신 우선 (03), book-config 단일 출처
const ALL_BOOKS = [season4Config, season3Config, season2Config, season1Config].flatMap((s) =>
  s.books.map((b) => ({ key: `${s.label}-${b.week}`, alt: `${s.label} ${b.weekLabel} 『${b.title}』 ${b.author}`, src: b.imagePath })),
)

/** 랜딩 콘텐츠 인덱스 항목 — 카테고리가 성격을 말하고 별도 메타 텍스트는 없음
 *  (운영자 2026-08-04 라운드 14: "후기 → reviews, 일정과 장소 → place 식으로 정돈")
 *  ⚠️ 라운드 77(운영자): 모임 목록에서 **미렌더** — 원데이토크 2건과 레이지데이 북클럽만 남김.
 *     데이터는 부활 대비로 보존한다 (삭제 금지). */
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
    tag: "7/15-9/6",
    status: "soldout" as const,
    title: "레이지데이 북클럽 3기",
    link: BOOKCLUB_BOOK_URL,
    thumbnail: "/linky-lounge/book-club/home-v3/poster-3rd.webp",
  },
  {
    id: "bookclub-2",
    category: "bookclub",
    tag: "5/21-7/12",
    status: "soldout" as const,
    title: "레이지데이 북클럽 2기",
    link: BOOKCLUB_BOOK_URL,
    thumbnail: "/linky-lounge/book-club/home-v3/poster-2nd.webp",
  },
  // 라운드 77 (운영자): 1기 추가 — 포스터는 운영자 제공본
  {
    id: "bookclub-1",
    category: "bookclub",
    tag: "3/19-5/17",
    status: "soldout" as const,
    title: "레이지데이 북클럽 1기",
    link: BOOKCLUB_BOOK_URL,
    thumbnail: "/linky-lounge/book-club/home-v3/poster-1st.webp",
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
  // 숨김 상태에서는 자동 넘김 타이머도 돌리지 않는다 (라운드 92)
  const carousel = useDragCarousel(ALL_BOOKS.length, SHOW_ARCHIVE)

  const booktalks = [...ONE_DAY_MEETINGS].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1))

  // 기수 진열 (라운드 24 이동 · 라운드 26 굿즈와 동일 배열) — 4기 → 랜딩, 2·3기 sold out
  const seasonItems = [
    {
      id: "bookclub-4",
      // 라운드 82: 태그 = 기수별 일정 (운영자 제공 — 4기 9/7-11/1)
      tag: "9/7-11/1",
      status: "open" as const,
      title: `레이지데이 북클럽 ${SEASON.name}`,
      link: BOOKCLUB_URL,
      thumbnail: "/linky-lounge/book-club/home-v3/hero-4th-poster.webp",
    },
    ...PAST_SEASONS,
  ]
  const seasonCarousel = useDragCarousel(seasonItems.length)

  // 모임 리스트 = 원데이토크만 (라운드 77 운영자: 랜딩 부연설명 4건 제거).
  // 지난 기수는 라운드 24에서 우측 '레이지데이 북클럽' 섹션으로 이동
  const items = booktalks.map((m) => ({
    id: `meeting-${m.slug}`,
    // 작은 글씨 = 카테고리가 아니라 진행 주체 (운영자 2026-08-18: 지금은 전부 우리가
    // 진행하니 "레이지데이 북클럽" — 외부 모임장이 생기면 그 모임장명이 뜨도록
    // one-day-config 의 host 필드를 그대로 노출한다)
    category: m.host,
    status: m.status,
    title: m.title,
    link: `${BASE}/meetings/${m.slug}`,
    thumbnail: m.thumbnail,
  }))
  const itemCount = items.length
  const lastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1)
  // 굿즈도 같은 2열 리스트 문법으로 (라운드 77: 우측 사이드바 → 좌측 모임 아래)
  const goodsLastRowStart = GOODS.length - (GOODS.length % 2 === 0 ? 2 : 1)

  const toggleSave = (id: string) => {
    notify(saved.toggle(id) ? "저장했습니다." : "저장을 해제했습니다.")
  }

  return (
    <main className={styles.content}>
      {/* 상단 정규모임 모듈은 라운드 24에서 삭제 — 4기는 우측 '레이지데이 북클럽' 섹션의
           단일 항목(포스터+제목)으로 이동. 워드서치 마크·coming soon은 /coming-soon 전용
           페이지로 분리 (라운드 30) — 이 홈은 기존 기획안 그대로 내부 검토용 */}
      {/* ── ①② 좌: 모임 + 굿즈 / 우: 레이지데이 북클럽 (라운드 77 재배치) ── */}
      <div className={styles.textsShop} id="meetings">
        <section className={styles.meetings}>
          <div className={styles.sectionTitle}>
            <LazydayLink href={`${BASE}/meetings`}>
              <span>모임</span>
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

          {/* ── 굿즈 — 라운드 77(운영자): 우측 사이드바 → 좌측 모임 아래.
                 진열 문법도 모임과 같은 2열 리스트로 통일, 태그는 전부 '제품'.
                 라운드 78: 잠정 보류 — SHOW_GOODS 로만 껐다 (구현·데이터는 그대로) ── */}
          {SHOW_GOODS && (
          <div className={styles.goodsBlock} id="shop">
            <div className={styles.sectionTitle}>
              <a href="#shop">
                <span>굿즈</span>
                <ArrowIcon />
              </a>
            </div>
            <div className={styles.meetingsList}>
              {GOODS.map((g, idx) => {
                const isLastRow = idx >= goodsLastRowStart
                const isLast = idx === GOODS.length - 1
                return (
                  <article
                    key={g.slug}
                    className={`${styles.item} ${isLastRow ? styles.rowLast : ""} ${isLast ? styles.itemLast : ""}`}
                  >
                    <LazydayLink
                      href={`${BASE}/shop/${g.slug}`}
                      className={styles.itemLink}
                      aria-label={`${g.name} 상세로 이동`}
                    />
                    <figure className={styles.itemFigure}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.img} alt={g.name} draggable={false} />
                      {g.status !== "open" && <StatusOverlay status={g.status} />}
                    </figure>
                    <div className={styles.itemBody}>
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
                )
              })}
            </div>
          </div>
          )}
        </section>

        <aside className={styles.shop}>
          <div className={styles.sectionTitle}>
            <a href={BOOKCLUB_URL} target="_blank" rel="noopener noreferrer">
              <span>레이지데이 북클럽</span>
              <ArrowIcon />
            </a>
          </div>
          {/* 기수 진열 — 구 굿즈와 동일한 배열(shopItem 문법, 모바일 가로 넘김)로 통일
               (운영자 라운드 26 "원래 굿즈 배열했던 것처럼"). 포스터+제목만, 2·3기 sold out */}
          <div className={`${styles.shopList} ${styles.seasonList}`}>
            <div ref={seasonCarousel.trackRef} className={styles.shopTrack} onScroll={seasonCarousel.onScroll}>
              {seasonItems.map((s) => (
                <article key={s.id} className={styles.shopItem}>
                  {/* 라운드 81: 북클럽은 다른 도메인 — 새 탭 (LazydayLink는 내부 경로 전용) */}
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.itemLink}
                    aria-label={`${s.title} 안내로 이동 (새 탭)`}
                  />
                  <figure className={styles.shopFigure}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.thumbnail} alt="" draggable={false} />
                    {s.status !== "open" && <StatusOverlay status={s.status} />}
                  </figure>
                  <div className={styles.shopBody}>
                    <div>
                      <div className={styles.itemCat}>{s.tag}</div>
                      <div className={styles.shopName}>{s.title}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.shopDots}>
              {seasonItems.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`${styles.dot} ${i === seasonCarousel.active ? styles.dotActive : ""}`}
                  aria-label={`${i + 1}번째 기수로 이동`}
                  onClick={() => seasonCarousel.scrollTo(i)}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── ③ 아카이브 캐러셀 (역대 기수 표지 16권, 최신 우선 — book-config 단일 출처)
             라운드 77(운영자): 맨 위 → 맨 아래로 이동
             라운드 92(운영자): 일단 숨김 — SHOW_ARCHIVE 로만 껐다 (구현·데이터는 그대로) ── */}
      {SHOW_ARCHIVE && (
      <section className={`${styles.books} ${styles.booksBottom}`}>
        <div className={styles.sectionTitle}>
          <LazydayLink href="/">
            <span>아카이브</span>
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
      )}
    </main>
  )
}

export function WorkroomHome() {
  return (
    <WorkroomShell>
      <HomeContent />
      {/* 스크롤 거북이(라운드 132)는 숨김 (운영자 2026-08-18) — 컴포넌트는
          ScrollTurtle.tsx 에 보존, 필요 시 이 자리에 다시 넣으면 된다 */}
    </WorkroomShell>
  )
}
