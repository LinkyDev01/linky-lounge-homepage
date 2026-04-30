import type { ReactNode } from "react"
import styles from './VibeSection.module.css'
import { FadeUp } from "@/components/animation/FadeUp"


const items: {
  question: ReactNode
  key: string
  paragraphs: string[]
}[] = [
  {
    key: '어떤 대화',
    question: <>모임에선 <span className={styles.accent}>어떤 대화</span>가 오가나요?</>,
    paragraphs: [
      '대부분의 독서모임은 잡담 위주이거나, 모임장의 일방적인 생각을 바탕으로 방향을 끌어가는 방식이에요.',
      '하지만, 레이지데이에서는 열린 질문을 통해 서로의 이야기를 꺼내며 각자의 시각이 넓어집니다.',
      '함께하는 모임장은 정답을 주는 사람이 아니라, 여러분의 생각과 목소리가 꺼내질 수 있도록 곁에서 돕기 때문이에요.',
    ],
  },
  {
    key: '어떤 사람',
    question: <><span className={styles.accent}>어떤 사람</span>과 함께하고 있나요?</>,
    paragraphs: [
      '자기개발도 좋지만, 문학·철학·예술을 통해 평소에 닿기 어려운 시각을 경험해보고 싶은 분들이 오세요.',
    ],
  },
]

export function VibeSection() {
  return (
    <section id="vibe" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
<h2 className={styles.sectionTitle}>레이지데이의 <span className={styles.accent}>결</span></h2>
        </div>
      </FadeUp>
      <div className={styles.list}>
        {items.map(({ key, question, paragraphs }, i) => (
          <FadeUp key={key} delay={0.1 + i * 0.1} className={styles.block}>
            <p className={styles.question}>{question}</p>
            <div className={styles.quote}>
              {paragraphs.map((p, j) => (
                <p key={j} className={styles.paragraph}>{p}</p>
              ))}
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}
