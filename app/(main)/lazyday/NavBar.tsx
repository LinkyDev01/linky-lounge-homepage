'use client'

import { useEffect, useState } from 'react'
import styles from './NavBar.module.css'

const navItems = [
  { id: 'about',    label: '모임소개' },
  { id: 'book',     label: '책소개' },
  { id: 'howto',    label: '진행방식' },
  { id: 'schedule', label: '모임일정' },
  { id: 'faq',      label: 'FAQ' },
]

export function NavBar() {
  const [activeId, setActiveId] = useState('about')

  useEffect(() => {
    const handleScroll = () => {
      const offset = 56
      for (let i = navItems.length - 1; i >= 0; i--) {
        const el = document.getElementById(navItems[i].id)
        if (el && el.getBoundingClientRect().top <= offset) {
          setActiveId(navItems[i].id)
          return
        }
      }
      setActiveId('about')
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={styles.nav}>
      <ul className={styles.list}>
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={`${styles.item} ${activeId === item.id ? styles.active : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
