import styles from "./ScheduleSection.module.css"
import { SEASON } from "./season-config"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 일정·장소 — 6b+6c 조합 (운영자 확정 2026-07-06)
 * 프리뷰 쌍(ScheduleSectionV2)과 드리프트 금지 — 한쪽 수정 시 함께.
 *  · 일정 박스 = 6b 조판 괘선 (이중 괘선 풀블리드 + 명조 헤더, 테이프·기울기 없음)
 *  · 장소란 = 6c 손그림 유지 ("장소" → 곡선 화살표 → 펜 동그라미 "링키라운지")
 * 데이터는 전부 season-config 단일 출처.
 */
export function ScheduleSection() {
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
            {/* 6b: 박스 최상단 이중 괘선 — 좌우 풀블리드 */}
            <div className={styles.ruleThick} aria-hidden />
            <div className={styles.ruleThin} aria-hidden />
            <div className={styles.paperHead}>
              <p className={styles.paperTitle}>{SEASON.name} 일정</p>
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
              </tbody>
            </table>
            {/* 7b: 5회차 — 표 아래 점선 블록, 명조 전환이 '다른 결'의 핵심. 박스 밖으로 빼지 말 것 */}
            <div className={styles.fifthBlock}>
              <p className={styles.fifthTitle}><a href="#gathering" className={styles.fifthLink}>자유 독서모임</a></p>
              <p className={styles.fifthMeta}>{SEASON.fifth.label} · {SEASON.fifth.date} · {SEASON.fifth.timeLabel}</p>
            </div>
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
