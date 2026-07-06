import styles from "./ScheduleSection.module.css"
import { SEASON } from "./season-config"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 일정·장소 — 콰이어트 리스트 (운영자 확정 2026-07-06)
 * 원본: preview/ScheduleSectionV2.tsx (프리뷰 승인본을 픽셀 동일 이식).
 * 흰 라운딩 박스 제거 → 섹션 배경 위 테이블 직접, 강조색은 무채 톤.
 * 데이터는 season-config.ts 단일 출처 유지.
 * 프리뷰 쌍(ScheduleSectionV2)과 드리프트 금지 — 한쪽 수정 시 함께.
 */
export function ScheduleSection() {
  const fifthParts = SEASON.fifth.timeLabel.split(" · ")

  return (
    <section id="schedule" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>일정·장소</h2>
          <p className={styles.note}>*회차별 수·목·일 중<br />참여 요일 선택 가능</p>
        </div>
      </FadeUp>

      <FadeUp>
        <div className={styles.scheduleWrap}>
          <p className={styles.scheduleHeader}>{SEASON.name} 일정</p>
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
                  <div className={styles.fifthRow}>
                    <span className={styles.fifthDate}>{SEASON.fifth.date}</span>
                    <div className={styles.fifthParts}>
                      {fifthParts.map((part, i) => (
                        <span key={i} className={styles.fifthPart}>{part}</span>
                      ))}
                    </div>
                  </div>
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
