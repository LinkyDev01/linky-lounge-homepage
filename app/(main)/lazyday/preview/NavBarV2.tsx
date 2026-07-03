"use client"
import { useEffect, useState } from "react"
import styles from "../NavBar.module.css"

/**
 * 개선안: 탭이 실제 섹션 순서(선정도서 → 후기 → 모임소개 → …)를 따르고,
 * '책소개'는 '선정도서'로 표기. 내비 색(브라운 그레이 반투명)은
 * 공용 NavBar.module.css로 실사이트에 반영됨 — 프리뷰는 후기 탭만 추가.
 * (우리가 믿는 것/5회차/자유모임은 기수별 구성이 달라 탭에서 제외)
 */
const navItems = [
  { id: "book",     label: "선정도서" },
  { id: "reviews",  label: "후기" },
  { id: "feature",  label: "모임소개" },
  { id: "howto",    label: "진행방식" },
  { id: "schedule", label: "모임일정" },
  { id: "faq",      label: "FAQ" },
]

export function NavBarV2() {
  const [activeId, setActiveId] = useState("book")

  useEffect(() => {
    const handleScroll = () => {
      const offset = 96 // 프리뷰 바 + 내비 높이
      const scrollY = window.scrollY + offset
      let current = navItems[0].id
      for (const { id } of navItems) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollY) current = id
      }
      setActiveId(current)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav className={styles.nav} style={{ top: 34 }}>
      <ul className={styles.list}>
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={`${styles.item} ${activeId === item.id ? styles.active : ""}`}
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
