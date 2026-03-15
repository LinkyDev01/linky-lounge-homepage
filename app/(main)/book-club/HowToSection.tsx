import styles from "./HowToSection.module.css"

const steps = [
  {
    label: "오프닝",
    duration: "15분",
    description:
      "가벼운 자기소개와 함께 이번 책에서 가장 깊게 머물렀던 문장 하나를 공유합니다. 잘 정리된 발표가 아니어도 괜찮습니다. 그저 문장을 꺼내놓는 것부터 시작합니다.",
  },
  {
    label: "1부 — 모임장 발제",
    duration: null, // "60분~90분" 처럼 대략적인 시간을 표기해주는 것도 신뢰감을 줍니다.
    description:
      "모임장이 제시하는 주제를 바탕으로 대화를 시작합니다. 전체 토론에 앞서 곁에 앉은 멤버와 편안하게 생각을 주고받으며 대화의 온도를 높입니다.",
  },
  {
    label: "2부 — 멤버 발제",
    duration: null,
    description:
      "멤버들이 각자 가져온 문장이나 궁금증을 중심으로 이어갑니다. 책의 텍스트에서 시작된 이야기가 자연스럽게 우리의 실제 삶과 맞닿는 시간입니다.",
  },
  {
    label: "마무리",
    duration: "15분",
    description:
      "오늘의 대화 중 가장 기억에 남는 한 문장을 간직하며 모임을 정리합니다. 다음 모임에서 다룰 도서에 대한 짧은 예고도 함께 전해드립니다.",
  },
]

export function HowToSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>LazyDay의 타임라인</h2>
      <p className={styles.intro}>한 번의 모임은 <span className={styles.accent}>3시간</span>동안 진행돼요.</p>

      <div className={styles.steps}>
        {steps.map((step) => (
          <div key={step.label} className={styles.step}>
            <div className={styles.stepHeader}>
              <span className={styles.stepLabel}>{step.label}</span>
              {step.duration && (
                <span className={styles.stepDuration}>{step.duration}</span>
              )}
            </div>
            <p className={styles.stepDesc}>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
