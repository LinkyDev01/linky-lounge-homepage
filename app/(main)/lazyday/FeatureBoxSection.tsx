"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import styles from "./FeatureBoxSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

const items: { label: ReactNode; paragraphs: ReactNode[]; note?: string }[] = [
  {
    label: <><span className={styles.accent}>이런 분들</span>과 함께해요</>,
    paragraphs: [
      <>쉽게 공감되는 대화보다 <span className={styles.accent}>문학·철학·예술</span> 안에서 낯선 시각과 부딪히는 순간이 더 좋은 멤버들과 함께해요. 무색무취한 이야기에 고개만 끄덕이는 자리가 아니라, 각자의 결이 다른 곳에서 부딪히는 자리예요.</>,
      <>비슷한 결을 가졌다고 같은 결론에 도달할 필요는 없거든요. 같은 문장 앞에서 멈춰도, 거기서 이어지는 생각은 각자 다르잖아요? 그 <span className={styles.accent}>불협화음</span> 속에서 내 이야기가 더 또렷해져요.</>,
      <>그래서 모든 멤버가 참가 전, <span className={styles.accent}>인터뷰</span>를 통해 서로의 결을 확인하고 있어요. 모임이 궁금하다면, 인터뷰를 통해 대화의 결이 맞는지 확인해보세요.</>,
    ],
  },
  {
    label: <><span className={styles.accent}>철학과 고전</span>을 함께 읽어요</>,
    paragraphs: [
      <>기수별 책 구성은 철학서와 고전 소설을 함께 읽는 구조로 진행해요. 철학자들의 시선으로 내 생각을 꺼내줄 '<span className={styles.accent}>생각의 도구</span>' 갖추며, 확장된 시선 속에서 고전 속 <span className={styles.accent}>저자의 의도</span>를 들여다봐요.</>,
      <>도구를 갖추고 다시 들여다 보면, 똑같은 문장이 때론 전혀 다른 무게로 다가옵니다. 같은 고전을 읽더라도 더 <span className={styles.accent}>밀도 있는 대화</span>가 가능한 이유입니다.</>,
    ],
  },
  {
    label: <><span className={styles.accent}>사유의 밀도</span>를 높일 질문을 던져요</>,
    paragraphs: [
      <>단순히 독후감을 나누는 자리가 아니에요. 레이지데이가 사전에 준비한 질문으로 대화가 시작되고, <span className={styles.accent}>전문 호스트</span>가 그 흐름 속에서{" "}<span className={styles.accent}>사유의 밀도</span>를 높이는 방향으로 이끌어요.</>,
      <>'이 부분에서 <span className={styles.accent}>저자의 의도</span>는 뭘까'에서 출발해, '그게 각자의 어떤 이야기와 닿아 있는가'로 이어지는 구조예요. 질문은 답을 위한 게 아니라, 각자의 결이 묻어 나올 수 있도록 돕는 역할을 합니다.</>,
    ],
  },
  {
    label: <><span className={styles.accent}>30평 공간</span>에서 모여요</>,
    paragraphs: [
      <>외부 대관 없이 레이지데이가 직접 운영하는 약 30평 규모의 링키라운지에서 진행해요. <span className={styles.accent}>사당역 10번 출구</span>에서 4분 거리예요.</>,
      <>낯선 공간의 어색함 없이{" "}<span className={styles.accent}>대화에 온전히 집중할 수 있는 환경</span>이에요. 다과도 함께 준비되고, 느긋하게 생각이 무르익을 수 있는 공간에서 진행합니다.</>,
    ],
    note: "*상황에 따라 장소가 변경될 수 있습니다",
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
    <section id="feature" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>모임 소개</h2>
        </div>
        <div className={styles.list}>
          {items.map((item, i) => {
            const isOpen = openSet.has(i)
            return (
              <FadeUp key={i} delay={0.07 * i} className={styles.item}>
                <button
                  type="button"
                  className={styles.titleBox}
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.label}>{item.label}</span>
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
                  <div className={`${styles.peekWrap} ${isOpen ? styles.peekOpen : ""}`}>
                    {item.paragraphs.map((p, j) => (
                      <p key={j} className={styles.desc}>{p}</p>
                    ))}
                    {!isOpen && (
                      <div className={styles.fadeWrap}>
                        <div className={styles.fadeBg} />
                      </div>
                    )}
                  </div>
                  {!isOpen && <span className={styles.moreHint}>...더보기</span>}
                  {isOpen && item.note && <p className={styles.note}>{item.note}</p>}
                </div>
              </FadeUp>
            )
          })}
        </div>
      </div>
    </section>
  )
}
