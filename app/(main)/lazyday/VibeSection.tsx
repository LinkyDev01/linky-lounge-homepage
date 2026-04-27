import styles from './VibeSection.module.css'

const items = [
  {
    question: '어떤 대화가 오갈까',
    paragraphs: [
      '일반적으로 친목만을 위한 잡담 위주의 분위기로 흘러가거나 모임장의 일방적인 생각을 바탕으로 이끌어가는 독서 모임이 대다수입니다.',
      '하지만 저희 모임에서는 열린 질문을 통해 서로의 이야기를 꺼내며 각자의 시각이 확장됩니다.',
      '함께하는 모임장은 정답을 내려주는 존재가 아닌, 멤버들의 생각과 목소리를 꺼내주는 존재이기 때문입니다.',
    ],
  },
  {
    question: '어떤 사람이 모일까',
    paragraphs: [
      '참가하는 멤버들은 주로 성장과 자기개발도 좋지만, 문학·철학·예술을 통해 평소엔 닿을 수 없던 시각을 엿보고 싶어 하는 분들입니다.',
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
