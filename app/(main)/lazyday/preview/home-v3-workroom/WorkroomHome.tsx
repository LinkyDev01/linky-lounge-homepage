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
import { useCart, useSaved } from "./store"
import styles from "./home.module.css"

type NavLang = "ko" | "en"

// 역대 기수 선정 도서 — 최신 우선 (03), book-config 단일 출처
const ALL_BOOKS = [season4Config, season3Config, season2Config, season1Config].flatMap((s) =>
  s.books.map((b) => ({ key: `${s.label}-${b.week}`, alt: `${s.label} ${b.weekLabel} 『${b.title}』 ${b.author}`, src: b.imagePath })),
)

/** 랜딩 콘텐츠 인덱스 항목 — 문체는 워크룸 원문 뉘앙스(도록체 명사형·한다체, 운영자 2026-08-04) */
export const LANDING_DOCS = [
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
  const cart = useCart()
  const saved = useSaved()
  const carousel = useDragCarousel(ALL_BOOKS.length, true)
  const shopCarousel = useDragCarousel(GOODS.length)

  const booktalks = [...ONE_DAY_MEETINGS].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1))
  const badge = (status: string) => (status === "open" ? "모집중" : status === "soldout" ? "마감" : "오픈 예정")

  // meetings 리스트: booktalk(모집중 먼저) → 랜딩 콘텐츠 documents
  const items = [
    ...booktalks.map((m) => ({
      id: `meeting-${m.slug}`,
      category: m.category,
      badgeText: badge(m.status),
      status: m.status,
      title: m.title,
      meta: m.date,
      link: `${BASE}/meetings/${m.slug}`,
      thumbnail: m.thumbnail,
    })),
    ...LANDING_DOCS.map((d) => ({ id: `doc-${d.meta}`, status: "open" as const, badgeText: "", ...d })),
  ]
  const itemCount = items.length
  const lastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1)

  const toggleSave = (id: string) => {
    notify(saved.toggle(id) ? "저장했습니다." : "저장을 해제했습니다.")
  }
  const addToCart = (item: Parameters<typeof cart.add>[0]) => {
    notify(cart.add(item) ? "카트에 담았습니다." : "이미 카트에 담겨 있습니다.")
  }

  return (
    <main className={styles.content}>
      {/* ── ⓪ 정규 독서모임 상품 모듈 (원문 상세 실측: 이미지 1/8 · 텍스트 11/15) ── */}
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
          <div className={styles.productDesc}>
            <p className={styles.productLead}>타인의 낯선 시선을 기꺼이 환대하는 분들과</p>
            {/* 브랜드 단락 — 운영자 확정 원문 그대로 */}
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
          <div className={styles.productFields}>
            <div className={styles.productField}>
              <p>일시</p>
              <p>{SEASON.periodLabel.replaceAll("/", ".")} · 격주 진행</p>
              {SEASON.days.map((d) => (
                <p key={d.label}>
                  {d.label} {d.time}
                </p>
              ))}
            </div>
            <div className={styles.productField}>
              <p>장소</p>
              <p>링키라운지 (경기도 남양주시 별내3로 322, 404호)</p>
            </div>
            <div className={styles.productField}>
              <p>문의</p>
              <p>contact@linkylounge.com</p>
            </div>
          </div>
          <p className={styles.productPrice}>₩150,000</p>
          {/* 구매하기는 신청 페이지 실연결 */}
          <div className={styles.productActions}>
            <LazydayLink href="/apply" className={styles.chipBtn}>
              구매하기
            </LazydayLink>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() =>
                addToCart({
                  id: "bookclub-4",
                  name: `레이지데이 북클럽 ${SEASON.name}`,
                  price: 150000,
                  href: "/",
                  img: "/linky-lounge/book-club/home-v3/notice-4th-poster.webp",
                })
              }
            >
              카트 담기
            </button>
          </div>
          <button
            type="button"
            className={styles.saveBtn}
            aria-label="저장"
            onClick={() => toggleSave("bookclub-4")}
          >
            <SaveIcon filled={saved.has("bookclub-4")} />
          </button>
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
                      <div className={styles.itemCat}>
                        {m.category}
                        {m.badgeText ? ` · ${m.badgeText}` : ""}
                      </div>
                      <div className={styles.itemTitle}>{m.title}</div>
                    </div>
                    <div className={styles.itemBottom}>
                      {m.meta && <div className={styles.itemDate}>{m.meta}</div>}
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

export function WorkroomHome({ lang }: { lang: NavLang }) {
  return (
    <WorkroomShell lang={lang}>
      <HomeContent />
    </WorkroomShell>
  )
}
