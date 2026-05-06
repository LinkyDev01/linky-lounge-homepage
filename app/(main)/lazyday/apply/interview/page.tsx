"use client"

import { useState, useEffect, useMemo } from "react"
import { FadeUp } from "@/components/animation/FadeUp"
import styles from "./page.module.css"

// ================================================================
// 슬롯 설정 — 요일별 시간대
// ================================================================
const SLOT_DURATION = 30  // 분
const MONTHS_AHEAD  = 2

/** 요일(0=일,1=월,...,6=토) → KST 슬롯 범위 */
function getSlotConfig(dow: number): { startH: number; startM: number; endH: number; endM: number } | null {
  if (dow >= 1 && dow <= 5) return { startH: 18, startM: 0, endH: 23, endM: 0 }  // 평일 18:00–23:00
  if (dow === 0 || dow === 6) return { startH: 13, startM: 0, endH: 23, endM: 0 }  // 주말 13:00–23:00
  return null
}
// ================================================================

const DAY_KO   = ["일", "월", "화", "수", "목", "금", "토"]
const MONTH_KO = ["1월", "2월", "3월", "4월", "5월", "6월",
                  "7월", "8월", "9월", "10월", "11월", "12월"]

type SlotItem = {
  key: string       // "2026-05-07T19:30" KST
  startISO: string  // UTC ISO
  endISO: string
  label: string     // "19:30"
  booked: boolean
}

type FormErrors = Partial<Record<"name" | "phone" | "_form", string>>

// ─── 유틸 ────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0") }

