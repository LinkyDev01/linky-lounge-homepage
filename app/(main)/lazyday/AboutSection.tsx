import styles from "./AboutSection.module.css"

export function AboutSection() {
  return (
    <section id="about" className={styles.section}>
      <h2 className={styles.blockTitle}>레이지데이 북클럽은</h2>
      <p className={styles.lead}>복잡함 속에서 찾는 단순함.</p>
      <p className={styles.paragraph}>일상을 더 복잡하게 만드는 질문들은 앞세우지 않으려고 해요.</p>
      <p className={styles.paragraph}>
        중요한 건 딱 두 가지입니다. 이 책의 진짜 의도가 무엇인지, 그리고 거기서 내 이야기가 나올 수 있는지. 백 번의 독서모임을 하며 결국 제게 남은 질문도 이것뿐이었거든요.
      </p>
      <p className={styles.paragraph}>
        결국 이곳에 남는 건 책의 지식이 아니라 당신의 이야기, 그리고 당신만의 방향입니다.
      </p>
    </section>
  )
}
