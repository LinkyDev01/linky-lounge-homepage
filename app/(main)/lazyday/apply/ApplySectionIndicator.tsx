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

  // 활성 섹션 추적 — DOM 순서대로 viewport 30% 라인을 넘은 마지막 섹션
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
