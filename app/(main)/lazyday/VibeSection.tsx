import styles from './VibeSection.module.css'

const items = [
  {
    question: '어떤 대화가 오갈까',
    paragraphs: [
      '대부분의 독서모임은 잡담 위주이거나, 모임장 한 사람이 방향을 끌어가는 방식이에요.',
      '레이지데이에서는 열린 질문 하나로 각자의 이야기가 자연스럽게 나오고, 그 안에서 서로의 시각이 넓어집니다.',
      '모임장은 정답을 주는 사람이 아니라, 여러분의 생각이 잘 꺼내질 수 있도록 곁에서 돕는 역할이에요.',
    ],
  },
  {
    question: '어떤 사람이 모일까',
    paragraphs: [
      '자기개발도 좋지만, 문학·철학·예술을 통해 평소에 닿기 어려운 시각을 경험해보고 싶은 분들이 오세요.',
    ],
  },
]

export function VibeSection() {
  return (
    <section id="vibe" className={styles.section}>
      <h2 className={styles.sectionTitle}>이런 모임이에요</h2>
      <div className={styles.list}>
        {items.map((item) => (
          <div key={item.question} className={styles.item}>
            <h3 className={styles.question}>{item.question}</h3>
            {item.paragraphs.map((p, i) => (
              <p key={i} className={styles.paragraph}>{p}</p>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
