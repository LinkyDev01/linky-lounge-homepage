import styles from "./ScheduleSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

const regularSessions = [
  { label: "1회차", wedDate: "7/22 (수)", thuDate: "7/23 (목)", sunDate: "7/26 (일)" },
  { label: "2회차", wedDate: "8/5 (수)",  thuDate: "8/6 (목)",  sunDate: "8/9 (일)" },
  { label: "3회차", wedDate: "8/19 (수)", thuDate: "8/20 (목)", sunDate: "8/23 (일)" },
  { label: "4회차", wedDate: "9/2 (수)",  thuDate: "9/3 (목)",  sunDate: "9/6 (일)" },
]

const WED_TIME = "19:30–22:30"
const THU_TIME = "19:30–22:30"
const SUN_TIME = "14:30–17:30"

export function ScheduleSection() {
  return (
    <section id="schedule" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>일정·장소</h2>
          <p className={styles.note}>*회차별 수·목·일 중<br />참여 요일 선택 가능</p>
        </div>
      </FadeUp>

      <div className={styles.list}>
        {regularSessions.map((s, i) => (
          <FadeUp key={s.label} delay={0.15 + i * 0.06}>
            <div className={styles.row}>
              <span className={styles.sessionLabel}>{s.label}</span>
              <div className={styles.dates}>
                <div className={styles.dateRow}>
                  <span className={styles.dateText}>{s.wedDate}</span>
                  <span className={styles.timeText}>{WED_TIME}</span>
                </div>
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
            <span className={styles.sessionLabel}>5회차</span>
            <div className={styles.dates}>
              <div className={styles.dateRow}>
                <span className={styles.dateText}>9/13 (일)</span>
              </div>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.48}>
          <div className={styles.locationRow}>
            <span className={styles.locationLabel}>장소</span>
            <div className={styles.locationInfo}>
              <span className={styles.locationName}>링키라운지</span>
              <span className={styles.locationSub}>사당역 10번 출구 도보 3분</span>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
