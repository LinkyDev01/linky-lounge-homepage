import styles from "./ScheduleSection.module.css"

const regularSessions = [
  { label: "1회차", thuDate: "5/21", sunDate: "5/24" },
  { label: "2회차", thuDate: "6/4",  sunDate: "6/7" },
  { label: "3회차", thuDate: "6/18", sunDate: "6/21" },
  { label: "4회차", thuDate: "7/2",  sunDate: "7/5" },
]

const THU_TIME = "19:30–22:30"
const SUN_TIME = "14:30–17:30"

export function ScheduleSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>모임 일정</h2>

      <div className={styles.grid}>
        {regularSessions.map((s) => (
          <div key={s.label} className={styles.card}>
            <span className={styles.label}>{s.label}</span>
            <p className={styles.row}>
              <span className={styles.rowDate}>{s.thuDate} (목)</span>
              <span className={styles.rowTime}>{THU_TIME}</span>
            </p>
            <p className={styles.row}>
              <span className={styles.rowDate}>{s.sunDate} (일)</span>
              <span className={styles.rowTime}>{SUN_TIME}</span>
            </p>
          </div>
        ))}

        <div className={styles.specialCard}>
          <a href="#gathering" className={styles.labelLink}>레이지선데이 미드나잇</a>
          <p className={styles.specialDate}>7/12 (일)</p>
          <p className={styles.row}>
            <span className={styles.rowDate}>1부</span>
            <span className={styles.rowTime}>17:30–20:30</span>
          </p>
          <p className={styles.row}>
            <span className={styles.rowDate}>2부</span>
            <span className={styles.rowTime}>20:30–22:30</span>
          </p>
        </div>
      </div>

      <p className={styles.note}>*같은 주차의 모임 중 자유롭게 참여 가능</p>
    </section>
  )
}
