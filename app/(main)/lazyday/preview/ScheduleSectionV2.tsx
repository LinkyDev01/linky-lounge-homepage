import styles from "./ScheduleSectionV2.module.css"
import { SEASON } from "../season-config"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 일정·장소 — '종이 낱장 + 손그림' (운영자 확정 스펙 2026-07-06)
 * 프리뷰 전용. 실사이트 이식은 별도 승인 대기 (DECISIONS.md).
 *  · 일정표를 테이프로 붙인 종이 낱장(살짝 기울임 + 노이즈 텍스처)으로
 *  · 박스 머리: "3기 일정" + 펜 밑줄 / 우측 기간(periodLabel)
 *  · 장소: "장소" → 손그림 화살표 → 펜 동그라미 친 "링키라운지"
 * 데이터는 전부 season-config 단일 출처.
 */
export function ScheduleSectionV2() {
  const fifthParts = SEASON.fifth.timeLabel.split(" · ")

  return (
    <section id="schedule" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>일정·장소</h2>
        </div>
      </FadeUp>

      <FadeUp>
        <div>
          <div className={styles.paperBox}>
            <span className={styles.tape} aria-hidden />
            <div className={styles.paperHead}>
              <div>
                <p className={styles.paperTitle}>{SEASON.name} 일정</p>
                <svg viewBox="0 0 60 6" aria-hidden className={styles.penUnderline}>
                  <path d="M2 4 C 12 1.5, 22 5.5, 32 3.5 S 52 2.5, 58 3.8" fill="none" stroke="#d2691e" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <span className={styles.paperPeriod}>{SEASON.periodLabel}</span>
            </div>
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
          </div>
          <p className={styles.scheduleNote}>*회차별 수·목·일 중 참여 요일 선택 가능</p>
        </div>
      </FadeUp>

      <FadeUp>
        <div className={styles.locationRow}>
          <span className={styles.locationLabel}>장소</span>
          <svg viewBox="0 0 34 18" aria-hidden className={styles.handArrow}>
            <path d="M2 4 C 9 11, 17 12.5, 27 9.5" fill="none" stroke="#8a6a50" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M22.5 5.8 L28.5 9.2 L24 13.8" fill="none" stroke="#8a6a50" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className={styles.locationInfo}>
            <span className={styles.locationNameWrap}>
              <span className={styles.locationName}>{SEASON.location.name}</span>
              <svg viewBox="0 0 92 32" aria-hidden className={styles.penCircle}>
                <ellipse cx="46" cy="16" rx="43" ry="12" fill="none" stroke="#d2691e" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="172 14" />
              </svg>
            </span>
            <span className={styles.locationSub}>{SEASON.location.sub}</span>
            <span className={styles.locationNote}>{SEASON.location.note}</span>
          </div>
        </div>
      </FadeUp>
    </section>
  )
}
