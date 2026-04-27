import styles from "./AboutSection.module.css"

export function AboutSection() {
  return (
    <section id="about" className={styles.section}>
      <p className={styles.lead}>복잡함 속에서 찾는 단순함.</p>
      <p className={styles.body}>일상을 더 복잡하게 만드는 질문들은 앞세우지 않으려고 해요.</p>
      <p className={styles.body}>
        중요한 건 딱 두 가지입니다.<br />
        이 책의 진짜 의도가 무엇인지,<br />
        그리고 거기서 내 이야기가 나올 수 있는지.
      </p>
      <p className={styles.body}>
        백 번의 독서모임을 하며<br />
        결국 제게 남은 질문도 이것뿐이었거든요.
      </p>
      <p className={styles.body}>
        결국 이곳에 남는 건 책의 지식이 아니라<br />
        당신의 이야기, 그리고 당신만의 방향입니다.
      </p>
    </section>
  )
}
