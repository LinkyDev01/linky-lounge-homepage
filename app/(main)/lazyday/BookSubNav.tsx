'use client'

import { useEffect, useState } from 'react'
import styles from './BookSubNav.module.css'

export function BookSubNav() {
  const [active, setActive] = useState<'current' | 'past'>('current')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById('book')
      const pastEl = document.getElementById('past-seasons')

      if (section) {
        const rect = section.getBoundingClientRect()
        setVisible(rect.top <= 48 && rect.bottom > 88)
      }

      if (pastEl) {
        const rect = pastEl.getBoundingClientRect()
        setActive(rect.top <= 96 ? 'past' : 'current')
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
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
    <div className={`${styles.subNav} ${visible ? styles.visible : ''}`}>
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
