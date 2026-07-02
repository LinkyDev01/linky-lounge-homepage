"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import { SEASON } from "../../../season-config"
import styles from "./page.module.css"

// ================================================================
// 슬롯 설정 — 요일별 시간대
// ================================================================
const SLOT_DURATION = 30           // 분
const DAYS_AHEAD    = 7            // 당일 포함 예약 가능 기간
const MIN_NOTICE_MS = 2 * 3600_000 // 현재 시각으로부터 최소 2시간 초과 슬롯만 예약 가능

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

function scrollToPhoneRef() {
  document.getElementById("ref-section-phone")?.scrollIntoView({ behavior: "smooth", block: "start" })
}

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

    // 현재 시각으로부터 2시간 초과인 슬롯만 포함 (당일 예약 허용)
    if (startUTCMs > nowUTCMs + MIN_NOTICE_MS) {
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

export default function InterviewSchedulePage() {
  const [bookedEvents,  setBookedEvents]  = useState<{ start: string; end: string }[]>([])
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
  const [ref1Open,     setRef1Open]     = useState(false)
  const [ref2Open,     setRef2Open]     = useState(false)
  const hasAutoSelected = useRef(false)

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
      .then(d => setBookedEvents(
        (d.bookedSlots ?? []).map((s: { start: string; end: string }) => ({ start: s.start, end: s.end }))
      ))
      .catch(() => {})
      .finally(() => setSlotsLoading(false))
  }, [])

  const nowUTCMs   = useMemo(() => Date.now(), [])
  // KST 기준 당일 포함 DAYS_AHEAD일째의 자정 UTC (= 예약 마감 기준)
  const maxBookingUTCMs = useMemo(() => {
    const kstMs = Date.now() + 9 * 3600_000
    const d = new Date(kstMs)
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + DAYS_AHEAD - 1)
  }, [])
  // 각 이벤트의 start~end 범위를 SLOT_DURATION 단위로 쪼개 모든 겹치는 슬롯을 마감 처리
  const bookedKeys = useMemo(() => {
    const keys = new Set<string>()
    bookedEvents.forEach(({ start, end }) => {
      let t = new Date(start).getTime()
      const e = new Date(end).getTime()
      while (t < e) {
        keys.add(isoToKSTKey(new Date(t).toISOString()))
        t += SLOT_DURATION * 60_000
      }
    })
    return keys
  }, [bookedEvents])

  // 슬롯 로딩 완료 후 — 오늘 날짜 + 가장 빠른 슬롯 자동 선택 (최초 1회)
  useEffect(() => {
    if (slotsLoading || hasAutoSelected.current) return
    hasAutoSelected.current = true

    const kstMs = Date.now() + 9 * 3600_000
    const d = new Date(kstMs)
    const todayCell = {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      date: d.getUTCDate(),
      dow:  d.getUTCDay(),
    }
    const todaySlots = slotsForDay(
      todayCell.year, todayCell.month, todayCell.date, todayCell.dow,
      nowUTCMs, bookedKeys
    )
    const firstAvail = todaySlots.find(s => !s.booked)
    if (firstAvail) {
      setSelectedDate(todayCell)
      setSelectedSlot(firstAvail)
    }
  }, [slotsLoading, bookedKeys, nowUTCMs])

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

  // 월 이동 제한 — 다음 달 첫날이 예약 가능 기간 내에 있을 때만 Next 허용
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
    // 신청자가 본인 구글 캘린더에 추가할 수 있는 링크 (TEMPLATE)
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

        {/* 헤더 */}
        <FadeUp>
          <div className={styles.header}>
            <img
              src="/linky-lounge/book-club/ldbc-logo-text.png"
              alt="레이지데이 북클럽"
              className={styles.headerImage}
              style={{ width: 417, height: 240, objectFit: "contain" }}
            />
            <h1 className={styles.headerTitle}>전화 인터뷰</h1>
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
        {/* 3기 구성 및 참가비 */}
          <div className={styles.refBeigeWrap}>
            <p className={styles.ref0Title}>{SEASON.name} 구성 및 참가비</p>
            <div className={styles.ref0Grid}>
              <span className={styles.ref0Key}>정규모임</span>
              <span className={styles.ref0Val}>{SEASON.regularNote}</span>
              <span className={styles.ref0Key}>자유모임</span>
              <span className={styles.ref0Val}>{SEASON.freeNote}</span>
              {/* 취소선 정가는 실제 200,000원 판매 이력이 확인될 때만 표기 가능 (표시광고법 — 종전거래가격) */}
              <span className={styles.ref0Key}>참가비</span>
              <span className={styles.ref0Val}>
                <strong className={styles.priceNow}>{SEASON.price}</strong>
              </span>
              <span className={styles.ref0Key}>장소</span>
              <span className={styles.ref0Val}>{SEASON.location.short}</span>
            </div>
            <p className={styles.ref0Note}>{SEASON.location.note}</p>
          </div>

        {/* 메인 패널 */}
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
                    // 오늘 이전 날짜 비활성 (오늘은 2시간 초과 슬롯이 있으면 활성)
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
              )}
            </div>

            {/* ── 구분선 ── */}
            <div className={styles.divider} />

            {/* ── 오른쪽: 시간 선택 ── */}
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

        {/* 예약 폼 */}
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
        {/* (참고) 섹션 */}
          <div id="ref-section-phone" className={styles.referenceSection}>

            {/* 참고 1: 결 */}
            <div className={styles.refItem}>
              <button type="button" className={styles.refTitleBox} onClick={() => setRef1Open(v => !v)} aria-expanded={ref1Open}>
                <span className={styles.refQuestion}>(참고) 레이지데이가 보는 '결'</span>
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
                  <p className={styles.refAnswer}>저희가 정의 내린 결은, 사람마다 살아온 환경·경험으로 몸에 밴, 무의식적인 판단·반응의 패턴이에요. 한 줄로 정리하면 <strong className={styles.refStrong}>결 = 한 사람의 아비투스</strong>입니다.</p>
                  <p className={styles.refFootnote}>* 아비투스(Habitus) : 부르디외라는 사회학자가 쓴 개념. 의식하지 않고 저절로 작동하는 감각·반응·선택의 패턴. "왜 이게 좋지? 왜 저건 거슬리지?"의 답이 이미 몸 안에 있는 상태.</p>
                  <p className={styles.refAnswer}>아비투스는 그 사람이 쌓아온 것들이 담기는 그릇이지만, 그것들이 작동하는 방식까지 포함합니다. 즉 책·경험·말투 같은 쌓인 문화자본만이 아니라, 그 사람의 기질·리듬·감도까지 함께 품는 더 큰 개념이에요.</p>
                  <p className={styles.refAnswer}>결국 "결이 맞다"는 두 사람의 아비투스가 어긋나지 않고 맞물려 움직이는 상태예요. 단순히 취향이 비슷하다는 게 아니에요.</p>
                  <p className={styles.refAnswer}>한 사람이 어떤 문장 앞에서 한참 멈춰 있을 때 다른 사람이 그 멈춤을 같이 견디는 것. 한 사람이 풀어내려 한 생각을 다른 사람이 자기 언어로 이어받는 것. 같은 자리에서 누가 말하고 누가 침묵할지가 자연스럽게 정해지는 것. 이게 두 사람의 결이 맞물려 움직이는 모습이에요.</p>
                  <p className={styles.refAnswer}>결이 맞으면 자연스럽게 따라오는 게 있어요. 굳이 설명하지 않아도 맥락이 읽히는 편안함. 친밀함이나 익숙함과는 좀 다른 편안함이에요. 처음 본 사이여도 결이 맞으면 그 편안함이 생기고, 오래 본 사이여도 결이 다르면 안 생기거든요.</p>
                  <p className={styles.refAnswer}>정리하면, 결이 맞는다는 건 두 사람의 아비투스가 공명한다는 뜻이에요.</p>
                </div>
                {!ref1Open && (
                  <div className={styles.refFadeWrap}>
                    <div className={styles.refFadeBg} />
                    <span className={styles.refMoreHint}>...더보기</span>
                  </div>
                )}
              </div>
            </div>

            {/* 참고 2: 불균형의 균형 */}
            <div className={styles.refItem}>
              <button type="button" className={styles.refTitleBox} onClick={() => setRef2Open(v => !v)} aria-expanded={ref2Open}>
                <span className={styles.refQuestion}>(참고) 불균형의 균형 (Dissonance in Harmony)</span>
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
                  <p className={styles.refAnswer}>비슷한 결을 가진 사람들이 모였다고 해서 같은 결론에 도달할 필요는 없거든요. 같은 곳에서 멈추는 사람들이라도 거기서 자라난 사유의 궤적은 각자 다르니까요.</p>
                  <p className={styles.refAnswer}>바우하우스의 정갈한 비대칭처럼, 각기 다른 궤적을 그려온 사람들의 단련된 사유가 거칠게 부딪힐 때 그 불협화음이 오히려 고전의 본질을 꿰뚫는 하나의 선율이 되는 순간이 있어요.</p>
                  <p className={styles.refAnswer}>다 같이 고개 끄덕이는 무색무취한 공감 말고, 각자의 뚜렷한 철학을 바탕으로 사유의 밀도를 높일 수 있는 자리, 그 부조화 속에서 이전에 없던 지적 조화를 발견하는 자리. 그게 레이지데이가 만들고 싶은 자리예요.</p>
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
