import type { ReactNode } from "react"
import styles from "./FeatureBoxSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

const items: { label: ReactNode; paragraphs: ReactNode[] }[] = [
  {
    label: <><span className={styles.accent}>이런 분들</span>과 함께해요</>,
    paragraphs: [
      <>쉽게 공감되는 대화보다 <span className={styles.accent}>문학·철학·예술</span> 안에서 낯선 시각과 부딪히는 순간이 더 좋은 분. 그 <span className={styles.accent}>불협화음</span> 속에서 내 이야기가 더 또렷해진다고 느낀 적 있다면, 잘 맞을 거예요.</>,
    ],
  },
  {
    label: <><span className={styles.accent}>철학과 고전</span>을 함께 읽어요</>,
    paragraphs: [
      <>철학자들의 시선으로 <span className={styles.accent}>생각의 도구</span>를 먼저 갖추고, 고전 소설에서 <span className={styles.accent}>저자의 의도</span>를 함께 읽어가는 구조예요.</>,
      <>같은 부분을 읽더라도 더 <span className={styles.accent}>밀도 있는 대화</span>를 나눌 수 있는 이유입니다.</>,
    ],
  },
  {
    label: <><span className={styles.accent}>사유의 밀도</span>를 높일 질문을 던져요</>,
    paragraphs: [
      <><span className={styles.accent}>저자의 의도</span>를 통해 나의 이야기와 시선이 깊어질 수 있도록, 레이지데이가 질문을 준비하고, <span className={styles.accent}>전문 호스트</span>가 대화의 흐름 속 <span className={styles.accent}>사유의 밀도</span>를 높이는 방향으로 진행됩니다.</>,
    ],
  },
  {
    label: <>온전한 레이지데이를 위한 <span className={styles.accent}>30평 모임 공간</span></>,
    paragraphs: [
      <>외부 대관 없이 레이지데이가 직접 관리하는 약 30평 규모의 공간에서 진행해요.</>,
      <><span className={styles.accent}>대화에 온전히 집중할 수 있는 환경</span>입니다.</>,
    ],
  },
]

export function FeatureBoxSection() {
  return (
    <section id="feature" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>모임 소개</h2>
        </div>
        <div className={styles.list}>
          {items.map((item, i) => (
            <FadeUp key={i} delay={0.07 * i} className={styles.item}>
              <div className={styles.titleBox}>
                <span className={styles.label}>{item.label}</span>
              </div>
              <div className={styles.quote}>
                {item.paragraphs.map((p, j) => (
                  <p key={j} className={styles.desc}>{p}</p>
                ))}
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}
