"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import styles from "../../../../apply/interview/schedule/page.module.css"
import pstyles from "../../../preview.module.css"
import { PREVIEW } from "../../../preview-config"
import { JourneyStepper } from "../../../JourneyStepper"
import {
  GYEOL_TITLE,
  GYEOL_PARAGRAPHS,
  DISSONANCE_TITLE,
  DISSONANCE_PARAGRAPHS,
} from "../../../../philosophy-content"

// ================================================================
// 슬롯 설정 — 원본과 동일. 단, 프리뷰는 예약 API 미연동(전 슬롯 예약 가능).
// ================================================================
const SLOT_DURATION = 30
const DAYS_AHEAD    = 7
const MIN_NOTICE_MS = 2 * 3600_000

function getSlotConfig(dow: number): { startH: number; startM: number; endH: number; endM: number } | null {
  if (dow >= 1 && dow <= 5) return { startH: 18, startM: 0, endH: 23, endM: 0 }
  if (dow === 0 || dow === 6) return { startH: 13, startM: 0, endH: 23, endM: 0 }
  return null
}

const DAY_KO   = ["일", "월", "화", "수", "목", "금", "토"]
const MONTH_KO = ["1월", "2월", "3월", "4월", "5월", "6월",
                  "7월", "8월", "9월", "10월", "11월", "12월"]

type SlotItem = {
  key: string
  startISO: string
  endISO: string
  label: string
  booked: boolean
}

type FormErrors = Partial<Record<"name" | "phone" | "_form", string>>

