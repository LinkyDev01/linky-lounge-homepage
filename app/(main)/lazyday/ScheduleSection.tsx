"use client"

import { Nanum_Pen_Script } from "next/font/google"
import styles from "./ScheduleSection.module.css"
import { SEASON, calendarData } from "./season-config"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 일정·장소 — "벽에 붙인 월별 달력 석 장" (14a 시안, 운영자 확정 2026-07-24)
 * 프리뷰 쌍(ScheduleSectionV2)과 드리프트 금지 — 한쪽 수정 시 함께.
 *  · 일정 = 종이 월력 시트 3장 (노이즈 종이 + 다크 워시테이프 + 인쇄된 칸)
 *    모임일은 손그림 타원(회차별 오렌지/그레이 교차) + 필기체 회차 첨자,
 *    자유모임은 돼지꼬리 나선 + '자유독서' 첨자
 *  · 장소란 = 6c 손그림 유지 ("장소" → 곡선 화살표 → 펜 동그라미 "링키라운지")
 * 데이터는 전부 season-config 단일 출처 — 그리드는 date 계산으로 생성(하드코딩 금지).
 */

// 손글씨 첨자 폰트 — 후기 리프트 시안에서 승인된 Nanum Pen Script (DECISIONS 2026-07-21)
const penScript = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
})

// 시트별 기울임·테이프 회전 (장별 제각각 — 시안 14a 값)
const SHEET_ROT = [0.4, -0.45, 0.3]
const TAPE_ROT = [-2.5, 2, -1.5]
// 모임일 타원·첨자 회전 — 날짜마다 제각각 (결정적 순환, SSR 안전)
const MARK_ROT = [-8, 5, -3, 7, -6, 2, -4, 6, -7, 3, -5, 4, -2]
const TAG_ROT = [-5, 4, 6, -4, 5, -6, 4, -5, 6, -4, -6, 5, 4]
const ROUND_LABEL = ["1st", "2nd", "3rd", "4th"]
const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"]

// 요일을 시간대별로 묶어 "화·수 19:30–22:30 · 일 오전 10:30–13:30 / 오후 14:30–17:30" 형태로.
// 같은 시간대 요일은 주중 순서(일월화수목금토)로 정렬 — '화·수' (운영자 지시 2026-07-24).
function timeFootLine() {
  const dowIdx = (label: string) => DOW_LABELS.indexOf(label.replace("요일", ""))
  const groups: { labels: string[]; time: string }[] = []
  for (const d of SEASON.days) {
    const g = groups.find((x) => x.time === d.time)
    if (g) g.labels.push(d.label)
    else groups.push({ labels: [d.label], time: d.time })
  }
  return groups
    .map((g) => {
      const names = g.labels
        .map((l) => l.replace("요일", ""))
        .sort((a, b) => dowIdx(a) - dowIdx(b))
        .join("·")
      const slots = g.time.split(", ")
      if (slots.length === 2) return `${names} 오전 ${slots[0]} / 오후 ${slots[1]}`
      return `${names} ${g.time}`
    })
    .join(" · ")
}

