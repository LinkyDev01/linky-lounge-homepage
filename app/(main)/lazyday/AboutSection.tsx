import styles from "./AboutSection.module.css"

export function AboutSection() {
  return (
    <section id="about" className={styles.section}>
      <h2 className={styles.sectionTitle}>이런 모임이에요</h2>

      <div className={styles.block}>
        <p className={styles.question}>어떤 대화가 오가나요?</p>
        <blockquote className={styles.quote}>
          <p>대부분의 독서모임은 잡담 위주이거나, 모임장 한 사람이 방향을 끌어가는 방식이에요.</p>
          <p>레이지데이에서는 열린 질문 하나로 각자의 이야기가 자연스럽게 나오고, 그 안에서 서로의 시각이 넓어집니다.</p>
          <p>모임장은 정답을 주는 사람이 아니라, 여러분의 생각이 잘 꺼내질 수 있도록 곁에서 돕는 역할이에요.</p>
        </blockquote>
      </div>

      <div className={styles.block}>
        <p className={styles.question}>어떤 사람과 함께하나요?</p>
        <blockquote className={styles.quote}>
          <p>자기개발도 좋지만, 문학·철학·예술을 통해 평소에 닿기 어려운 시각을 경험해보고 싶은 분들이 오세요.</p>
        </blockquote>
      </div>
    </section>
  )
}
