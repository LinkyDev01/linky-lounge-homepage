import Image from "next/image"
import { season1Config, season2Config, type Book } from "./book-config"
import styles from "./BookSection.module.css"

function BookItem({ book, withImage }: { book: Book; withImage: boolean }) {
  const hasContent = book.quotes.length > 0 || book.paragraphs.length > 0 || book.curatorNote

  return (
    <article className={styles.bookItem}>
      <p className={styles.weekLabel}>{book.weekLabel}</p>

      <div className={styles.coverWrapper}>
        {withImage ? (
          <Image
            src={book.imagePath}
            alt={book.title}
            width={120}
            height={180}
            className={styles.cover}
          />
        ) : book.imagePath ? (
          <Image
            src={book.imagePath}
            alt={book.title}
            width={120}
            height={180}
            className={styles.cover}
          />
        ) : (
          <div className={styles.coverPlaceholder} />
        )}
      </div>

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
      <h2 className={styles.sectionTitle}>책 소개</h2>

      <div className={styles.currentSeason}>
        <p className={styles.seasonLabel}>
          {season2Config.label}
          {season2Config.dateRange && (
            <span className={styles.dateRange}>{season2Config.dateRange}</span>
          )}
        </p>
        <div className={styles.bookList}>
          {season2Config.books.map((book) => (
            <BookItem key={book.week} book={book} withImage={true} />
          ))}
        </div>
      </div>

      <details className={styles.pastSeasons}>
        <summary className={styles.pastSeasonsSummary}>
          지난 기수
          <span className={styles.chevron}>›</span>
        </summary>
        <div className={styles.pastSeasonsContent}>
          <p className={styles.seasonLabel}>{season1Config.label}</p>
          <div className={styles.bookList}>
            {season1Config.books.map((book) => (
              <BookItem key={book.week} book={book} withImage={true} />
            ))}
          </div>
        </div>
      </details>
    </section>
  )
}
