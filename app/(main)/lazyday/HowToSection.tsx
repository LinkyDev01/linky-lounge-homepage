import styles from "./HowToSection.module.css"
import { Bud, Bloom, SeedPod } from "@/components/illustrations/poppy"
import { FadeUp } from "@/components/animation/FadeUp"
import type { ComponentType, SVGAttributes } from "react"

type IllustrationProps = SVGAttributes<SVGElement> & { className?: string }

const steps: {
  label: string
  description: string
  Illustration: ComponentType<IllustrationProps>
}[] = [
  {
    label: "1부 — 레이지노트 펼치기",
    description:
      "레이지데이가 제시하는 주제를 바탕으로 대화를 시작합니다. 오늘의 대화에 앞서 곁에 앉은 멤버와 편안하게 생각을 주고받으며 각자의 이야기가 퍼집니다.",
    Illustration: Bud,
  },
  {
    label: "2부 — 서로의 페이지",
    description:
      "멤버들이 각자 가져온 문장이나 궁금증을 중심으로 이어갑니다. 책의 텍스트에서 시작된 이야기가 자연스럽게 우리의 실제 삶과 맞닿는 시간입니다.",
    Illustration: Bloom,
  },
  {
    label: "마무리",
    description:
      "오늘의 대화에서 우리의 생각을 조금 더 넓혀준 한 가지를 마음에 남기며 모임을 마무리합니다. 다음 모임에서 다룰 도서에 대한 짧은 예고도 함께 전해드립니다.",
    Illustration: SeedPod,
  },
]

export function HowToSection() {
  return (
    <section id="howto" className={styles.section}>
      <FadeUp>
        <h2 className={styles.sectionTitle}>진행 순서</h2>
      </FadeUp>
      <FadeUp delay={0.05}>
        <p className={styles.meta}>총 3시간 진행</p>
      </FadeUp>

      <div className={styles.timeline}>
        {steps.map(({ label, description, Illustration }, i) => (
          <FadeUp key={label} delay={i * 0.1} className={styles.step}>
            <Illustration className={styles.stepIcon} aria-hidden />
            <div className={styles.stepContent}>
              <span className={styles.stepLabel}>{label}</span>
              <p className={styles.stepDesc}>{description}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}
