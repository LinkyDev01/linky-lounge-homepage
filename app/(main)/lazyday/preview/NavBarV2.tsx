"use client"
import { useEffect, useState } from "react"
import styles from "../NavBar.module.css"

/**
 * 개선안: '모임소개' 탭이 실제 모임 소개 섹션(#feature)으로 연결되고,
 * 후기 섹션이 탭에 추가됨. (5회차/자유모임은 기수별 구성이 달라 탭에서 제외)
 */
const navItems = [
  { id: "feature",  label: "모임소개" },
  { id: "reviews",  label: "후기" },
  { id: "book",     label: "책소개" },
  { id: "howto",    label: "진행방식" },
  { id: "schedule", label: "모임일정" },
  { id: "faq",      label: "FAQ" },
]

export function NavBarV2() {
  const [activeId, setActiveId] = useState("feature")

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
