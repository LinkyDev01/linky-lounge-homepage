"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import { season1Config, season2Config, season3Config } from "./book-config"
import type { SeasonConfig } from "./book-config"
import styles from "./BookSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 책 소개 — 커버 선택 + 카드 캐러셀 + 기수 세그먼트.
 *  · 상단에 이번 기수 4권의 커버를 나열, 클릭(또는 카드 스와이프/화살표)으로 한 권씩 열람
 *  · 기수 세그먼트(3기·2기·1기)로 지난 기수도 같은 UI에서 열람
 *    — 항상 보이되(세그먼트 상시 노출) 눌러야만 펼쳐짐(강요되지 않음)
 *  · 기수 전환 시 방향성 슬라이드 애니메이션 (과거로 = 오른쪽에서 들어옴)
 */
const SEASONS: SeasonConfig[] = [season3Config, season2Config, season1Config]

export function BookSection() {
  const [seasonIdx, setSeasonIdx] = useState(0)
  const [bookIdx, setBookIdx] = useState(0)
  const [slideDir, setSlideDir] = useState<"left" | "right">("right")
  const trackRef = useRef<HTMLDivElement>(null)
  const segRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)

  const season = SEASONS[seasonIdx]
  const books = season.books
  const isCurrent = seasonIdx === 0

  useLayoutEffect(() => {
    const measure = () => {
      const btn = segRef.current?.querySelectorAll("button")[seasonIdx] as HTMLElement | undefined
      if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [seasonIdx])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const cards = Array.from(track.children) as HTMLElement[]
        if (!cards.length) return
        const center = track.scrollLeft + track.clientWidth / 2
        let best = 0
        let bestDist = Infinity
        cards.forEach((c, i) => {
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center)
          if (d < bestDist) { bestDist = d; best = i }
        })
        setBookIdx(best)
      })
    }
    track.addEventListener("scroll", onScroll, { passive: true })
    return () => { track.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf) }
  }, [seasonIdx])

  function scrollToBook(i: number) {
    const track = trackRef.current
    if (!track) return
    const card = track.children[i] as HTMLElement | undefined
    if (!card) return
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
      behavior: "smooth",
    })
  }

  function selectSeason(i: number) {
    if (i === seasonIdx) return
    setSlideDir(i > seasonIdx ? "right" : "left")
    setSeasonIdx(i)
    setBookIdx(0)
    requestAnimationFrame(() => trackRef.current?.scrollTo({ left: 0 }))
  }

  return (
    <section id="book" className={styles.section}>
      <div className={styles.content}>
        <FadeUp>
          <div className={styles.titleRow}>
            <h2 className={styles.sectionTitle}>책 소개</h2>
          </div>
          <p className={styles.bookLead}>
            {isCurrent ? (
              <>이번 시즌, <strong>{season.label}</strong>가 함께 읽는 네 권</>
            ) : (
              <>지난 <strong>{season.label}</strong>가 함께 읽은 책</>
            )}
            {season.dateRange && <span className={styles.bookLeadRange}> · {season.dateRange}</span>}
          </p>
          <div className={styles.seasonSeg} role="tablist" aria-label="기수 선택" ref={segRef}>
            {thumb && (
              <span
                className={styles.segThumb}
                style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }}
                aria-hidden
              />
            )}
            {SEASONS.map((s, i) => (
              <button
                key={s.label}
                role="tab"
                aria-selected={i === seasonIdx}
                className={`${styles.seasonSegBtn} ${
                  i === seasonIdx ? (thumb ? styles.seasonSegBtnActive : styles.seasonSegBtnActiveFallback) : ""
                }`}
                onClick={() => selectSeason(i)}
              >
                {i === 0 ? `${s.label} (이번 기수)` : s.label}
              </button>
            ))}
          </div>
        </FadeUp>

        <div
          key={season.label}
          className={slideDir === "right" ? styles.seasonSlideRight : styles.seasonSlideLeft}
        >
          <div className={styles.coverRail}>
            {books.map((b, i) => (
              <button
                key={`${season.label}-${b.week}`}
                className={`${styles.coverCell} ${i === bookIdx ? styles.coverCellActive : ""}`}
                onClick={() => scrollToBook(i)}
                aria-label={`${b.weekLabel} ${b.title}`}
                aria-current={i === bookIdx ? "true" : undefined}
              >
                <Image
                  src={b.imagePath}
                  alt={b.title}
                  width={66}
                  height={99}
                  className={styles.coverThumb}
                />
                <span className={styles.coverWeek}>{b.weekLabel}</span>
              </button>
            ))}
          </div>

          <div className={styles.bookCarousel}>
            <button
              type="button"
              className={`${styles.bookChevron} ${styles.bookChevronLeft}`}
              onClick={() => scrollToBook(bookIdx - 1)}
              disabled={bookIdx === 0}
              aria-label="이전 책"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.bookChevron} ${styles.bookChevronRight}`}
              onClick={() => scrollToBook(bookIdx + 1)}
              disabled={bookIdx === books.length - 1}
              aria-label="다음 책"
            >
              ›
            </button>
            <div className={styles.bookTrack} ref={trackRef} key={season.label}>
              {books.map((b, i) => (
                <article
                  key={`${season.label}-${b.week}`}
                  className={`${styles.bookCard} ${i === bookIdx ? styles.bookCardActive : ""}`}
                  onClick={() => i !== bookIdx && scrollToBook(i)}
                >
                  <div className={styles.bookDetailHead}>
                    <Image
                      src={b.imagePath}
                      alt={b.title}
                      width={84}
                      height={126}
                      className={styles.bookDetailCover}
                    />
                    <div>
                      <p className={styles.bookDetailWeek}>{b.weekLabel}</p>
                      <h3 className={styles.bookDetailTitle}>{b.title}</h3>
                      <p className={styles.bookDetailAuthor}>{b.author}</p>
                    </div>
                  </div>

                  {b.quotes.map((q, j) => (
                    <blockquote key={j} className={styles.bookQuote}>{q}</blockquote>
                  ))}
                  {b.paragraphs.map((p, j) => (
                    <p key={j} className={styles.bookParagraph}>{p}</p>
                  ))}
                  {b.curatorNote && (
                    <>
                      <span className={styles.bookCuratorLabel}>이 책을 고른 이유</span>
                      <p className={styles.bookCuratorNote}>{b.curatorNote}</p>
                    </>
                  )}
                </article>
              ))}
            </div>
            <div className={styles.bookDots}>
              {books.map((b, i) => (
                <button
                  key={`dot-${season.label}-${b.week}`}
                  className={`${styles.bookDot} ${i === bookIdx ? styles.bookDotActive : ""}`}
                  onClick={() => scrollToBook(i)}
                  aria-label={`${b.weekLabel}로 이동`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
