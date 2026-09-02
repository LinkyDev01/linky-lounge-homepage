"use client"

/**
 * 홈 v3 — 워크룸 이식판 (docs/redesign/03 구조 · 08 실측값 · 05 카피)
 * 셸(헤더·푸터·토스트·팔레트)은 Shell.tsx 공유 (라운드 10 추출).
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { LazyclubLink } from "./LazyclubLink"
import { ONE_DAY_MEETINGS } from "./one-day-config"
import { CURRENT_SEASON } from "./season-item"
import { GOODS } from "./goods-config"
import { PEOPLE } from "./people-config"
import { HomeCalendar } from "./schedule/MeetupCalendar"
import { RecordsLightbox } from "./RecordsLightbox"
import { ArrowIcon, BASE, BOOKCLUB_BOOK_URL, BOOKCLUB_URL, SaveIcon, StatusOverlay, useToast, WorkroomShell } from "./Shell"
import { useSaved } from "./store"
import styles from "./home.module.css"

type NavLang = "ko" | "en"

/** 굿즈(제품) 섹션 — 라운드 78에서 잠정 보류(false)했다가 **라운드 82에서 부활** (운영자).
 *  내비 '제품' 항목도 함께 복귀 (Shell.tsx — 모임과 아카이브 사이, #shop 앵커). */
const SHOW_GOODS = true

/** 전체보기 홈 맨 아래 **아카이브 캐러셀** — 라운드 92에서 숨겼다가 2026-08-21 운영자
 *  지시로 **부활 + 내용 교체**: 역대 기수 표지 16권(book-config) → **종료된 모임 포스터**
 *  (원데이 토크 시지프·브람스 + 레이지데이 1~3기). 캐러셀 문법·자동 넘김은 종전 그대로.
 *  내비의 '아카이브'(→ /archive 별도 페이지)는 영향 없음. */
const SHOW_ARCHIVE = true


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

/** 기록 = **멤버 후기 사진 10장** (운영자 2026-08-21 정정 — 직전엔 종료된 모임 포스터였으나
 *  "기록이미지에는 … 후기 이미지 여섯 장으로 교체해" — 이후 후기가 늘며 10장).
 *  실사이트 ReviewsSection(app/(main)/lazyday/ReviewsSection.tsx)의 photoCard(카드용
 *  700px 축소본)·caption 을 그대로 가져온다 — 새 이미지 생성·재생산 없음(단일 출처).
 *  caption 이 마침 "…의 기록"이라 이 섹션 이름과 자연히 맞아떨어진다.
 *  클릭 시 실사이트 후기 섹션(#reviews)으로 — 사진별 개별 목적지가 없어 공통 앵커 */
// src = 캐러셀(카드용 700px 축소본) / photo = 모달 원본(세로 1440px) — 실사이트와 같은 배역
const ARCHIVE_SLIDES = [
  { key: "r9", num: "09", title: "2026. 8. 30의 기록" },
  { key: "r1", num: "01", title: "2026. 7. 15의 기록" },
  { key: "r3", num: "03", title: "2026. 7. 12의 기록" },
  { key: "r7", num: "07", title: "2026. 8. 27의 기록" },
  { key: "r2", num: "02", title: "2026. 7. 12의 기록" },
  { key: "r4", num: "04", title: "2026. 7. 12의 기록" },
  { key: "r6", num: "06", title: "2026. 8. 9의 기록" },
  { key: "r5", num: "05", title: "2026. 8. 9의 기록" },
  { key: "r8", num: "08", title: "2026. 8. 27의 기록" },
  { key: "r10", num: "10", title: "2026. 8. 30의 기록" },
].map((r) => ({
  ...r,
  // ⚠ 파일번호는 key 에서 계산하지 않고 **명시한다** — 예전 `review-0${r.key.slice(1)}`
  //   조립은 r10 부터 `review-010` 이 되어 깨졌다 (DECISIONS 2026-08-27 예고, 08-30 발동).
  src: `/linky-lounge/book-club/reviews/review-${r.num}-card.webp`,
  photo: `/linky-lounge/book-club/reviews/review-${r.num}.webp`,
}))

