import styles from "./ScheduleSection.module.css"

const sessions = [
  {
    label: "1회차",
    rows: ["5/21 (목) 19:30–22:30", "5/24 (일) 14:30–17:30"],
  },
  {
    label: "2회차",
    rows: ["6/4 (목) 19:30–22:30", "6/7 (일) 14:30–17:30"],
  },
  {
    label: "3회차",
    rows: ["6/18 (목) 19:30–22:30", "6/21 (일) 14:30–17:30"],
  },
  {
    label: "4회차",
    rows: ["7/2 (목) 19:30–22:30", "7/5 (일) 14:30–17:30"],
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
            {s.rows.map((row) => (
              <p key={row} className={styles.row}>{row}</p>
            ))}
          </div>
        ))}
      </div>

      <p className={styles.note}>*같은 주차의 모임 중 자유롭게 참여 가능</p>
    </section>
  )
}
