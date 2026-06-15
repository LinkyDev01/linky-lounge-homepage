import Image from "next/image"
import { season3Config } from "./book-config"
import type { Book } from "./book-config"
import { BookSubNav } from "./BookSubNav"
import { BookCoverStrip } from "./BookCoverStrip"
import { PastSeasonStripWrapper } from "./PastSeasonStripWrapper"
import { PastSeasonsSection } from "./PastSeasonsSection"
import { FadeUp } from "@/components/animation/FadeUp"
import styles from "./BookSection.module.css"

function BookItem({ book, withImage, seasonPrefix }: { book: Book; withImage: boolean; seasonPrefix: string }) {
  const hasContent = book.quotes.length > 0 || book.paragraphs.length > 0 || book.curatorNote

  return (
    <article id={`book-${seasonPrefix}-w${book.week}`} className={styles.bookItem}>
      <p className={styles.weekLabel}>{book.weekLabel}</p>

      {withImage && book.imagePath ? (
        <div className={styles.coverWrapper}>
          <Image
            src={book.imagePath}
            alt={book.title || book.weekLabel}
            width={120}
            height={180}
            className={styles.cover}
          />
        </div>
      ) : book.imagePath ? (
        <div className={styles.coverWrapper}>
          <Image
            src={book.imagePath}
            alt={book.title || book.weekLabel}
            width={120}
            height={180}
            className={styles.cover}
          />
        </div>
      ) : (
        <div className={styles.coverPlaceholder} />
      )}

      {book.title && (
        <div className={styles.bookInfo}>
          <h3 className={styles.title}>{book.title}</h3>
          <p className={styles.author}>{book.author}</p>
        </div>
      )}

      {hasContent && (
        <>
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
        </>
      )}
    </article>
  )
}

export function BookSection() {
  return (
    <section id="book" className={styles.section}>
      <BookSubNav />

      <div className={styles.content}>
        <FadeUp>
          <div className={styles.titleRow}>
            <h2 className={styles.sectionTitle}>책 소개</h2>
          </div>
        </FadeUp>

        {/* 3기 — 현재 기수 */}
        <div className={styles.currentSeason}>
          <FadeUp>
            <p className={styles.seasonLabel}>
              3기
              {season3Config.dateRange && (
                <span className={styles.dateRange}>{season3Config.dateRange}</span>
              )}
            </p>
          </FadeUp>
          <BookCoverStrip books={season3Config.books} seasonPrefix="s3" isSticky />
          <div className={styles.bookList}>
            {season3Config.books.map((book) => (
              <BookItem key={book.week} book={book} withImage={true} seasonPrefix="s3" />
            ))}
          </div>
        </div>

        {/* 지난 기수 커버 스트립 (details open 시에만 노출, 선택된 기수에 따라 분기) */}
        <PastSeasonStripWrapper />

        {/* 지난 기수 */}
        <details id="past-seasons" className={styles.pastSeasons}>
          <summary className={styles.pastSeasonsSummary}>
            지난 기수
            <span className={styles.chevron}>›</span>
          </summary>
          <div id="past-seasons-content" className={styles.pastSeasonsContent}>
            <div className={styles.pastSeasonsContentInner}>
              <PastSeasonsSection />
            </div>
          </div>
        </details>
      </div>
    </section>
  )
}
