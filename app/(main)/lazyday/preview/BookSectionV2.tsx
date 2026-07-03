"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { season1Config, season2Config, season3Config } from "../book-config"
import type { SeasonConfig } from "../book-config"
import bstyles from "../BookSection.module.css"
import styles from "./preview.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 책 소개 V2 — 세로 나열 대신 '커버 선택 + 카드 슬라이드' 구조.
 *  · 상단에 이번 기수 4권의 커버를 나열, 클릭(또는 카드 스와이프/화살표)으로 한 권씩 열람
 *  · 기수 탭(3기·2기·1기)으로 지난 기수 책도 같은 UI에서 열람
 *    — 눈에 띄되(탭이 항상 보임) 강요되지 않게(클릭해야 펼쳐짐)
 */
const SEASONS: SeasonConfig[] = [season3Config, season2Config, season1Config]

export function BookSectionV2() {
  const [seasonIdx, setSeasonIdx] = useState(0)
  const [bookIdx, setBookIdx] = useState(0)
  const touchX = useRef<number | null>(null)

  const season = SEASONS[seasonIdx]
  const books = season.books
  const book = books[Math.min(bookIdx, books.length - 1)]

  function selectSeason(i: number) {
    setSeasonIdx(i)
    setBookIdx(0)
  }
  function prev() { setBookIdx((i) => Math.max(0, i - 1)) }
  function next() { setBookIdx((i) => Math.min(books.length - 1, i + 1)) }

  // 카드 스와이프: 40px 이상 가로 이동 시 이전/다음
  function onTouchStart(e: React.TouchEvent) { touchX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0) next()
    else prev()
  }

  return (
    <section id="book" className={bstyles.section}>
      <div className={bstyles.content}>
        <FadeUp>
          <div className={styles.bookTitleRow}>
            <h2 className={bstyles.sectionTitle}>책 소개</h2>
            <div className={styles.seasonTabs} role="tablist" aria-label="기수 선택">
              {SEASONS.map((s, i) => (
                <button
                  key={s.label}
                  role="tab"
                  aria-selected={i === seasonIdx}
                  className={`${styles.seasonTab} ${i === seasonIdx ? styles.seasonTabActive : ""}`}
                  onClick={() => selectSeason(i)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {season.dateRange && (
            <p className={styles.seasonRange}>{season.label} · {season.dateRange}</p>
          )}
        </FadeUp>

        {/* 커버 레일 — 클릭으로 책 선택 */}
        <FadeUp>
          <div className={styles.coverRail}>
            {books.map((b, i) => (
              <button
                key={`${season.label}-${b.week}`}
                className={`${styles.coverCell} ${i === bookIdx ? styles.coverCellActive : ""}`}
                onClick={() => setBookIdx(i)}
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
        </FadeUp>

        {/* 선택된 책 카드 — 스와이프/화살표로 이동 */}
        <div
          key={`${season.label}-${book.week}`}
          className={styles.bookDetail}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className={styles.bookDetailHead}>
            <Image
              src={book.imagePath}
              alt={book.title}
              width={96}
              height={144}
              className={styles.bookDetailCover}
            />
            <div>
              <p className={styles.bookDetailWeek}>{book.weekLabel}</p>
              <h3 className={styles.bookDetailTitle}>{book.title}</h3>
              <p className={styles.bookDetailAuthor}>{book.author}</p>
            </div>
          </div>

          {book.quotes.map((q, i) => (
            <blockquote key={i} className={styles.bookQuote}>{q}</blockquote>
          ))}
          {book.paragraphs.map((p, i) => (
            <p key={i} className={styles.bookParagraph}>{p}</p>
          ))}
          {book.curatorNote && (
            <>
              <span className={styles.bookCuratorLabel}>이 책을 고른 이유</span>
              <p className={styles.bookCuratorNote}>{book.curatorNote}</p>
            </>
          )}

          <div className={styles.bookNav}>
            <button
              type="button"
              className={styles.bookNavBtn}
              onClick={prev}
              disabled={bookIdx === 0}
              aria-label="이전 책"
            >
              ‹
            </button>
            <span className={styles.bookNavPos}>
              {bookIdx + 1} / {books.length}
            </span>
            <button
              type="button"
              className={styles.bookNavBtn}
              onClick={next}
              disabled={bookIdx === books.length - 1}
              aria-label="다음 책"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
