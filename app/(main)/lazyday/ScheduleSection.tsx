import styles from "./ScheduleSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"
import { ScheduleMark } from "@/components/illustrations/bauhaus"

const regularSessions = [
  { label: "1회차", thuDate: "5/21 (목)", sunDate: "5/24 (일)" },
  { label: "2회차", thuDate: "6/4 (목)",  sunDate: "6/7 (일)" },
  { label: "3회차", thuDate: "6/18 (목)", sunDate: "6/21 (일)" },
  { label: "4회차", thuDate: "7/2 (목)",  sunDate: "7/5 (일)" },
]

const THU_TIME = "19:30–22:30"
const SUN_TIME = "14:30–17:30"

export function ScheduleSection() {
  return (
    <section id="schedule" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
          <div className={styles.titleGroup}>
            <h2 className={styles.sectionTitle}>모임 일정 <span className={styles.titleSub}>(격주)</span></h2>
            <p className={styles.note}>*회차별 목·일 중 참여 요일 선택 가능</p>
          </div>
          <ScheduleMark className={styles.mark} />
        </div>
      </FadeUp>

      <div className={styles.list}>
        {regularSessions.map((s, i) => (
          <FadeUp key={s.label} delay={0.15 + i * 0.06}>
            <div className={styles.row}>
              <span className={styles.sessionLabel}>{s.label}</span>
              <div className={styles.dates}>
                <div className={styles.dateRow}>
                  <span className={styles.dateText}>{s.thuDate}</span>
                  <span className={styles.timeText}>{THU_TIME}</span>
                </div>
                <div className={styles.dateRow}>
                  <span className={styles.dateText}>{s.sunDate}</span>
                  <span className={styles.timeText}>{SUN_TIME}</span>
                </div>
              </div>
            </div>
          </FadeUp>
        ))}

        <FadeUp delay={0.4}>
          <div className={styles.row}>
            <span className={styles.sessionLabel}>파티</span>
            <div className={styles.dates}>
              <a href="#gathering" className={styles.specialName}>레이지선데이 미드나잇</a>
              <div className={styles.dateRow}>
                <span className={styles.dateText}>7/12 (일)</span>
                <span className={styles.timeText}>1부 17:30–20:30 · 2부 20:30–22:30</span>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
