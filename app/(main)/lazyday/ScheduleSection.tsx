import styles from "./ScheduleSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

const sessions = [
  { label: "1회차", wed: "7/15", thu: "7/16", sun: "7/19" },
  { label: "2회차", wed: "7/29", thu: "7/30", sun: "8/2"  },
  { label: "3회차", wed: "8/12", thu: "8/13", sun: "8/16" },
  { label: "4회차", wed: "8/26", thu: "8/27", sun: "8/30" },
]

export function ScheduleSection() {
  return (
    <section id="schedule" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>일정·장소</h2>
          <p className={styles.note}>*회차별 수·목·일 중<br />참여 요일 선택 가능</p>
        </div>
      </FadeUp>

      <FadeUp>
        <div className={styles.scheduleBox}>
          <p className={styles.scheduleBoxHeader}>3기 일정</p>
          <table className={styles.scheduleTable}>
            <thead>
              <tr>
                <th className={styles.schThEmpty} />
                <th className={styles.schThDay}>
                  수요일<br />
                  <span className={styles.schThTime}>19:30–22:30</span>
                </th>
                <th className={styles.schThDay}>
                  목요일<br />
                  <span className={styles.schThTime}>19:30–22:30</span>
                </th>
                <th className={styles.schThDay}>
                  일요일<br />
                  <span className={styles.schThTime}>14:30–17:30</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.label}>
                  <td className={styles.schTdLabel}>{s.label}</td>
                  <td className={styles.schTdDate}>{s.wed}</td>
                  <td className={styles.schTdDate}>{s.thu}</td>
                  <td className={styles.schTdDate}>{s.sun}</td>
                </tr>
              ))}
              <tr>
                <td className={styles.schTdLabel}>5회차</td>
                <td colSpan={3} className={styles.schTdFifth}>
                  9/6 (일)<br />
                  <span className={styles.schThTime}>1부 14:30–17:00 · 2부 17:00–</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p className={styles.scheduleNote}>*회차별 수·목·일 중 참여 요일 선택 가능</p>
        </div>
      </FadeUp>

      <FadeUp>
        <div className={styles.locationRow}>
          <span className={styles.locationLabel}>장소</span>
          <div className={styles.locationInfo}>
            <span className={styles.locationName}>링키라운지</span>
            <span className={styles.locationSub}>사당역 10번 출구 도보 3분</span>
            <span className={styles.locationNote}>*상황에 따라 장소가 변경될 수 있습니다.</span>
          </div>
        </div>
      </FadeUp>
    </section>
  )
}