export function ScheduleSection() {
  const cal = calendarData()
  // 모임일 마커 회전 인덱스: 날짜별 고유 순번 (결정적)
  const markerIndex = new Map<string, number>()
  cal.meetings.forEach((m, i) => markerIndex.set(m.date, i))

  return (
    <section id="schedule" className={styles.section}>
      <FadeUp y={12} duration={0.9}>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>일정·장소</h2>
        </div>
      </FadeUp>

      <div className={styles.boxWrap}>
        {/* 공통 헤더 — 좌 "4기 일정" · 우 기간 */}
        <div className={styles.calHeader}>
          <p className={styles.calHeaderTitle}>{SEASON.name} 일정</p>
          <span className={styles.calHeaderRange}>{SEASON.periodLabel}</span>
        </div>

        {cal.months.map((mo, mi) => {
          const firstDow = new Date(mo.year, mo.month - 1, 1).getDay()
          const daysInMonth = new Date(mo.year, mo.month, 0).getDate()
          // 이 달의 표시 대상(모임·자유) 중 마지막 날 — 마지막 달은 그 주까지만 렌더 (11월 = 첫 주)
          const eventDays = [
            ...cal.meetings.filter((m) => m.month === mo.month).map((m) => m.day),
            ...(cal.free.month === mo.month ? [cal.free.day] : []),
          ]
          const lastEventDay = Math.max(...eventDays)
          const isLastMonth = mi === cal.months.length - 1
          const lastRenderDay = isLastMonth ? lastEventDay : daysInMonth
          const weeks = Math.floor((firstDow + lastRenderDay - 1) / 7) + 1
          const totalCells = weeks * 7

          return (
            <FadeUp key={mo.month} y={10} duration={0.6} delay={0.08 * mi}>
              <div className={styles.calSheet} style={{ transform: `rotate(${SHEET_ROT[mi] ?? 0}deg)` }}>
                <span
                  className={styles.calTape}
                  style={{ transform: `translateX(-50%) rotate(${TAPE_ROT[mi] ?? 0}deg)` }}
                  aria-hidden
                />
                <div className={styles.calSheetHead}>
                  <span className={styles.calMonthName}>{mo.name}</span>
                  <span className={styles.calMonthEng}>{mo.eng}</span>
                </div>

                <div className={styles.calDowRow} aria-hidden>
                  {DOW_LABELS.map((d) => (
                    <span key={d} className={styles.calDow}>{d}</span>
                  ))}
                </div>

                <div className={styles.calGrid}>
                  {Array.from({ length: totalCells }, (_, ci) => {
                    const day = ci - firstDow + 1
                    const inMonth = day >= 1 && day <= daysInMonth
                    const meeting = inMonth
                      ? cal.meetings.find((m) => m.month === mo.month && m.day === day)
                      : undefined
                    const isFree = inMonth && cal.free.month === mo.month && cal.free.day === day
                    const mIdx = meeting ? markerIndex.get(meeting.date) ?? 0 : 0
                    // 회차별 오렌지/그레이 교차: 1·3회차 오렌지, 2·4회차 그레이
                    const orange = meeting ? meeting.round % 2 === 1 : true
                    const ellipseColor = orange ? "#d2691e" : "#8a7660"
                    const tagColor = orange ? "#b8571a" : "#8a7660"
                    return (
                      <div key={ci} className={styles.calCell}>
                        {inMonth && (
                          <span className={meeting || isFree ? styles.calDayNumMeet : styles.calDayNum}>
                            {day}
                          </span>
                        )}
                        {meeting && (
                          <>
                            <svg
                              viewBox="0 0 40 30"
                              className={styles.calMarker}
                              style={{
                                transform: `translate(-50%, -50%) rotate(${MARK_ROT[mIdx % MARK_ROT.length]}deg)`,
                              }}
                              aria-hidden
                            >
                              <ellipse
                                cx="20"
                                cy="15"
                                rx="15"
                                ry="10"
                                fill="none"
                                stroke={ellipseColor}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeDasharray="72 9"
                              />
                            </svg>
                            <span
                              className={`${penScript.className} ${styles.calRoundTag}`}
                              style={{
                                color: tagColor,
                                transform: `rotate(${TAG_ROT[mIdx % TAG_ROT.length]}deg)`,
                              }}
                            >
                              {ROUND_LABEL[meeting.round - 1]}
                            </span>
                          </>
                        )}
                        {isFree && (
                          <>
                            {/* 돼지꼬리 나선 — 자유모임 (시안 14a SVG 그대로) */}
                            <svg
                              viewBox="0 0 40 30"
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: "35px",
                                height: "26px",
                                transform: "translate(-50%,-50%) rotate(-4deg)",
                              }}
                              aria-hidden
                            >
                              <path
                                d="M33.5 14.5 C 34 8.5, 27.5 5, 20 5.5 C 11.5 6, 6.5 9.5, 7 15.5 C 7.5 21, 13 25, 20.5 24.5 C 28 24, 31.5 20.5, 31 15 C 30.5 10.5, 25.5 8, 20 8.5 C 14.5 9, 11 12, 11.5 15.5 C 12 19, 16 21.5, 20.5 21 C 24.5 20.6, 26.5 18.2, 26 15.5 C 25.6 13.3, 23.5 12.2, 21.5 12.8"
                                fill="none"
                                stroke="#d2691e"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className={`${penScript.className} ${styles.calFreeTag}`}>
                              {cal.free.label}
                            </span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </FadeUp>
          )
        })}

        <p className={styles.calTimeFoot}>{timeFootLine()}</p>
        <p className={styles.calNote}>*회차별 참여 요일 선택, 요일별 소수 정원</p>
        <p className={styles.calNote}>*참여인원 변동에 따라 모임 일정은 통합·추가 개설될 수 있습니다.</p>
      </div>

      <div className={styles.locationRow}>
          <span className={styles.locationLabel}>장소</span>
          <svg viewBox="0 0 34 18" aria-hidden className={styles.handArrow}>
            <path d="M2 4 C 9 11, 17 12.5, 27 9.5" fill="none" stroke="#8a6a50" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M22.5 5.8 L28.5 9.2 L24 13.8" fill="none" stroke="#8a6a50" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className={styles.locationInfo}>
            <span className={styles.locationNameWrap}>
              {/* 네이버 지도 링크 (운영자 지시 2026-07-07) — 클로징 CTA와 동일 좌표 */}
              <a
                href="https://naver.me/FLebi2a9"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.locationLink}
              >
                <span className={styles.locationName}>{SEASON.location.name}</span>
              </a>
              <svg viewBox="0 0 92 32" aria-hidden className={styles.penCircle}>
                <ellipse cx="46" cy="16" rx="43" ry="12" fill="none" stroke="#d2691e" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="172 14" />
              </svg>
            </span>
            <span className={styles.locationSub}>{SEASON.location.sub}</span>
            <span className={styles.locationNote}>{SEASON.location.note}</span>
          </div>
        </div>
    </section>
  )
}
