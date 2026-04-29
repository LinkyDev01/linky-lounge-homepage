'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { Book } from './book-config'
import styles from './BookCoverStrip.module.css'

interface Props {
  books: Book[]
  seasonPrefix: string
  isSticky?: boolean
}

export function BookCoverStrip({ books, seasonPrefix, isSticky = false }: Props) {
  const [activeWeek, setActiveWeek] = useState<number>(books[0]?.week ?? 1)

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    books.forEach(book => {
      const el = document.getElementById(`book-${seasonPrefix}-w${book.week}`)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveWeek(book.week)
        },
        { rootMargin: '-10% 0px -60% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [books, seasonPrefix])

  const handleClick = (week: number) => {
    setActiveWeek(week)
    const el = document.getElementById(`book-${seasonPrefix}-w${week}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={`${styles.strip} ${isSticky ? styles.sticky : ''}`}>
      {books.map(book => (
        <button
          key={book.week}
          className={`${styles.coverBtn} ${activeWeek === book.week ? styles.active : ''}`}
          onClick={() => handleClick(book.week)}
          aria-label={book.title || book.weekLabel}
        >
          {book.imagePath ? (
            <Image
              src={book.imagePath}
              alt={book.title || book.weekLabel}
              width={120}
              height={180}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              className={styles.coverImg}
            />
          ) : (
            <div className={styles.placeholder} />
          )}
          <span className={styles.weekTag}>{book.weekLabel}</span>
        </button>
      ))}
    </div>
  )
}
