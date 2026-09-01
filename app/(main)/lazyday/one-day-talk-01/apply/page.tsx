"use client"

import { useEffect, useState } from "react"
import { Nanum_Pen_Script } from "next/font/google"
import { FadeUp } from "@/components/animation/FadeUp"
import styles from "../../apply/page.module.css"
import { ONEDAY, isPastSession, sessionDateLabel, sessionKey, type OnedaySession } from "../oneday-shared"
import { useBasePath } from "@/hooks/use-base-path"
import { meetingCode } from "@/lib/order-catalog"
import { CHECKOUT_PATH } from "@/lib/payments/config"
import cal from "./oneday.module.css"

/**
 * 원데이 토크 신청 (일회성 모임 — 표기는 한글 "원데이 토크", 운영자 확정 2026-07-24).
 * URL: /one-day-talk-01/apply (북클럽 도메인 기준).
 *
 * 선결제→후신청 전환 (2026-08-11 운영자 확정 여정): 이 페이지는 이제 **회차 선택 →
 * 결제 진입**만 담당한다. 신청서(이름·성별·나이·연락처·인사·인스타·동의)는 결제
 * 승인 직후 checkout/success 가 띄운다 — 결제된 사람만 시트에 접수되므로 구 구조의
 * "미결제 신청 잔존" 문제가 사라진다.
 * 구 폼(접수 → 완료 화면에서 계좌이체/토스 선택)은 이 커밋에서 제거 — 계좌이체가
 * 다시 필요하면 git 이력의 이 파일 직전 버전을 참조 (BANK_* 상수 포함).
 *
 * 일정 = 랜딩 14a 달력 문법의 월별 시트 (손그림 타원 체크). 달력은 oneday.module.css.
 */

// 손글씨 회차 첨자 — 랜딩 달력과 동일 문법 (Nanum Pen Script)
const penScript = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
})

const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"]
// 손그림 타원 회전 — 날짜별 제각각 (랜딩 문법). 회차 전역 순서(sessions 배열 인덱스) 기준
const MARK_ROT = [-6, 4, -3]
// 회차가 8월·9월에 걸쳐 있어 (4주 연기, 2026-08-11) 월별 시트를 각각 그린다
const ONEDAY_MONTHS = [...new Set(ONEDAY.sessions.map((s) => s.month))]
const MONTH_ENG = ["", "JAN.", "FEB.", "MAR.", "APR.", "MAY", "JUN.", "JUL.", "AUG.", "SEP.", "OCT.", "NOV.", "DEC."]