function scrollToPhoneRef() {
  document.getElementById("ref-section-phone")?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function pad(n: number) { return String(n).padStart(2, "0") }

function formatPhone(v: string) {
  const n = v.replace(/\D/g, "")
  if (n.length <= 3)  return n
  if (n.length <= 7)  return `${n.slice(0,3)}-${n.slice(3)}`
  return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7,11)}`
}

function slotsForDay(
  year: number,
  month: number,
  date: number,
  dow: number,
  nowUTCMs: number,
): SlotItem[] {
  const cfg = getSlotConfig(dow)
  if (!cfg) return []

  const slots: SlotItem[] = []
  let h = cfg.startH
  let m = cfg.startM

  while (h < cfg.endH || (h === cfg.endH && m < cfg.endM)) {
    const startUTCMs = Date.UTC(year, month, date, h - 9, m)
    const endUTCMs   = startUTCMs + SLOT_DURATION * 60_000

    if (startUTCMs > nowUTCMs + MIN_NOTICE_MS) {
      const key = `${year}-${pad(month+1)}-${pad(date)}T${pad(h)}:${pad(m)}`
      slots.push({
        key,
        startISO: new Date(startUTCMs).toISOString(),
        endISO:   new Date(endUTCMs).toISOString(),
        label:    `${pad(h)}:${pad(m)}`,
        booked:   false, // 프리뷰: 예약 현황 미연동
      })
    }

    m += SLOT_DURATION
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60 }
  }
  return slots
}

export default function PreviewInterviewSchedulePage() {
  const nowKST = useMemo(() => {
    const kstMs = Date.now() + 9 * 3600_000
    const d = new Date(kstMs)
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() }
  }, [])

  const [viewYear,     setViewYear]     = useState(() => nowKST.year)
  const [viewMonth,    setViewMonth]    = useState(() => nowKST.month)
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; date: number; dow: number } | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null)
  const [errors,       setErrors]       = useState<FormErrors>({})
  const [submitting,   setSubmitting]   = useState(false)
  const [submitted,    setSubmitted]    = useState(false)
  const [confirmed,    setConfirmed]    = useState<SlotItem | null>(null)
  const [prefillName,  setPrefillName]  = useState("")
  const [prefillPhone, setPrefillPhone] = useState("")
  const [ref1Open,     setRef1Open]     = useState(false)
  const [ref2Open,     setRef2Open]     = useState(false)
  const hasAutoSelected = useRef(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lazyday_preview_applicant")
      if (raw) {
        const { name, phone } = JSON.parse(raw) as { name?: string; phone?: string }
        if (name)  setPrefillName(name)
        if (phone) setPrefillPhone(phone)
      }
    } catch {}
  }, [])

  const nowUTCMs = useMemo(() => Date.now(), [])
  const maxBookingUTCMs = useMemo(() => {
    const kstMs = Date.now() + 9 * 3600_000
    const d = new Date(kstMs)
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + DAYS_AHEAD - 1)
  }, [])

  // 오늘 날짜 + 가장 빠른 슬롯 자동 선택 (최초 1회)
  useEffect(() => {
    if (hasAutoSelected.current) return
    hasAutoSelected.current = true

    const kstMs = Date.now() + 9 * 3600_000
    const d = new Date(kstMs)
    const todayCell = {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      date: d.getUTCDate(),
      dow:  d.getUTCDay(),
    }
    const todaySlots = slotsForDay(todayCell.year, todayCell.month, todayCell.date, todayCell.dow, nowUTCMs)
    const firstAvail = todaySlots.find(s => !s.booked)
    if (firstAvail) {
      setSelectedDate(todayCell)
      setSelectedSlot(firstAvail)
    }
  }, [nowUTCMs])

  const calDays = useMemo(() => {
    const firstDow    = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay()
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate()
    const cells: Array<{ year: number; month: number; date: number; dow: number } | null> = []

    for (let i = 0; i < firstDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(Date.UTC(viewYear, viewMonth, d)).getUTCDay()
      cells.push({ year: viewYear, month: viewMonth, date: d, dow })
    }
    return cells
  }, [viewYear, viewMonth])

  const availableMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const cell of calDays) {
      if (!cell) continue
      const slots = slotsForDay(cell.year, cell.month, cell.date, cell.dow, nowUTCMs)
      const avail = slots.filter(s => !s.booked).length
      if (avail > 0) map.set(`${cell.year}-${cell.month}-${cell.date}`, avail)
    }
    return map
  }, [calDays, nowUTCMs])

  const daySlots = useMemo(() => {
    if (!selectedDate) return []
    return slotsForDay(selectedDate.year, selectedDate.month, selectedDate.date, selectedDate.dow, nowUTCMs)
  }, [selectedDate, nowUTCMs])

  const minMonth  = nowKST.year * 12 + nowKST.month
  const curMonth  = viewYear * 12 + viewMonth
  const canPrev   = curMonth > minMonth
  const nextYear  = viewMonth === 11 ? viewYear + 1 : viewYear
  const nextMonthNum = viewMonth === 11 ? 0 : viewMonth + 1
  const canNext   = Date.UTC(nextYear, nextMonthNum, 1) <= maxBookingUTCMs

  function prevMonth() {
    if (!canPrev) return
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDate(null); setSelectedSlot(null)
  }
  function nextMonth() {
    if (!canNext) return
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDate(null); setSelectedSlot(null)
  }

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return ""
    return `${selectedDate.month + 1}월 ${selectedDate.date}일 ${DAY_KO[selectedDate.dow]}요일`
  }, [selectedDate])

  // ── 목업 예약: 실제 API 호출 없음 ──
  async function handleBook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSlot) return
    const fd    = new FormData(e.currentTarget)
    const name  = (fd.get("name")  as string)?.trim()
    const phone = (fd.get("phone") as string)?.trim()
    const errs: FormErrors = {}
    if (!name)  errs.name  = "이름을 입력해주세요."
    if (!phone) errs.phone = "전화번호를 입력해주세요."
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    setConfirmed(selectedSlot)
    setSubmitted(true)
    setSubmitting(false)
    window.scrollTo(0, 0)
  }

  // ── 완료 화면 ──────────────────────────────────────────────────
  if (submitted && confirmed) {
    const kstMs = new Date(confirmed.startISO).getTime() + 9 * 3600_000
    const d = new Date(kstMs)
    const dow = d.getUTCDay()
    const label = `${d.getUTCMonth()+1}월 ${d.getUTCDate()}일 (${DAY_KO[dow]}) ${confirmed.label}`
    const toCal = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "")
    const calUrl =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent("레이지데이 북클럽 전화 인터뷰") +
      "&dates=" + toCal(confirmed.startISO) + "/" + toCal(confirmed.endISO) +
      "&details=" + encodeURIComponent("레이지데이 북클럽 전화 인터뷰입니다. 선택하신 시간에 담당자가 전화드릴게요.")
    return (
      <main className={styles.successPage}>
        <div className={styles.successInner}>
          <BlurReveal duration={1.0} blur={10} fromScale={1.03}>
            <img src="/linky-lounge/book-club/lazyday_logo.png" alt="레이지데이" className={styles.successMark} />
          </BlurReveal>
          <FadeUp><h1 className={styles.successTitle}>인터뷰가 예약되었습니다.</h1></FadeUp>
          <FadeUp><p className={styles.successSlot}>{label}</p></FadeUp>
          <FadeUp>
            <p className={styles.successBody}>
              인터뷰는 <span className={styles.successAccent}>전화로 약 20분간</span> 진행됩니다.<br />
              선택하신 시간에 맞추어 연락드리겠습니다.
            </p>
          </FadeUp>
          <FadeUp><p className={styles.successCloser}>레이지데이 북클럽에서 곧 만나요.</p></FadeUp>
          <FadeUp>
            <a href={calUrl} target="_blank" rel="noopener noreferrer" className={styles.calendarBtn}>
              📅 내 캘린더에 추가
            </a>
          </FadeUp>
        </div>
      </main>
    )
  }

  // ── 메인 화면 ──────────────────────────────────────────────────
  return (
    <main className={styles.page}>
      {submitting && <SubmitOverlay label="예약 중..." />}
      <div className={styles.container}>

        <FadeUp>
          <div className={styles.header}>
            <img
              src="/linky-lounge/book-club/ldbc-logo-text.png"
              alt="레이지데이 북클럽"
              className={styles.headerImage}
              style={{ width: 417, height: 240, objectFit: "contain" }}
            />
            <h1 className={styles.headerTitle}>전화 인터뷰</h1>
            <JourneyStepper current={2} interview="전화" />
            <div className={styles.headerSub}>
              <p><span className={styles.accent}>결</span>이 맞는 사람과의 대화를 위한 레이지데이 북클럽의 전화 인터뷰 세션입니다. 떠오르는 대로, 자유롭게 이야기를 들려주세요.</p>
              <p className={styles.headerSubNote}>
                ✱ 레이지데이가 보는 '결'이 궁금하시면{" "}
                <button type="button" onClick={scrollToPhoneRef} className={styles.refLink}>
                  페이지 하단 (참고) 섹션
                </button>
                을 잠깐 훑어보셔도 좋아요.
              </p>
            </div>
          </div>
        </FadeUp>

        <FadeUp className={styles.bodyGroup}>
          <div className={styles.refBeigeWrap}>
            <p className={styles.ref0Title}>3기 구성 및 참가비</p>
            <div className={styles.ref0Grid}>
              <span className={styles.ref0Key}>정규모임</span>
              <span className={styles.ref0Val}>1–4회차 · 7월 15일부터 격주, 수·목·일 선택</span>
              <span className={styles.ref0Key}>자유모임</span>
              <span className={styles.ref0Val}>5회차 · 정규 4회 이후 진행</span>
              <span className={styles.ref0Key}>참가비</span>
              <span className={styles.ref0Val}>
                <s className={styles.priceWas}>{PREVIEW.priceWas}</s>
                <strong className={styles.priceNow}>{PREVIEW.priceNow}</strong>
                <span className={styles.priceLabel}>3기 한정</span>
              </span>
              <span className={styles.ref0Key}>장소</span>
              <span className={styles.ref0Val}>링키라운지 (사당역 도보 3분)</span>
            </div>
            <p className={styles.ref0Note}>*상황에 따라 장소가 변경될 수 있습니다.</p>
          </div>

          <div className={styles.panel}>
            <div className={styles.calSide}>
              <h2 className={styles.calTitle}>날짜를 선택해 주세요.</h2>
              {/* 개선: 예약 가능 기간 소형 안내 */}
              <p className={pstyles.rangeNote}>*예약은 오늘부터 7일 이내만 열려 있어요.</p>

              <div className={styles.monthNav}>
                <span className={styles.monthLabel}>{viewYear}년 {MONTH_KO[viewMonth]}</span>
                <div className={styles.monthBtns}>
                  <button className={styles.monthBtn} onClick={prevMonth} disabled={!canPrev} aria-label="이전 달">‹</button>
                  <button className={styles.monthBtn} onClick={nextMonth} disabled={!canNext} aria-label="다음 달">›</button>
                </div>
              </div>

              <div className={styles.dowRow}>
                {DAY_KO.map(d => <span key={d} className={styles.dowCell}>{d}</span>)}
              </div>

              <div className={styles.dateGrid}>
                {calDays.map((cell, i) => {
                  if (!cell) return <span key={`empty-${i}`} />

                  const cellKey    = `${cell.year}-${cell.month}-${cell.date}`
                  const todayKSTMs = Date.now() + 9 * 3600_000
                  const todayD     = new Date(todayKSTMs)
                  const isToday    = cell.year === todayD.getUTCFullYear() &&
                                     cell.month === todayD.getUTCMonth() &&
                                     cell.date  === todayD.getUTCDate()
                  const isPast     = Date.UTC(cell.year, cell.month, cell.date) < Date.UTC(todayD.getUTCFullYear(), todayD.getUTCMonth(), todayD.getUTCDate())
                  const isTooFar   = Date.UTC(cell.year, cell.month, cell.date) > maxBookingUTCMs
                  const hasSlots   = availableMap.has(cellKey)
                  const isSelected = selectedDate?.year === cell.year &&
                                     selectedDate?.month === cell.month &&
                                     selectedDate?.date === cell.date
                  const isDisabled = isPast || isTooFar || !hasSlots

                  return (
                    <button
                      key={cellKey}
                      disabled={isDisabled}
                      onClick={() => { setSelectedDate(cell); setSelectedSlot(null) }}
                      className={[
                        styles.dateCell,
                        isToday    && styles.dateCellToday,
                        isSelected && styles.dateCellSelected,
                        isDisabled && styles.dateCellDisabled,
                        !isDisabled && !isSelected && styles.dateCellAvail,
                      ].filter(Boolean).join(" ")}
                    >
                      {cell.date}
                      {hasSlots && !isDisabled && !isSelected && <span className={styles.availDot} />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.timeSide}>
              <h2 className={styles.timeTitle}>시간 선택</h2>

              {selectedDate === null ? (
                <p className={styles.timeHint}>캘린더에서 날짜를 먼저 선택해주세요.</p>
              ) : (
                <>
                  <p className={styles.selectedDateLabel}>{selectedDateLabel}</p>
                  <div className={styles.slotList}>
                    {daySlots.length === 0 ? (
                      <p className={styles.noSlots}>가능한 시간이 없습니다.</p>
                    ) : (
                      daySlots.map(slot => {
                        const isSel = selectedSlot?.key === slot.key
                        return (
                          <button
                            key={slot.key}
                            disabled={slot.booked}
                            onClick={() => setSelectedSlot(isSel ? null : slot)}
                            className={[
                              styles.slotRow,
                              slot.booked && styles.slotBooked,
                              isSel       && styles.slotSelected,
                            ].filter(Boolean).join(" ")}
                          >
                            {slot.label}
                            {slot.booked && <span className={styles.bookedTag}>마감</span>}
                          </button>
                        )
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

        {selectedSlot && (
            <div className={styles.bookCard}>
              <div className={styles.selectedBadge}>
                <span className={styles.selectedLabel}>선택한 일정</span>
                <span className={styles.selectedTime}>
                  {selectedDateLabel} {selectedSlot.label}
                </span>
              </div>
              <form onSubmit={handleBook} className={styles.form} noValidate>
                <div className={styles.formGroup}>
                  <label htmlFor="int-name" className={styles.formLabel}>이름 <span className={styles.req}>*</span></label>
                  <input
                    id="int-name" name="name" type="text"
                    className={`${styles.input} ${errors.name ? styles.inputErr : ""}`}
                    placeholder="성함을 입력해주세요."
                    defaultValue={prefillName}
                    onChange={() => setErrors(p => ({ ...p, name: undefined }))}
                  />
                  {errors.name && <p className={styles.errText}>{errors.name}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="int-phone" className={styles.formLabel}>전화번호 <span className={styles.req}>*</span></label>
                  <input
                    id="int-phone" name="phone" type="tel" inputMode="numeric"
                    className={`${styles.input} ${errors.phone ? styles.inputErr : ""}`}
                    placeholder="010-0000-0000"
                    defaultValue={prefillPhone}
                    onChange={e => { e.target.value = formatPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })) }}
                  />
                  {errors.phone && <p className={styles.errText}>{errors.phone}</p>}
                </div>
                {errors._form && <p className={styles.formErr}>{errors._form}</p>}
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? "예약 중..." : "인터뷰 예약하기"}
                </button>
              </form>
            </div>
        )}
        </FadeUp>

        <FadeUp>
          <div id="ref-section-phone" className={styles.referenceSection}>
            <div className={styles.refItem}>
              <button type="button" className={styles.refTitleBox} onClick={() => setRef1Open(v => !v)} aria-expanded={ref1Open}>
                <span className={styles.refQuestion}>(참고) {GYEOL_TITLE}</span>
                <span className={`${styles.refArrow} ${ref1Open ? styles.refArrowOpen : ""}`}>▾</span>
              </button>
              <div
                className={`${styles.refPeekWrap} ${ref1Open ? styles.refPeekOpen : ""}`}
                onClick={() => setRef1Open(v => !v)}
                role="button"
                aria-expanded={ref1Open}
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setRef1Open(v => !v)}
              >
                <div className={styles.refQuote}>
                  {GYEOL_PARAGRAPHS.map((p, j) => (
                    <p key={j} className={styles.refAnswer}>{p}</p>
                  ))}
                </div>
                {!ref1Open && (
                  <div className={styles.refFadeWrap}>
                    <div className={styles.refFadeBg} />
                    <span className={styles.refMoreHint}>...더보기</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.refItem}>
              <button type="button" className={styles.refTitleBox} onClick={() => setRef2Open(v => !v)} aria-expanded={ref2Open}>
                <span className={styles.refQuestion}>(참고) {DISSONANCE_TITLE}</span>
                <span className={`${styles.refArrow} ${ref2Open ? styles.refArrowOpen : ""}`}>▾</span>
              </button>
              <div
                className={`${styles.refPeekWrap} ${ref2Open ? styles.refPeekOpen : ""}`}
                onClick={() => setRef2Open(v => !v)}
                role="button"
                aria-expanded={ref2Open}
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setRef2Open(v => !v)}
              >
                <div className={styles.refQuote}>
                  {DISSONANCE_PARAGRAPHS.map((p, j) => (
                    <p key={j} className={styles.refAnswer}>{p}</p>
                  ))}
                </div>
                {!ref2Open && (
                  <div className={styles.refFadeWrap}>
                    <div className={styles.refFadeBg} />
                    <span className={styles.refMoreHint}>...더보기</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FadeUp>

      </div>
    </main>
  )
}
