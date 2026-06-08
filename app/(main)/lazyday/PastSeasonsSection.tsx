"use client"

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

export function PastSeasonsSection() {
  return (
    <div>
      {/* 2기 */}
      <p className={styles.seasonLabel}>
        {season2Config.label}
        {season2Config.dateRange && (
          <span className={styles.dateRange}>{season2Config.dateRange}</span>
        )}
      </p>
      <div className={styles.bookList}>
        {season2Config.books.map((book, i) => (
          <FadeUp key={`s2-${book.week}`} delay={i * 0.06}>
            <PastBookItem book={book} seasonPrefix="s2" />
          </FadeUp>
        ))}
      </div>

      {/* 1기 */}
      <p className={`${styles.seasonLabel} ${styles.seasonLabelDivider}`}>
        {season1Config.label}
        {season1Config.dateRange && (
          <span className={styles.dateRange}>{season1Config.dateRange}</span>
        )}
      </p>
      <div className={styles.bookList}>
        {season1Config.books.map((book, i) => (
          <FadeUp key={`s1-${book.week}`} delay={i * 0.06}>
            <PastBookItem book={book} seasonPrefix="s1" />
          </FadeUp>
        ))}
      </div>
    </div>
  )
}
