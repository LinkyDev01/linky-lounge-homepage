import styles from "./FeatureBoxSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

const items = [
  {
    label: <><span className={styles.accent}>철학과 고전</span>을 함께 읽어요</>,
    paragraphs: [
      "철학자들의 시선으로 생각의 도구를 먼저 갖추고, 고전 소설에서 저자의 의도를 함께 읽어가는 구조예요.",
      "같은 부분을 읽더라도 더 밀도 있는 대화를 나눌 수 있는 이유입니다.",
    ],
  },
  {
    label: <><span className={styles.accent}>사유의 밀도</span>를 높일 질문을 던져요</>,
    paragraphs: [
      "레이지데이 북클럽의 모임장은 정답을 주는 사람이 아니에요. 사고의 확장을 돕는 질문을 던지며, 각자의 목소리가 자연스럽게 꺼내질 수 있도록 곁에서 조율합니다.",
    ],
  },
  {
    label: <>온전한 레이지데이를 위한 <span className={styles.accent}>30평 모임 공간</span></>,
    paragraphs: [
      "외부 대관 없이 레이지데이가 직접 관리하는 약 30평 규모의 공간에서 진행해요.",
      "대화에 온전히 집중할 수 있는 환경입니다.",
    ],
  },
  {
    label: <><span className={styles.accent}>어떤 사람들</span>과 함께하나요?</>,
    paragraphs: [
      "자기개발도 좋지만, 문학·철학·예술을 통해 평소에 닿기 어려운 시각을 경험해보고 싶은 분들이 오세요.",
    ],
  },
]

export function FeatureBoxSection() {
  return (
    <section className={styles.section}>
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
    </section>
  )
}