/** 기록(후기) 캐러셀 + 모달 — 홈 '기록' 섹션과 /archive(기록) 페이지가 공유
 *  (운영자 2026-08-21 "기록 페이지 들어가면 아무것도 없는데 … 후기를 이식").
 *  이 파일에 두는 이유: useDragCarousel 훅·ARCHIVE_SLIDES 가 여기 살고 있어서 —
 *  사본을 뜨면 갈라진다 (ClubAside 공용화와 같은 규율) */
export function RecordsCarousel({ autoplay = true }: { autoplay?: boolean }) {
  const [recordIdx, setRecordIdx] = useState<number | null>(null)
  const carousel = useDragCarousel(ARCHIVE_SLIDES.length, autoplay)
  return (
    <>
      <div
        ref={carousel.trackRef}
        className={styles.booksTrack}
        onScroll={carousel.onScroll}
        onPointerDown={carousel.onPointerDown}
        onPointerMove={carousel.onPointerMove}
        onPointerUp={carousel.onPointerUp}
        onClickCapture={carousel.onClickCapture}
      >
        {ARCHIVE_SLIDES.map((a, i) => (
          <button
            key={a.key}
            type="button"
            className={styles.bookSlide}
            onClick={() => setRecordIdx(i)}
            aria-label={`${a.title} 크게 보기`}
          >
            {/* 기록 캐러셀은 페이지 최하단 — 전부 지연 (2026-08-21 최적화) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.src} alt={a.title} draggable={false} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      <div className={styles.dots}>
        {ARCHIVE_SLIDES.map((a, i) => (
          <button
            key={a.key}
            type="button"
            className={`${styles.dot} ${i === carousel.active ? styles.dotActive : ""}`}
            aria-label={`${i + 1}번째 후기 사진으로 이동`}
            onClick={() => carousel.scrollTo(i)}
          />
        ))}
      </div>
      {recordIdx !== null && (
        <RecordsLightbox
          items={ARCHIVE_SLIDES.map((a) => ({ key: a.key, photo: a.photo, caption: a.title }))}
          index={recordIdx}
          onClose={() => setRecordIdx(null)}
          onSlide={setRecordIdx}
        />
      )}
    </>
  )
}

/** 가로 스크롤 캐러셀 훅 — 드래그 + 활성 인덱스 + 자동 넘김 (휠 하이재킹 없음) */
function useDragCarousel(slideCount: number, autoplay = false) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false })

  const onScroll = useCallback(() => {
    const el = trackRef.current
    if (!el || el.children.length === 0) return
    const n = el.children.length
    const maxScroll = el.scrollWidth - el.clientWidth
    let best: number
    if (maxScroll <= 0) {
      best = 0
    } else {
      // 스크롤 진행률로 인덱스를 낸다 — **중앙 거리 최솟값 방식은 양 끝에서 끊겼다**
      // (운영자 2026-08-21 "원점이 진하게 칠해지는 건 중간 부분만이 아닌, 처음부터
      // 끝까지 모두 해당되게"). 원인: 스냅 패딩 때문에 첫·마지막 카드는 뷰포트 중앙까지
      // 못 오는 채로 스크롤이 끝나 버려, 중앙-거리 비교로는 그 카드가 절대 '최선'이
      // 될 수 없었다. 진행률(0→1)을 슬라이드 개수에 매핑하면 scrollLeft=0 에서 항상
      // 0번, 최대 스크롤에서 항상 마지막 번이 나와 전 구간이 빠짐없이 활성화된다.
      const frac = el.scrollLeft / maxScroll
      best = Math.min(n - 1, Math.round(frac * (n - 1)))
    }
    activeRef.current = best
    setActive(best)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    const el = trackRef.current
    if (!el) return
    drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false }
    // ⚠ 캡처는 여기서 하지 않는다 — pointerdown 에서 track 에 setPointerCapture 를 걸면
    // pointerup 의 타깃이 track 으로 바뀌어 **click 이 슬라이드가 아니라 track 에서
    // 발화**한다(공통 조상 규칙). 기록 모달 버튼의 onClick 이 통째로 죽었던 원인
    // (2026-08-21 실측). 캡처는 실제 드래그가 시작된 뒤(onPointerMove)로 미룬다 —
    // 제자리 클릭은 평범한 클릭으로 남는다.
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const el = trackRef.current
    if (!el || !drag.current.down) return
    const dx = e.clientX - drag.current.startX
    if (!drag.current.moved && Math.abs(dx) > 4) {
      drag.current.moved = true
      el.setPointerCapture(e.pointerId) // 드래그 확정 후에만 캡처 — 트랙 밖으로 나가도 이어진다
    }
    if (drag.current.moved) el.scrollLeft = drag.current.startLeft - dx
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

/** 우측 '레이지데이 북클럽' 기수 진열 aside — 홈(전체보기)과 /meetings 가 공유.
 *  (라운드 24 이동 · 라운드 26 굿즈와 동일 배열 · 2026-08-21 컴포넌트로 추출)
 *  · 기본(홈): 전 기수(1~4기, sold out 포함) — 데스크톱 세로 스택 / 모바일 가로 스와이프
 *  · currentOnly (/meetings 전용, 운영자 2026-08-21 정정): 데스크톱은 **현재 기수만**
 *    노출하고 aside 가 sticky 로 스크롤을 따라온다. 모바일은 홈과 같은 전 기수 스와이프.
 *    지난 기수는 DOM 에 남기고 CSS(.shopCurrentOnly .seasonPast)로만 숨긴다 */
export function ClubAside({ currentOnly = false }: { currentOnly?: boolean }) {
  // 현재 기수는 season-item.ts 단일 출처 — 사람 상세의 '진행하는 모임'과 같은 것을 읽는다
  // (2026-08-21). 종전에는 여기 인라인이라 다른 화면에 다시 적을 수밖에 없었다
  const seasonItems = [CURRENT_SEASON, ...PAST_SEASONS]
  const seasonCarousel = useDragCarousel(seasonItems.length)

  return (
    <aside className={`${styles.shop} ${currentOnly ? styles.shopCurrentOnly : ""}`}>
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
          {seasonItems.map((s, i) => (
            <article key={s.id} className={`${styles.shopItem} ${i > 0 ? styles.seasonPast : ""}`}>
              {/* 라운드 81: 북클럽은 다른 도메인 — 새 탭 (LazyclubLink는 내부 경로 전용) */}
              {/* 지난 기수는 **클릭 자체를 막는다** — 현재 기수만 열린다 (운영자 2026-08-21
                  "이전 기수 레이지데이는 클릭 자체가 안되게 막아. 현재 4기만 가능해야해").
                  카드를 덮는 이 링크를 아예 렌더하지 않는 방식 — pointer-events 로 가리면
                  마크업엔 링크가 남아 크롤러·보조기기에는 여전히 이동 가능해 보인다.
                  판정은 status 로 (기수 전환 시 자동으로 따라온다 — 지난 기수는 전부 soldout) */}
              {s.status === "open" && (
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.itemLink}
                  aria-label={`${s.title} 안내로 이동 (새 탭)`}
                />
              )}
              <figure className={styles.shopFigure}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.thumbnail} alt="" draggable={false} />
                {s.status !== "open" && <StatusOverlay status={s.status} kind="meeting" />}
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
  )
}

function HomeContent() {
  const { notify } = useToast()
  const saved = useSaved()

  const booktalks = [...ONE_DAY_MEETINGS].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1))

  // 모임 리스트 = 원데이토크만 (라운드 77 운영자: 랜딩 부연설명 4건 제거).
  // 지난 기수는 라운드 24에서 우측 '레이지데이 북클럽' 섹션으로 이동
  const items = booktalks.map((m) => ({
    id: `meeting-${m.slug}`,
    // 작은 글씨 = 카테고리가 아니라 진행 주체 (운영자 2026-08-18: 지금은 전부 우리가
    // 진행하니 "레이지데이 북클럽" — 외부 모임장이 생기면 그 모임장명이 뜨도록
    // one-day-config 의 host 필드를 그대로 노출한다)
    category: m.catLabel, // 원데이토크 통일 / 개별 모임장은 이름 (운영자 2026-08-21)
    status: m.status,
    title: m.title,
    // 개별 모임은 가격 노출 (운영자 2026-08-21, 제품 섹션과 같은 서식).
    // 레이지데이 북클럽(기수)은 우측 aside 라 여기 해당 없음 — 종전대로 미노출
    price: m.price,
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
          {/* 전체보기에서는 **링크가 아닌 순수 텍스트** (운영자 2026-08-22: "모임, 제품
              카테고리명은 눌러도 해당페이지 가지 않아야해 … 탑네비 통해서만 이동 가능하게").
              화살표(ArrowIcon)도 뗀다 — 링크가 아닌데 화살표만 남으면 눌리는 것처럼 보인다.
              목록 페이지로 가는 길은 상단 내비가 맡는다 */}
          <div className={styles.sectionTitle}>
            <span>모임</span>
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
                  <LazyclubLink href={m.link} className={styles.itemLink} aria-label={`${m.title} 안내로 이동`} />
                  {m.thumbnail && (
                    <figure className={styles.itemFigure}>
                      {/* 첫 행 2장만 즉시(LCP 후보) — 나머지는 지연 (2026-08-21 최적화) */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.thumbnail}
                        alt=""
                        draggable={false}
                        loading={idx < 2 ? "eager" : "lazy"}
                        fetchPriority={idx < 2 ? "high" : undefined}
                        decoding="async"
                      />
                      {m.status !== "open" && <StatusOverlay status={m.status} kind="meeting" />}
                    </figure>
                  )}
                  <div className={styles.itemBody}>
                    <div>
                      <div className={styles.itemCat}>{m.category}</div>
                      <div className={styles.itemTitle}>{m.title}</div>
                      {/* 마감이면 가격 자리를 '마감'이 대신 차지한다 (진적색, 2026-08-21) */}
                      {m.status === "soldout" ? (
                        <div className={styles.shopPriceOut}>마감</div>
                      ) : m.price != null ? (
                        <div className={styles.shopPrice}>₩{m.price.toLocaleString("ko-KR")}</div>
                      ) : null}
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
            {/* 모임과 같이 링크 없는 텍스트 (운영자 2026-08-22) — 2026-08-21 에 화살표
                목적지를 제품 목록으로 고쳤던 항목이 이번 지시로 링크 자체가 폐기됐다 */}
            <div className={styles.sectionTitle}>
              <span>제품</span>
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
                    <LazyclubLink
                      href={`${BASE}/products/${g.slug}`}
                      className={styles.itemLink}
                      aria-label={`${g.name} 상세로 이동`}
                    />
                    <figure className={styles.itemFigure}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.img} alt={g.name} draggable={false} loading="lazy" decoding="async" />
                      {g.status !== "open" && <StatusOverlay status={g.status} kind="goods" />}
                    </figure>
                    <div className={styles.itemBody}>
                      <div>
                        {/* 회색 카테고리 라벨 제거 (운영자 2026-08-21 "사람과 제품에는 작은
                            글씨 회색 카테고리 빼"). 2차 정정: "포스터 위치 대비 상품명의
                            y축 시작점은 동일하게" — 라벨 **높이만** 남긴다(nbsp 스페이서,
                            같은 .itemCat 이라 줄높이·여백이 픽셀 단위로 같다) */}
                        <div className={styles.itemCat} aria-hidden="true">
                          {"\u00A0"}
                        </div>
                        <div className={styles.shopName}>{g.name}</div>
                        {/* 품절이면 가격 자리를 '품절'이 대신 차지한다 (진적색, 2026-08-21) */}
                        {g.status === "soldout" ? (
                          <div className={styles.shopPriceOut}>품절</div>
                        ) : (
                          <div className={styles.shopPrice}>
                            {g.price != null ? `₩${g.price.toLocaleString("ko-KR")}` : "Coming Soon"}
                          </div>
                        )}
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

          {/* ── 사람 — 전체보기에 사람 섹션 추가 (운영자 2026-08-21).
                 내비 순서(모임·제품·사람·일정)에 맞춰 굿즈 아래. 진열 문법은 모임·굿즈와
                 같은 2열 리스트, 태그는 전부 '사람'(굿즈의 '제품' 선례). 카드 → /people/[slug] ── */}
          <div className={styles.goodsBlock} id="people">
            <div className={styles.sectionTitle}>
              <LazyclubLink href={`${BASE}/people`}>
                <span>사람</span>
                <ArrowIcon />
              </LazyclubLink>
            </div>
            <div className={styles.meetingsList}>
              {PEOPLE.map((person, idx) => {
                const peopleLastRowStart = PEOPLE.length - (PEOPLE.length % 2 === 0 ? 2 : 1)
                const isLastRow = idx >= peopleLastRowStart
                const isLast = idx === PEOPLE.length - 1
                return (
                  <article
                    key={person.slug}
                    className={`${styles.item} ${isLastRow ? styles.rowLast : ""} ${isLast ? styles.itemLast : ""}`}
                  >
                    <LazyclubLink
                      href={`${BASE}/people/${person.slug}`}
                      className={styles.itemLink}
                      aria-label={`${person.name} 소개로 이동`}
                    />
                    {/* personFigure — 사진에 프레임 알파가 구워져 있어(2026-08-21) 3:4 cover
                        크롭이면 프레임 곡선이 잘린다 → 프레임 비율 그대로 + 투명 배경 */}
                    <figure className={`${styles.itemFigure} ${styles.personFigure}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={person.photo} alt="" draggable={false} loading="lazy" decoding="async" />
                    </figure>
                    <div className={styles.itemBody}>
                      <div>
                        {/* 카테고리 라벨 제거 + y축 시작점 유지 스페이서 (제품 카드와 동일) */}
                        <div className={styles.itemCat} aria-hidden="true">
                          {"\u00A0"}
                        </div>
                        <div className={styles.itemTitle}>{person.name}</div>
                      </div>
                      {/* 저장하기 없음 — 사람은 담아 두는 물건이 아니다 (운영자 2026-08-21
                          "전체보기에서 사람은 저장하기 기능 빼"). 모임·제품 카드에는 그대로 */}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* 전체보기는 종전대로 전 기수(1~4기, sold out 포함) 진열 — 운영자 2026-08-21 정정:
             "전체보기에서는 과거처럼 sold out 된 1~4기 모임도 다 기존처럼 노출".
             현재 기수만+스티키는 /meetings 페이지 전용 (ClubAside currentOnly) */}
        <ClubAside />
      </div>

      {/* ── 일정 — 캘린더 페이지 이식 (운영자 2026-08-21). '이번 달 모임' 목록은 제외,
             캘린더 + 거북이 트랙(스티키 해제)만. 상단 괘선으로 섹션 구분 ── */}
      <section className={styles.calendarBlock} id="calendar">
        <div className={styles.sectionTitle}>
          <LazyclubLink href={`${BASE}/schedule`}>
            <span>일정</span>
            <ArrowIcon />
          </LazyclubLink>
        </div>
        <HomeCalendar />
      </section>

      {/* ── ③ 기록 — **맨 아래** 멤버 후기 사진 캐러셀. 라운드 77: 맨 위 → 맨 아래 /
             라운드 92: 숨김 / 2026-08-21: 부활 + 후기 사진 6장으로 교체.
             전 슬라이드 **원본 그대로 선명하게** (운영자 2026-08-21 "반투명 또는 무언가로
             기존 원본 이미지를 흐리지 마" — 직전의 흐림·축소 표현 철회).
             클릭 시 실사이트 후기 모달 이식본(RecordsLightbox)이 뜬다 ── */}
      {SHOW_ARCHIVE && (
      <section className={`${styles.books} ${styles.booksBottom} ${styles.archiveBlock}`}>
        <div className={styles.sectionTitle}>
          <LazyclubLink href={`${BASE}/records`}>
            <span>기록</span>
            <ArrowIcon />
          </LazyclubLink>
        </div>
        <RecordsCarousel />
      </section>
      )}

      {/* 전체보기 최하단 마감 괘선 (운영자 2026-08-21) — 아카이브 아래가 진짜 끝 */}
      <div className={styles.homeEndRule} aria-hidden="true" />
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
