"use client"
import { useEffect, useState } from "react"
import styles from "./ApplySectionIndicator.module.css"

const sections = [
  { id: "apply-info", label: "정보" },
  { id: "apply-required", label: "필수작성" },
  { id: "apply-optional", label: "선택작성" },
]

export function ApplySectionIndicator() {
  const [activeId, setActiveId] = useState(sections[0].id)

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.innerHeight * 0.45
      const scrollY = window.scrollY + offset
      let current = sections[0].id
      for (const { id } of sections) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollY) current = id
      }
      setActiveId(current)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav className={styles.indicator} aria-label="신청 섹션 진행 표시">
      {sections.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={(e) => handleClick(e, id)}
          className={`${styles.dot} ${activeId === id ? styles.active : ""}`}
          aria-label={`${label} 섹션으로 이동`}
          aria-current={activeId === id ? "true" : undefined}
        />
      ))}
    </nav>
  )
}
