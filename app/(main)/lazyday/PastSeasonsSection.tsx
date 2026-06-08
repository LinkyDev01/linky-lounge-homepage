"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { season1Config, season2Config } from "./book-config"
import type { Book } from "./book-config"
import { FadeUp } from "@/components/animation/FadeUp"
import styles from "./BookSection.module.css"

function PastBookItem({ book, seasonPrefix }: { book: Book; seasonPrefix: string }) {
  return (
    <article id={`book-${seasonPrefix}-w${book.week}`} className={styles.bookItem}>
      <p className={styles.weekLabel}>{book.weekLabel}</p>

      {book.imagePath && (
        <div className={styles.coverWrapper}>
          <Image
            src={book.imagePath}
            alt={book.title || book.weekLabel}
            width={120}
            height={180}
            className={styles.cover}
          />
        </div>
      )}

      {book.title && (
        <div className={styles.bookInfo}>
          <h3 className={styles.title}>{book.title}</h3>
          <p className={styles.author}>{book.author}</p>
        </div>
      )}

      {book.quotes.length > 0 && (
        <div className={styles.quotes}>
          {book.quotes.map((quote, i) => (
            <blockquote key={i} className={styles.quote}>{quote}</blockquote>
          ))}
        </div>
      )}

      {book.paragraphs.length > 0 && (
        <div className={styles.description}>
          {book.paragraphs.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
      )}

      {book.curatorNote && (
        <div className={styles.curatorNoteBlock}>
          <span className={styles.curatorNoteLabel}>이 책을 고른 이유</span>
          <p className={styles.curatorNote}>{book.curatorNote}</p>
        </div>
      )}
    </article>
  )
}

type PastSeason = "s2" | "s1"

export function PastSeasonsSection() {
  const [active, setActive] = useState<PastSeason>("s2")

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("pastSeasonChange", { detail: { season: active } })
    )
  }, [active])

  const config = active === "s1" ? season1Config : season2Config

  return (
    <div>
      <div className={styles.pastSeasonsTabs}>
        <button
          type="button"
          className={`${styles.pastSeasonTab} ${active === "s2" ? styles.pastSeasonTabActive : ""}`}
          onClick={() => setActive("s2")}
        >
          2기
        </button>
        <button
          type="button"
          className={`${styles.pastSeasonTab} ${active === "s1" ? styles.pastSeasonTabActive : ""}`}
          onClick={() => setActive("s1")}
        >
          1기
        </button>
      </div>

      <p className={styles.seasonLabel}>
        {config.label}
        {config.dateRange && (
          <span className={styles.dateRange}>{config.dateRange}</span>
        )}
      </p>

      <div className={styles.bookList}>
        {config.books.map((book, i) => (
          <FadeUp key={`${active}-${book.week}`} delay={i * 0.06}>
            <PastBookItem book={book} seasonPrefix={active} />
          </FadeUp>
        ))}
      </div>
    </div>
  )
}
