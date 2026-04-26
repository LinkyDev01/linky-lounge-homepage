import styles from "./RulesSection.module.css"

const rules = [
  <>이야기가 끊기지 않도록 <span className={styles.accent}>마지막 문장까지</span> 충분히 들어주세요.</>,
  <>정답을 찾는 자리가 아니기에, 상대의 의견을 <span className={styles.accent}>있는 그대로 존중</span>합니다.</>,
  <>대화의 흐름 속에서 궁금함이 생기면 <span className={styles.accent}>자유롭게 질문</span>을 던져주세요.</>,
]

export function RulesSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>레이지데이에서는</h2>
      <p className={styles.intro}>대화를 더 깊게 만드는 세 가지를 지켜요.</p>

      <ol className={styles.list}>
        {rules.map((rule, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.number}>{i + 1}</span>
            <span className={styles.text}>{rule}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
