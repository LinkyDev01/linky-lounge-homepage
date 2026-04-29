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
  const [stripVisible, setStripVisible] = useState(false)

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

  useEffect(() => {
    if (!isSticky) return
    const checkVisibility = () => {
      const section = document.getElementById('book')
      if (!section) return
      const rect = section.getBoundingClientRect()
      // strip visible when section top has scrolled past BookSubNav (88px)
      setStripVisible(rect.top <= 88 && rect.bottom > 140)
    }
    window.addEventListener('scroll', checkVisibility, { passive: true })
    checkVisibility()
    return () => window.removeEventListener('scroll', checkVisibility)
  }, [isSticky])

  const handleClick = (week: number) => {
    setActiveWeek(week)
    const el = document.getElementById(`book-${seasonPrefix}-w${week}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const stickyClass = isSticky ? styles.sticky : ''
  const visibleClass = isSticky && stripVisible ? styles.stripVisible : ''

  return (
    <div className={`${styles.strip} ${stickyClass} ${visibleClass}`}>
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
