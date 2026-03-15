import { currentSeasonConfig } from "./book-config"
import styles from "./ScheduleSection.module.css"

export function ScheduleSection() {
  const { schedules, scheduleNote } = currentSeasonConfig

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>모임 일정</h2>
      <div className={styles.cards}>
        {schedules.map((s) => (
          <div key={s.name} className={styles.card}>
            <p className={styles.name}>{s.name}</p>
            <p className={styles.time}>{s.time}</p>
            <p className={styles.dates}>{s.dates}</p>
          </div>
        ))}
      </div>
      <p className={styles.note}>{scheduleNote}</p>
    </section>
  )
}
