'use client'

import { useEffect, useState } from 'react'
import styles from './BookSubNav.module.css'

export function BookSubNav() {
  const [active, setActive] = useState<'current' | 'past'>('current')

  useEffect(() => {
    const handleScroll = () => {
      const pastEl = document.getElementById('past-seasons')
      if (!pastEl) return
      const rect = pastEl.getBoundingClientRect()
      setActive(rect.top <= 96 ? 'past' : 'current')
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const goToCurrent = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })
  }

  const goToPast = () => {
    const details = document.getElementById('past-seasons') as HTMLDetailsElement | null
    if (details) {
      details.open = true
      setTimeout(() => {
        document.getElementById('past-seasons-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  return (
    <div className={styles.subNav}>
      <button
        className={`${styles.item} ${active === 'current' ? styles.active : ''}`}
        onClick={goToCurrent}
      >
        이번 기수
      </button>
      <button
        className={`${styles.item} ${active === 'past' ? styles.active : ''}`}
        onClick={goToPast}
      >
        지난 기수
      </button>
    </div>
  )
}
