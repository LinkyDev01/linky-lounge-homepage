import Image from "next/image"
import { season1Config, season2Config } from "./book-config"
import type { Book } from "./book-config"
import { BookSubNav } from "./BookSubNav"
import { BookCoverStrip } from "./BookCoverStrip"
import { FadeUp } from "@/components/animation/FadeUp"
import { BookMark } from "@/components/illustrations/bauhaus"
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
            <BookMark className={styles.mark} />
            <h2 className={styles.sectionTitle}>책 소개</h2>
          </div>
        </FadeUp>

        {/* 2기 */}
        <div className={styles.currentSeason}>
          <FadeUp delay={0.1}>
            <p className={styles.seasonLabel}>
              2기 <span className={styles.dateRange}>{season2Config.dateRange}</span>
            </p>
          </FadeUp>
          <BookCoverStrip books={season2Config.books} seasonPrefix="s2" isSticky />
          <div className={styles.bookList}>
            {season2Config.books.map((book, i) => (
              <FadeUp key={book.week} delay={i * 0.08}>
                <BookItem book={book} withImage={true} seasonPrefix="s2" />
              </FadeUp>
            ))}
          </div>
        </div>

        {/* 지난 기수 */}
        <details id="past-seasons" className={styles.pastSeasons}>
          <summary className={styles.pastSeasonsSummary}>
            지난 기수
            <span className={styles.chevron}>›</span>
          </summary>
          <div id="past-seasons-content" className={styles.pastSeasonsContent}>
            <div className={styles.pastSeasonsContentInner}>
              <p className={styles.seasonLabel}>
                {season1Config.label}
                {season1Config.dateRange && (
                  <span className={styles.dateRange}>{season1Config.dateRange}</span>
                )}
              </p>
              <BookCoverStrip books={season1Config.books} seasonPrefix="s1" />
              <div className={styles.bookList}>
                {season1Config.books.map((book, i) => (
                  <FadeUp key={book.week} delay={i * 0.06}>
                    <BookItem book={book} withImage={true} seasonPrefix="s1" />
                  </FadeUp>
                ))}
              </div>
            </div>
          </div>
        </details>
      </div>
    </section>
  )
}
