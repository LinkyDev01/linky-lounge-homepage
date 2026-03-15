import Image from "next/image"
import { currentSeasonConfig } from "./book-config"
import styles from "./BookSection.module.css"

export function BookSection() {
  const { sectionTitle, introTitle, introParagraphs, books, schedules, scheduleNote } =
    currentSeasonConfig

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{sectionTitle}</h2>

      <div className={styles.intro}>
        {/* <h3 className={styles.introTitle}>{introTitle}</h3> */}
        {introParagraphs.map((text, i) => (
          <p key={i} className={styles.introParagraph}>
            {text}
          </p>
        ))}
      </div>

      <div className={styles.bookList}>
        {books.map((book) => (
          <article key={book.week} className={styles.bookItem}>
            <p className={styles.weekLabel}>{book.weekLabel}</p>

            <div className={styles.coverWrapper}>
              <Image
                src={book.imagePath}
                alt={book.title}
                width={120}
                height={180}
                className={styles.cover}
              />
            </div>

            <div className={styles.bookInfo}>
              <h3 className={styles.title}>{book.title}</h3>
              <p className={styles.author}>{book.author}</p>
            </div>

            <p className={styles.tagline}>{book.tagline}</p>

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

            <p className={styles.note}>{book.note}</p>
          </article>
        ))}
      </div>

      <div className={styles.schedule}>
        <h2 className={styles.scheduleTitle}>모임 일정</h2>
        <div className={styles.scheduleCards}>
          {schedules.map((s) => (
            <div key={s.name} className={styles.scheduleCard}>
              <p className={styles.scheduleName}>{s.name}</p>
              <p className={styles.scheduleTime}>{s.time}</p>
              <p className={styles.scheduleDates}>{s.dates}</p>
            </div>
          ))}
        </div>
        <p className={styles.scheduleNote}>{scheduleNote}</p>
      </div>
    </section>
  )
}
