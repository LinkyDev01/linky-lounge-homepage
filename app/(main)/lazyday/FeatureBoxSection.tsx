import styles from "./FeatureBoxSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

const items = [
  {
    label: "철학과 고전",
    desc: "철학자들의 시선과 이론으로 생각의 도구를 먼저 갖추고, 고전 소설 속 저자의 의도를 들여다보며 나의 이야기를 깊이 들여다보는 구조예요.",
  },
  {
    label: "열린 질문",
    desc: "모임장은 정답을 주는 사람이 아니에요. 사고의 확장과 사유의 마찰을 돕는 질문을 던지며, 각자의 목소리가 자연스럽게 꺼내질 수 있도록 곁에서 조율합니다.",
  },
  {
    label: "전용 라운지",
    desc: "외부 대관 없이 레이지데이가 직접 관리하는 약 30평 규모의 공간에서 진행해요. 대화에 온전히 집중할 수 있는 환경입니다.",
  },
  {
    label: "함께하는\n사람들",
    desc: "자기개발도 좋지만, 문학·철학·예술을 통해 평소에 닿기 어려운 시각을 경험해보고 싶은 분들이 오세요.",
  },
]

export function FeatureBoxSection() {
  return (
    <section className={styles.section}>
      <div className={styles.list}>
        {items.map((item, i) => (
          <FadeUp key={item.label} delay={0.08 * i}>
            <div className={styles.box}>
              <p className={styles.label}>{item.label}</p>
              <p className={styles.desc}>{item.desc}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}