/** ISO 문자열 → KST "YYYY-MM-DDTHH:MM" 키 */
function isoToKSTKey(iso: string) {
  // KST = UTC + 9h
  const utcMs = new Date(iso).getTime()
  const kstMs = utcMs + 9 * 3600_000
  const d = new Date(kstMs)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

function formatPhone(v: string) {
  const n = v.replace(/\D/g, "")
  if (n.length <= 3)  return n
  if (n.length <= 7)  return `${n.slice(0,3)}-${n.slice(3)}`
  return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7,11)}`
}

/** 특정 날짜(year, month, date, dow)의 슬롯 목록 생성 */
function slotsForDay(
  year: number,
  month: number,  // 0-indexed
  date: number,
  dow: number,
  nowUTCMs: number,
  bookedKeys: Set<string>
): SlotItem[] {
  const cfg = getSlotConfig(dow)
  if (!cfg) return []

  const slots: SlotItem[] = []
  let h = cfg.startH
  let m = cfg.startM

  while (h < cfg.endH || (h === cfg.endH && m < cfg.endM)) {
    // KST h:m → UTC ms (Date.UTC handles negative hours correctly)
    const startUTCMs = Date.UTC(year, month, date, h - 9, m)
    const endUTCMs   = startUTCMs + SLOT_DURATION * 60_000

    // 현재 시각보다 미래인 슬롯만 포함
    if (startUTCMs > nowUTCMs) {
      const key = `${year}-${pad(month+1)}-${pad(date)}T${pad(h)}:${pad(m)}`
      slots.push({
        key,
        startISO: new Date(startUTCMs).toISOString(),
        endISO:   new Date(endUTCMs).toISOString(),
        label:    `${pad(h)}:${pad(m)}`,
        booked:   bookedKeys.has(key),
      })
    }

    m += SLOT_DURATION
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60 }
  }
  return slots
}

export default function InterviewPage() {
  const [bookedISOs,   setBookedISOs]   = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(true)

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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lazyday_applicant")
      if (raw) {
        const { name, phone } = JSON.parse(raw) as { name?: string; phone?: string }
        if (name)  setPrefillName(name)
        if (phone) setPrefillPhone(phone)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetch("/api/lazyday/interview/slots")
      .then(r => r.json())
      .then(d => setBookedISOs((d.bookedSlots ?? []).map((s: { start: string }) => s.start)))
      .catch(() => {})
      .finally(() => setSlotsLoading(false))
  }, [])

  const nowUTCMs   = useMemo(() => Date.now(), [])
  const bookedKeys = useMemo(() => new Set(bookedISOs.map(isoToKSTKey)), [bookedISOs])

  // 달력 셀 목록
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

  // 날짜별 가용 슬롯 수
  const availableMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const cell of calDays) {
      if (!cell) continue
      const slots = slotsForDay(cell.year, cell.month, cell.date, cell.dow, nowUTCMs, bookedKeys)
      const avail = slots.filter(s => !s.booked).length
      if (avail > 0) map.set(`${cell.year}-${cell.month}-${cell.date}`, avail)
    }
    return map
  }, [calDays, nowUTCMs, bookedKeys])

  // 선택된 날의 슬롯
  const daySlots = useMemo(() => {
    if (!selectedDate) return []
    return slotsForDay(selectedDate.year, selectedDate.month, selectedDate.date, selectedDate.dow, nowUTCMs, bookedKeys)
  }, [selectedDate, nowUTCMs, bookedKeys])

  // 월 이동 제한
  const minMonth = nowKST.year * 12 + nowKST.month
  const maxMonth = minMonth + MONTHS_AHEAD
  const curMonth = viewYear * 12 + viewMonth
  const canPrev  = curMonth > minMonth
  const canNext  = curMonth < maxMonth

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

  // 예약 제출
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
    try {
      const res = await fetch("/api/lazyday/interview/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, slotStart: selectedSlot.startISO, slotEnd: selectedSlot.endISO }),
      })
      const data = await res.json()
      if (data.success) {
        setConfirmed(selectedSlot)
        setSubmitted(true)
        window.scrollTo(0, 0)
      } else {
        setErrors({ _form: data.error ?? "예약 중 오류가 발생했습니다." })
      }
    } catch {
      setErrors({ _form: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요." })
    }
    setSubmitting(false)
  }

  // ── 완료 화면 ──────────────────────────────────────────────────
  if (submitted && confirmed) {
    const kstMs = new Date(confirmed.startISO).getTime() + 9 * 3600_000
    const d = new Date(kstMs)
    const dow = d.getUTCDay()
    const label = `${d.getUTCMonth()+1}월 ${d.getUTCDate()}일 (${DAY_KO[dow]}) ${confirmed.label}`
    return (
      <main className={styles.successPage}>
        <div className={styles.successInner}>
          <FadeUp>
            <img src="/linky-lounge/book-club/lazyday_logo.png" alt="레이지데이" className={styles.successMark} />
          </FadeUp>
          <FadeUp delay={0.1}><h1 className={styles.successTitle}>인터뷰가 예약되었습니다.</h1></FadeUp>
          <FadeUp delay={0.2}><p className={styles.successSlot}>{label}</p></FadeUp>
          <FadeUp delay={0.3}>
            <p className={styles.successBody}>
              인터뷰는 <span className={styles.successAccent}>전화로 약 20분간</span> 진행됩니다.<br />
              선택하신 시간에 맞추어 연락드리겠습니다.
            </p>
          </FadeUp>
          <FadeUp delay={0.4}><p className={styles.successCloser}>레이지데이 북클럽에서 곧 만나요.</p></FadeUp>
        </div>
      </main>
    )
  }

  // ── 메인 화면 ──────────────────────────────────────────────────
  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* 헤더 */}
        <FadeUp>
          <div className={styles.header}>
            <img src="/linky-lounge/book-club/lazy_typo_brown.png" alt="Lazy Day Book Club" className={styles.headerImage} />
          </div>
        </FadeUp>

        {/* 메인 패널 */}
        <FadeUp delay={0.1}>
          <div className={styles.panel}>

            {/* ── 왼쪽: 월 달력 ── */}
            <div className={styles.calSide}>
              <h2 className={styles.calTitle}>날짜를 선택해 주세요.</h2>

              {/* 월 네비게이션 */}
              <div className={styles.monthNav}>
                <span className={styles.monthLabel}>{viewYear}년 {MONTH_KO[viewMonth]}</span>
                <div className={styles.monthBtns}>
                  <button className={styles.monthBtn} onClick={prevMonth} disabled={!canPrev} aria-label="이전 달">‹</button>
                  <button className={styles.monthBtn} onClick={nextMonth} disabled={!canNext} aria-label="다음 달">›</button>
                </div>
              </div>

              {/* 요일 헤더 */}
              <div className={styles.dowRow}>
                {DAY_KO.map(d => <span key={d} className={styles.dowCell}>{d}</span>)}
              </div>

              {/* 날짜 그리드 */}
              {slotsLoading ? (
                <div className={styles.calLoading}>
                  <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                </div>
              ) : (
                <div className={styles.dateGrid}>
                  {calDays.map((cell, i) => {
                    if (!cell) return <span key={`empty-${i}`} />

                    const cellKey    = `${cell.year}-${cell.month}-${cell.date}`
                    const todayKSTMs = Date.now() + 9 * 3600_000
                    const todayD     = new Date(todayKSTMs)
                    const isToday    = cell.year === todayD.getUTCFullYear() &&
                                       cell.month === todayD.getUTCMonth() &&
                                       cell.date  === todayD.getUTCDate()
                    // 오늘 포함 이전 날짜는 비활성
                    const isPast     = Date.UTC(cell.year, cell.month, cell.date) <= Date.UTC(todayD.getUTCFullYear(), todayD.getUTCMonth(), todayD.getUTCDate())
                    const hasSlots   = availableMap.has(cellKey)
                    const isSelected = selectedDate?.year === cell.year &&
                                       selectedDate?.month === cell.month &&
                                       selectedDate?.date === cell.date
                    const isDisabled = isPast || !hasSlots

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
                        {hasSlots && !isSelected && <span className={styles.availDot} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── 구분선 ── */}
            <div className={styles.divider} />

            {/* ── 오른쪽: 시간 선택 ── */}
            <div className={styles.timeSide}>
              <h2 className={styles.timeTitle}>시간 선택</h2>

              {selectedDate === null ? (
                <p className={styles.timeHint}>왼쪽에서 날짜를 먼저 선택해주세요.</p>
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
                            {slot.booked && <span className={styles.bookedTag}>예약됨</span>}
                          </button>
                        )
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </FadeUp>

        {/* 예약 폼 */}
        {selectedSlot && (
          <FadeUp>
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
          </FadeUp>
        )}

      </div>
    </main>
  )
}
                                                         