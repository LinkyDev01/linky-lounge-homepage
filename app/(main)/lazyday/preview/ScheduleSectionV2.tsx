import styles from "./ScheduleSectionV2.module.css"
import { SEASON } from "../season-config"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 일정·장소 — 콰이어트 리스트 (운영자 지시 2026-07-06)
 * 원본(ScheduleSection)의 좌정렬 구조·데이터 소스(season-config.ts)는 유지,
 * 흰 라운딩 박스(.scheduleBox)를 제거해 섹션 배경 위에 테이블을 직접 얹고,
 * 강조색(주황)을 무채 톤으로 낮춘다. 5회차 행은 날짜를 1~4회차와 동일한
 * 크기로 키우고, 시간 표기(1부/2부)를 그 옆에 작은 2행으로 배열한다.
 * 실사이트(ScheduleSection)는 V2 없이 프리뷰가 직접 import하는 구조라
 * 원본 파일은 수정하지 않는다 — 이 파일이 프리뷰 전용 신설 컴포넌트.
 */
export function ScheduleSectionV2() {
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
