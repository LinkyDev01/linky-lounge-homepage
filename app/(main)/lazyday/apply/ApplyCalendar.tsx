"use client"

import { Nanum_Pen_Script } from "next/font/google"
import styles from "./ApplyCalendar.module.css"
import { SEASON, calendarData } from "../season-config"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 신청 페이지 일정 캘린더 — 랜딩 ScheduleSection(14a 월별 달력)의 분리 사본.
 * (운영자 지시 2026-07-27: apply 일정 표 → 랜딩 캘린더로 교체)
 * 섹션 제목·장소란은 제외하고 캘린더 블록(헤더·시트 3장·시간·각주)만 렌더.
 * 랜딩 캘린더 수정 시 이 사본도 같은 값으로 동기화할 것 (TSX 쌍 동기화 원칙).
 * 실 apply와 preview/apply가 이 컴포넌트를 공유한다.
 */

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

// 요일을 시간대별로 묶어 세 줄로: "화·수 저녁 19:30–22:30" / "일 오전 10:30–13:30" / "일 오후 14:30–17:30" (운영자 지시 2026-07-27)
function timeFootLines(): string[] {
  const dowIdx = (label: string) => DOW_LABELS.indexOf(label.replace("요일", ""))
  const groups: { labels: string[]; time: string }[] = []
  for (const d of SEASON.days) {
    const g = groups.find((x) => x.time === d.time)
    if (g) g.labels.push(d.label)
    else groups.push({ labels: [d.label], time: d.time })
  }
  const lines: string[] = []
  for (const g of groups) {
    const names = g.labels
      .map((l) => l.replace("요일", ""))
      .sort((a, b) => dowIdx(a) - dowIdx(b))
      .join("·")
    const slots = g.time.split(", ")
    if (slots.length === 2) {
      lines.push(`${names} 오전 ${slots[0]}`)
      lines.push(`${names} 오후 ${slots[1]}`)
    } else {
      lines.push(`${names} 저녁 ${g.time}`)
    }
  }
  return lines
}

export function ApplyCalendar() {
  const cal = calendarData()
  const markerIndex = new Map<string, number>()
  cal.meetings.forEach((m, i) => markerIndex.set(m.date, i))

  return (
    <div className={styles.boxWrap}>
      {/* 공통 헤더 — 좌 "4기 일정" · 우 기간 */}
      <div className={styles.calHeader}>
        <p className={styles.calHeaderTitle}>{SEASON.name} 일정</p>
        <span className={styles.calHeaderRange}>{SEASON.periodLabel}</span>
      </div>

      {cal.months.map((mo, mi) => {
        const firstDow = new Date(mo.year, mo.month - 1, 1).getDay()
        const daysInMonth = new Date(mo.year, mo.month, 0).getDate()
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

      {timeFootLines().map((line) => (
          <p key={line} className={styles.calTimeFoot}>{line}</p>
        ))}
      <p className={styles.calNote}>*고정 요일로 반 배정이 진행될 수 있으나, 매 회차 요일 변경이 가능한 상품입니다.</p>
      <p className={styles.calNote}>*참여인원 변동에 따라 모임 일정은 통합·추가 개설될 수 있습니다.</p>
    </div>
  )
}
