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
      const scrollY = window.scrollY + offset
      let current = navItems[0].id
      for (const { id } of navItems) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollY) current = id
      }
      setActiveId(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
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