/** 월별 달력 시트 한 장 — 랜딩 14a 문법, 모임일은 손그림 타원 체크 */
function OnedayMonthSheet({ month }: { month: number }) {
  const firstDow = new Date(ONEDAY.year, month - 1, 1).getDay()
  const daysInMonth = new Date(ONEDAY.year, month, 0).getDate()
  const totalCells = (Math.floor((firstDow + daysInMonth - 1) / 7) + 1) * 7

  return (
    <FadeUp y={10} duration={0.6}>
      <div className={cal.calSheet}>
        <span className={cal.calTape} aria-hidden />
        <div className={cal.calSheetHead}>
          <span className={cal.calMonthName}>{month}월</span>
          <span className={cal.calMonthEng}>{MONTH_ENG[month]} {ONEDAY.year}</span>
        </div>
        <div className={cal.calDowRow} aria-hidden>
          {DOW_LABELS.map((d) => (
            <span key={d} className={cal.calDow}>{d}</span>
          ))}
        </div>
        <div className={cal.calGrid}>
          {Array.from({ length: totalCells }, (_, ci) => {
            const day = ci - firstDow + 1
            const inMonth = day >= 1 && day <= daysInMonth
            // 회차 인덱스는 전역(sessions 배열) 기준 — 타원 회전·첨자 각도가 회차마다 다르다
            const meetIdx = inMonth
              ? ONEDAY.sessions.findIndex((s) => s.month === month && s.day === day)
              : -1
            return (
              <div key={ci} className={cal.calCell}>
                {inMonth && (
                  <span className={meetIdx >= 0 ? cal.calDayNumMeet : cal.calDayNum}>{day}</span>
                )}
                {meetIdx >= 0 && (
                  <>
                    <svg
                      viewBox="0 0 40 30"
                      className={cal.calMarker}
                      style={{ transform: `translate(-50%, -50%) rotate(${MARK_ROT[meetIdx % MARK_ROT.length]}deg)` }}
                      aria-hidden
                    >
                      <ellipse
                        cx="20"
                        cy="15"
                        rx="15"
                        ry="10"
                        fill="none"
                        stroke="#d2691e"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeDasharray="72 9"
                      />
                    </svg>
                    {/* 필기체 회차 첨자 — 랜딩 1st/2nd 문법의 한글판 (운영자 지시 2026-07-24) */}
                    <span
                      className={`${penScript.className} ${cal.calRoundTag}`}
                      style={{ transform: `rotate(${meetIdx % 2 === 0 ? -5 : 4}deg)` }}
                    >
                      {ONEDAY.sessions[meetIdx].label}
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
}

/** 일정 달력 — 회차가 걸친 월(8·9월)마다 시트 한 장씩 */
function OnedayCalendar() {
  return (
    <div>
      <div className={cal.calHeader}>
        <p className={cal.calHeaderTitle}>일회성 모임 일정</p>
        <span className={cal.calHeaderRange}>{ONEDAY.rangeLabel}</span>
      </div>
      {ONEDAY_MONTHS.map((m) => (
        <OnedayMonthSheet key={m} month={m} />
      ))}
    </div>
  )
}

export default function OnedayApplyPage() {
  const base = useBasePath()
  // 신청 회차 멀티체크 — 복수 선택 가능 (운영자 지시 2026-07-24). 키 = month*100+day (8·9월 혼재)
  const [pickedKeys, setPickedKeys] = useState<number[]>([])
  const [sessionsError, setSessionsError] = useState("")

  // 지난 회차는 선택 자체를 막는다 (마운트 후 계산 — 정적 프리렌더에 시각 박제 방지)
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])
  // closed(수동 마감)는 시각·마운트와 무관하게 즉시 막는다 — 첫 페인트부터 선택 불가
  const isPast = (s: OnedaySession) => s.closed === true || (now !== null && isPastSession(s))
  const openSessions = ONEDAY.sessions.filter((s) => !isPast(s))

  function toggleSession(s: OnedaySession) {
    if (isPast(s)) return
    const key = sessionKey(s)
    setPickedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
    setSessionsError("")
  }

  const checkoutHref = `${base}${CHECKOUT_PATH}?items=${[...pickedKeys]
    .sort((a, b) => a - b)
    .map(meetingCode)
    .join(",")}`

  function handleGoCheckout(e: React.MouseEvent) {
    if (pickedKeys.length === 0) {
      e.preventDefault()
      setSessionsError("신청할 모임을 한 개 이상 선택해주세요.")
      document.getElementById("sessions-group")?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <main className={styles.applyPage} data-track-section="bookclub_oneday_apply">
      <div className={styles.container}>
        <FadeUp y={12} duration={0.9}>
          <div className={styles.header}>
            <img
              src="/linky-lounge/book-club/ldbc-logo-text.png"
              alt="레이지데이 북클럽"
              className={styles.headerImage}
            />
            {/* 포괄 표기 "일회성 모임" (운영자 2026-08-11) — 원데이 토크·무비토크를 한 폼이 담는다 */}
            <h1 className={styles.headerTitle}>
              레이지데이 북클럽
              <br />
              <span className={styles.headerSeason}>일회성 모임</span> 신청하기
            </h1>
          </div>
        </FadeUp>

        <section className={styles.scheduleNotice}>
          <OnedayCalendar />
          {/* 행 형식 일정 — 표 폐기, 라벨(회차·장소)은 주황 서식 통일 (운영자 지시 2026-07-24) */}
          <div className={cal.infoRows}>
            {ONEDAY.sessions.map((s) => (
              <div key={sessionKey(s)} className={cal.infoRow}>
                <span className={cal.infoLabel}>{s.label}</span>
                <span className={cal.infoValue}>{sessionDateLabel(s)} {s.time}</span>
              </div>
            ))}
            <div className={cal.infoRow}>
              <span className={cal.infoLabel}>장소</span>
              <span className={cal.infoValue}>링키라운지(사당역 도보 3분)</span>
            </div>
            <p className={cal.infoNote}>*장소는 변경될 수 있습니다.</p>
            <div className={cal.infoRow}>
              <span className={cal.infoLabel}>가격</span>
              <span className={cal.infoValue}>35,000원</span>
            </div>
          </div>
        </section>

        {/* 선결제→후신청: 여기서는 회차만 고르고 결제로 — 신청서는 결제 완료 직후 이어진다 */}
        <div className={styles.form}>
          <div id="sessions-group" className={styles.formGroup}>
            <span className={styles.formLabel}>
              신청할 모임
              <span className={styles.required}>*</span>
            </span>
            <div className={cal.sessionList}>
              {ONEDAY.sessions.map((s) => {
                const on = pickedKeys.includes(sessionKey(s))
                const past = isPast(s)
                return (
                  <label
                    key={sessionKey(s)}
                    className={`${cal.sessionOption} ${on ? cal.sessionOptionOn : ""} ${past ? cal.sessionOptionPast : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={past}
                      onChange={() => toggleSession(s)}
                      className={cal.sessionCheck}
                    />
                    <span className={cal.sessionInfo}>
                      <span className={cal.sessionDate}>
                        {sessionDateLabel(s)}
                        {/* 지난 회차 = 종료 / 수동 마감(closed) = 마감 (2026-08-09) */}
                        {past && <span className={cal.sessionEnded}>{s.closed ? "마감" : "종료"}</span>}
                      </span>
                      <span className={cal.sessionBook}>『{s.work}』 <span className={cal.sessionAuthor}>{s.author}</span></span>
                      <span className={cal.sessionTime}>{s.time}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {openSessions.length === 0 ? (
              <p className={cal.sessionClosed}>현재 신청 가능한 회차가 없습니다. 다음 모임 일정은 인스타그램·카카오채널로 안내드릴게요.</p>
            ) : (
              <p className={cal.sessionHint}>복수 선택 가능 · 참여할 모임을 모두 선택해주세요.</p>
            )}
            {sessionsError && <p className={styles.errorText}>{sessionsError}</p>}
          </div>

          {openSessions.length > 0 && (
            <>
              <a href={checkoutHref} className={`${styles.submitButton} ${cal.submitLink}`} onClick={handleGoCheckout}>
                {pickedKeys.length > 1
                  ? `${pickedKeys.length}개 모임 결제하고 신청하기`
                  : "결제하고 신청하기"}
              </a>
              <p className={cal.infoNote}>
                *결제가 완료되면 이어서 신청서(이름·연락처 등)를 작성하는 화면이 나옵니다.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
