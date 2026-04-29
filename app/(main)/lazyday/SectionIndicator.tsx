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
 * 페이지를 스크롤하면 현재 viewport 30% 라인을 넘은 섹션이 테라코타로 칠해짐.
 * 각 dot 클릭 시 해당 섹션으로 부드러운 스크롤.
 */
export function SectionIndicator() {
  const [activeId, setActiveId] = useState(sections[0].id)

  // 모바일 URL바 노출 여부에 따라 위치가 흔들리는 문제 — viewport 최댓값을 추적해 CSS var로 고정
  useEffect(() => {
    let maxVh = window.innerHeight
    const setVh = (val: number) => {
      document.documentElement.style.setProperty("--stable-vh", `${val}px`)
    }
    setVh(maxVh)
    const onResize = () => {
      const cur = window.innerHeight
      if (cur > maxVh) {
        maxVh = cur
        setVh(maxVh)
      }
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, { passive: true })
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize)
    }
  }, [])

  useEffect(() => {
    const updateActive = () => {
      const triggerLine = window.innerHeight * 0.3
      let current = sections[0].id
      for (const { id } of sections) {
        const el = document.getElementById(id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.top <= triggerLine) {
          current = id
        }
      }
      setActiveId(current)
    }
    window.addEventListener("scroll", updateActive, { passive: true })
    window.addEventListener("resize", updateActive)
    const t1 = setTimeout(updateActive, 100)
    const t2 = setTimeout(updateActive, 500)
    return () => {
      window.removeEventListener("scroll", updateActive)
      window.removeEventListener("resize", updateActive)
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
