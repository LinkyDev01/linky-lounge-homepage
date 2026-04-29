"use client"
import { useEffect, useState } from "react"
import styles from "./SectionIndicator.module.css"

const sections = [
  { id: "about", label: "모임소개" },
  { id: "vibe", label: "이런 모임" },
  { id: "book", label: "책 소개" },
  { id: "howto", label: "진행" },
  { id: "schedule", label: "일정" },
  { id: "faq", label: "FAQ" },
  { id: "closing-section", label: "신청" },
]

/**
 * 인스타 카드뉴스 dot indicator를 우측 세로 배치.
 * 페이지를 스크롤하면 현재 viewport 중앙에 보이는 섹션이 테라코타로 칠해짐.
 * 각 dot 클릭 시 해당 섹션으로 부드러운 스크롤.
 */
export function SectionIndicator() {
  const [activeId, setActiveId] = useState(sections[0].id)

  useEffect(() => {
    const handleScroll = () => {
      const threshold = window.innerHeight * 0.45
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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav className={styles.indicator} aria-label="섹션 진행 표시">
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
