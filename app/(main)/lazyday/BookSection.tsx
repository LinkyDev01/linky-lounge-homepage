import { currentSeasonConfig } from "./book-config"
import styles from "./BookSection.module.css"

export function BookSection() {
  const { books } = currentSeasonConfig

  return (
    <section id="book" className={styles.section}>
      <h2 className={styles.sectionTitle}>책 소개</h2>

      <div className={styles.bookList}>
        {books.map((book) => (
          <article key={book.week} className={styles.bookItem}>
            <p className={styles.weekLabel}>{book.weekLabel}</p>

            <div className={styles.coverPlaceholder} />

            <div className={styles.bookInfo}>
              <h3 className={styles.title}>{book.title}</h3>
              <p className={styles.author}>{book.author}</p>
            </div>

            <div className={styles.quotes}>
              {book.quotes.map((quote, i) => (
                <blockquote key={i} className={styles.quote}>
                  {quote}
                </blockquote>
              ))}
            </div>

            <div className={styles.description}>
              {book.paragraphs.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>

            <div className={styles.curatorNoteBlock}>
              <span className={styles.curatorNoteLabel}>이 책을 고른 이유</span>
              <p className={styles.curatorNote}>{book.curatorNote}</p>
            </div>

          </article>
        ))}
      </div>
    </section>
  )
}
