import styles from "./HowToSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"


const steps: {
  label: string
  description: string
}[] = [
  {
    label: "1부 — 레이지노트 펼치기",
    description:
      "레이지데이가 제시하는 주제를 바탕으로 대화를 시작합니다. 오늘의 대화에 앞서 곁에 앉은 멤버와 편안하게 생각을 주고받으며 각자의 이야기가 퍼집니다.",
  },
  {
    label: "2부 — 서로의 페이지",
    description:
      "멤버들이 각자 가져온 문장이나 궁금증을 중심으로 이어갑니다. 책의 텍스트에서 시작된 이야기가 자연스럽게 우리의 실제 삶과 맞닿는 시간입니다.",
  },
  {
    label: "마무리",
    description:
      "오늘의 대화에서 우리의 생각을 조금 더 넓혀준 한 가지를 마음에 남기며 모임을 마무리합니다. 다음 모임에서 다룰 도서에 대한 짧은 예고도 함께 전해드립니다.",
  },
]

export function HowToSection() {
  return (
    <section id="howto" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
<div className={styles.titleGroup}>
            <h2 className={styles.sectionTitle}>진행 순서</h2>
            <p className={styles.meta}>총 <span className={styles.accent}>3시간</span> 진행</p>
          </div>
        </div>
      </FadeUp>

      <div className={styles.timeline}>
        {steps.map(({ label, description }, i) => (
          <FadeUp key={label} delay={0.1 + i * 0.1} className={styles.step}>
            <span className={styles.stepNumber}>{String(i + 1).padStart(2, "0")}</span>
            <div className={styles.stepContent}>
              <h3 className={styles.stepLabel}>{label}</h3>
              <p className={styles.stepDesc}>{description}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}
