import styles from "./ScheduleSection.module.css"

const sessions = [
  {
    label: "1회차",
    thu: { date: "5/21", time: "19:30 – 22:30" },
    sun: { date: "5/24", time: "14:30 – 17:30" },
  },
  {
    label: "2회차",
    thu: { date: "6/4", time: "19:30 – 22:30" },
    sun: { date: "6/7", time: "14:30 – 17:30" },
  },
  {
    label: "3회차",
    thu: { date: "6/18", time: "19:30 – 22:30" },
    sun: { date: "6/21", time: "14:30 – 17:30" },
  },
  {
    label: "4회차",
    thu: { date: "7/2", time: "19:30 – 22:30" },
    sun: { date: "7/5", time: "14:30 – 17:30" },
  },
]

export function ScheduleSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>모임 일정</h2>

      <div className={styles.timeline}>
        {sessions.map((s) => (
          <div key={s.label} className={styles.item}>
            <span className={styles.label}>{s.label}</span>
            <p className={styles.row}>
              <span className={styles.day}>목</span>
              <span className={styles.date}>{s.thu.date}</span>
              <span className={styles.time}>{s.thu.time}</span>
            </p>
            <p className={styles.row}>
              <span className={styles.day}>일</span>
              <span className={styles.date}>{s.sun.date}</span>
              <span className={styles.time}>{s.sun.time}</span>
            </p>
          </div>
        ))}
      </div>

      <p className={styles.note}>*같은 주차의 모임 중 자유롭게 참여 가능</p>
    </section>
  )
}
