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
      const threshold = 120
      let current = sections[0].id
      for (const { id } of sections) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top <= threshold) current = id
      }
      setActiveId(current)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)
    // 초기 레이아웃이 안정된 후 측정
    const t1 = setTimeout(handleScroll, 0)
    const t2 = setTimeout(handleScroll, 300)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      clearTimeout(t1)
      clearTimeout(t2)
    }
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
