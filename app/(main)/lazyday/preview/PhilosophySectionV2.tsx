"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { FadeUp } from "@/components/animation/FadeUp"
import styles from "./PhilosophySectionV2.module.css"
import {
  GYEOL_TITLE,
  GYEOL_PARAGRAPHS,
  DISSONANCE_TITLE,
  DISSONANCE_PARAGRAPHS,
} from "../philosophy-content"

/**
 * 랜딩 철학 섹션 — 인터뷰 예약 페이지 하단에만 있던 '결'·'불균형의 균형'
 * 브랜드 원고를 랜딩에도 노출 (UX 재검토 권고 반영, 2026-07-03).
 * 접힘 상호작용은 모임 소개(FeatureBoxSectionV2)와 동일: 첫 문단은 온전히
 * 보이고, 페이드 + ...더보기로 나머지를 접는다. 원고는 philosophy-content 단일 출처.
 */
const BLOCKS = [
  { title: GYEOL_TITLE, paragraphs: GYEOL_PARAGRAPHS },
  { title: DISSONANCE_TITLE, paragraphs: DISSONANCE_PARAGRAPHS },
]

const PEEK_SLIVER = 34

export function PhilosophySectionV2() {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set())
  const firstPRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const [peekHeights, setPeekHeights] = useState<number[]>([])

  useLayoutEffect(() => {
    const measure = () => {
      setPeekHeights(firstPRefs.current.map(p => (p ? p.offsetHeight + PEEK_SLIVER : 0)))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  const toggle = (i: number) => {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <section id="gyeol" className={styles.section}>
      <div className={styles.inner}>
        <FadeUp>
          <div className={styles.titleRow}>
            <h2 className={styles.sectionTitle}>우리가 믿는 것</h2>
          </div>
          <p className={styles.sectionLead}>
            레이지데이가 &lsquo;결&rsquo;이라 부르는 것, 그리고 서로 다른 결이 부딪혀 이루는 균형에 대하여.
          </p>
        </FadeUp>
        <div className={styles.list}>
          {BLOCKS.map((b, i) => {
            const isOpen = openSet.has(i)
            return (
              <div key={i} className={styles.item}>
                <button
                  type="button"
                  className={styles.titleBox}
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.label}>{b.title}</span>
                  <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}>▾</span>
                </button>
                <div
                  className={styles.quote}
                  onClick={() => toggle(i)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onKeyDown={e => e.key === "Enter" && toggle(i)}
                  style={{ cursor: isOpen ? "default" : "pointer" }}
                >
                  <div
                    className={`${styles.peekWrap} ${isOpen ? styles.peekOpen : ""}`}
                    style={!isOpen && peekHeights[i] ? { maxHeight: peekHeights[i] } : undefined}
                  >
                    {b.paragraphs.map((p, j) => (
                      <p
                        key={j}
                        className={styles.desc}
                        ref={j === 0 ? el => { firstPRefs.current[i] = el } : undefined}
                      >
                        {p}
                      </p>
                    ))}
                    {!isOpen && (
                      <div className={styles.fadeWrap}>
                        <div className={styles.fadeBg} />
                      </div>
                    )}
                  </div>
                  {!isOpen && <span className={styles.moreHint}>...더보기</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
