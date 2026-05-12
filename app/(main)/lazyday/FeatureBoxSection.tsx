"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import styles from "./FeatureBoxSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

const items: { label: ReactNode; desc: string }[] = [
  {
    label: <><span className={styles.accent}>철학과 고전</span>을 함께 읽어요</>,
    desc: "철학자들의 시선으로 생각의 도구를 먼저 갖추고, 고전 소설에서 저자의 의도를 함께 읽어가는 구조예요. 같은 부분을 읽더라도 더 밀도 있는 대화를 나눌 수 있는 이유입니다.",
  },
  {
    label: <>직접 운영하는 <span className={styles.accent}>전용 라운지</span></>,
    desc: "외부 대관 없이 레이지데이가 직접 관리하는 약 30평 규모의 공간에서 진행해요. 대화에 온전히 집중할 수 있는 환경입니다.",
  },
]

export function FeatureBoxSection() {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <section className={styles.section}>
      <div className={styles.list}>
        {items.map((item, i) => {
          const isOpen = openSet.has(i)
          return (
            <FadeUp key={i} delay={0.08 * i}>
              <div className={styles.card}>
                <button
                  className={styles.cardHeader}
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.cardTitle}>{item.label}</span>
                  <span className={isOpen ? `${styles.arrow} ${styles.arrowOpen}` : styles.arrow}>▾</span>
                </button>
                <div className={isOpen ? `${styles.peekWrap} ${styles.peekOpen}` : styles.peekWrap}>
                  <p className={styles.desc}>{item.desc}</p>
                  {!isOpen && <div className={styles.peekFade} />}
                </div>
              </div>
            </FadeUp>
          )
        })}
      </div>
    </section>
  )
}
