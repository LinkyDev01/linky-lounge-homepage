"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { season1Config, season2Config, season3Config } from "../book-config"
import type { SeasonConfig } from "../book-config"
import bstyles from "../BookSection.module.css"
import styles from "./preview.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 책 소개 V3 — linkylounge.com 프로그램 캐러셀 패턴 참고 (2026-07-03 피드백)
 *  · 가운데 카드 + 양옆 카드가 살짝 보이는(peek) 스와이프 캐러셀
 *    — 버튼 없이 손가락으로 자연스럽게 넘김 (네이티브 스크롤 스냅)
 *  · 이미지 비중을 줄이고 텍스트(인용·큐레이터 노트) 중심 카드
 *  · 현재 기수(3기)가 기본·강조 — 리드 문장으로 드러내고,
 *    지난 기수는 또렷한 필 버튼으로 열람 (보이되 강요되지 않게)
 */
const SEASONS: SeasonConfig[] = [season3Config, season2Config, season1Config]

export function BookSectionV2() {
  const [seasonIdx, setSeasonIdx] = useState(0)
  const [bookIdx, setBookIdx] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const season = SEASONS[seasonIdx]
  const books = season.books
  const isCurrent = seasonIdx === 0

  // 스크롤 위치 → 활성 카드 동기화 (커버 레일·카드 강조용)
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
    setSeasonIdx(i)
    setBookIdx(0)
    requestAnimationFrame(() => trackRef.current?.scrollTo({ left: 0 }))
  }

  return (
    <section id="book" className={bstyles.section}>
      <div className={bstyles.content}>
        <FadeUp>
          <div className={bstyles.titleRow}>
            <h2 className={bstyles.sectionTitle}>책 소개</h2>
          </div>
          {/* 현재 기수 강조 리드 */}
          <p className={styles.bookLead}>
            {isCurrent ? (
              <>이번 시즌, <strong>{season.label}</strong>가 함께 읽는 네 권</>
            ) : (
              <>지난 <strong>{season.label}</strong>가 함께 읽은 책</>
            )}
            {season.dateRange && <span className={styles.bookLeadRange}> · {season.dateRange}</span>}
          </p>
          {/* 기수 전환 — 세그먼트 컨트롤 */}
          <div className={styles.seasonSeg} role="tablist" aria-label="기수 선택">
            {SEASONS.map((s, i) => (
              <button
                key={s.label}
                role="tab"
                aria-selected={i === seasonIdx}
                className={`${styles.seasonSegBtn} ${i === seasonIdx ? styles.seasonSegBtnActive : ""}`}
                onClick={() => selectSeason(i)}
              >
                {i === 0 ? `${s.label} (이번 기수)` : s.label}
              </button>
            ))}
          </div>
        </FadeUp>

        {/* 커버 레일 — 네 권 한눈에 + 탭하면 해당 카드로 */}
        <FadeUp>
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
                  width={58}
                  height={87}
                  className={styles.coverThumb}
                />
                <span className={styles.coverWeek}>{b.weekLabel}</span>
              </button>
            ))}
          </div>
        </FadeUp>

        {/* 카드 캐러셀 — 가운데 큰 활성 카드 + 양옆 축소 카드 (Programs We Offer 구도) */}
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
        {/* 점 인디케이터 */}
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
    </section>
  )
}
