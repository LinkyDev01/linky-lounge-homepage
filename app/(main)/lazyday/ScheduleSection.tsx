import styles from "./ScheduleSection.module.css"
import { SEASON } from "./season-config"
import { FadeUp } from "@/components/animation/FadeUp"

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
          <p className={styles.scheduleBoxHeader}>{SEASON.name} 일정</p>
          <table className={styles.scheduleTable}>
            <thead>
              <tr>
                <th className={styles.schThEmpty} />
                {SEASON.days.map((d) => (
                  <th key={d.label} className={styles.schThDay}>
                    {d.label}<br />
                    <span className={styles.schThTime}>{d.time}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEASON.sessions.map((s) => (
                <tr key={s.label}>
                  <td className={styles.schTdLabel}>{s.label}</td>
                  {s.dates.map((date, i) => (
                    <td key={i} className={styles.schTdDate}>{date}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className={styles.schTdLabel}>{SEASON.fifth.label}</td>
                <td colSpan={SEASON.days.length} className={styles.schTdFifth}>
                  {SEASON.fifth.date}<br />
                  <span className={styles.schThTime}>{SEASON.fifth.timeLabel}</span>
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
            <span className={styles.locationName}>{SEASON.location.name}</span>
            <span className={styles.locationSub}>{SEASON.location.sub}</span>
            <span className={styles.locationNote}>{SEASON.location.note}</span>
          </div>
        </div>
      </FadeUp>
    </section>
  )
}
