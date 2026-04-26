import styles from "./ScheduleSection.module.css"

const sessions = ["1회차", "2회차", "3회차", "4회차"]

const rows = [
  { name: "목요일 저녁", time: "19:30 – 22:30", dates: ["5/21", "6/4", "6/18", "7/2"] },
  { name: "일요일 오후", time: "14:30 – 17:30", dates: ["5/24", "6/7", "6/21", "7/5"] },
]

export function ScheduleSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>모임 일정</h2>

      <div className={styles.grid}>
        <div className={styles.cornerCell} />
        {sessions.map((s) => (
          <div key={s} className={styles.sessionHeader}>{s}</div>
        ))}

        {rows.map((row) => (
          <>
            <div key={`header-${row.name}`} className={styles.rowHeader}>
              <span className={styles.rowName}>{row.name}</span>
              <span className={styles.rowTime}>{row.time}</span>
            </div>
            {row.dates.map((date, i) => (
              <div key={`${row.name}-${i}`} className={styles.dateCell}>{date}</div>
            ))}
          </>
        ))}
      </div>

      <p className={styles.note}>*같은 주차의 모임 중 자유롭게 참여 가능</p>
    </section>
  )
}
