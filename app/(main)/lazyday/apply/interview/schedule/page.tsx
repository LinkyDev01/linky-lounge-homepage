"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { KAKAO_CHAT_URL, KAKAO_SUBMIT_GUIDE, KAKAO_SUBMIT_LABEL, reportClientError, copyText } from "../../../support"
import { readSim, simSubmit, simSlots, type SimMode } from "../../../sim"
import { SimBanner } from "../../../SimBanner"
import { trackStandard } from "@/lib/meta-pixel"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import { SEASON } from "../../../season-config"
import { JourneyStepper } from "../../../JourneyStepper"
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
  const [failedText, setFailedText] = useState("")
  const [failCopied, setFailCopied] = useState(false)
  async function copyFailed() {
    if (await copyText(failedText)) {
      setFailCopied(true)
      setTimeout(() => setFailCopied(false), 2500)
    }
  }
  const [sim, setSim] = useState<SimMode | null>(null)
  const [simReady, setSimReady] = useState(false)
  useEffect(() => { setSim(readSim()); setSimReady(true) }, [])
  // 예약 현황 조회 실패 — 캘린더가 안 뜨는 상황을 사용자에게 알리고 문의로 연결 (2026-08-06)
  const [slotsFailed, setSlotsFailed] = useState(false)

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
    // sim 확정 전에는 호출하지 않는다 — 테스트 모드에서 실제 서버를 치면 안 된다
    if (!simReady) return
    // 테스트 모드면 서버 대신 시뮬레이션 응답을 쓴다 (2026-08-06)
    if (sim) {
      simSlots(sim)
        .then((d: { bookedSlots?: { start: string; end: string }[] }) => setBookedEvents(
          (d.bookedSlots ?? []).map((s) => ({ start: s.start, end: s.end }))
        ))
        .catch(() => setSlotsFailed(true))
        .finally(() => setSlotsLoading(false))
      return
    }
    // 예약 현황이 실제로 도착할 때까지 로딩을 유지하며 재시도한다 (2026-08-12).
    // 실패를 빈 배열로 그리면 마감 슬롯이 전부 빈 것처럼 보여 중복 예약이 들어온다.
    // GAS 콜드 스타트가 80초까지 관측된 적 있어(lib/gas.ts) 재시도 자체가 워밍업을 겸한다.
    let cancelled = false
    ;(async () => {
      const MAX_TRIES = 8
      for (let i = 0; i < MAX_TRIES; i++) {
        try {
          const r = await fetch("/api/lazyday/interview/slots", { cache: "no-store" })
          const d = (await r.json()) as { success?: boolean; bookedSlots?: { start: string; end: string }[] }
          if (r.ok && d.success && Array.isArray(d.bookedSlots)) {
            if (cancelled) return
            setBookedEvents(d.bookedSlots.map((s) => ({ start: s.start, end: s.end })))
            setSlotsLoading(false)
            return
          }
        } catch {}
        if (cancelled) return
        if (i < MAX_TRIES - 1) await new Promise((res) => setTimeout(res, 3_000 + i * 1_000))
      }
      if (cancelled) return
      setSlotsFailed(true)
      reportClientError("schedule_slots", "예약 가능 시간 조회 실패")
      setSlotsLoading(false)
    })()
    return () => { cancelled = true }
  }, [sim, simReady])

  // ── 예약 현황 갱신 (운영자 2026-08-18 "예약 완료된 시간 실시간 반영 안 되는 것 같아")
  //
  // 위 effect 는 **진입 시 한 번만** 조회한다. 그래서 페이지를 열어둔 채 시간이 지나면
  // 목록이 그때로 멈춰 있고, 그 사이 남이 잡은 시간이 계속 비어 보인다.
  // (예약 자체는 GAS 캘린더 중복 검사가 막아주므로 이중 예약이 되지는 않지만,
  //  끝까지 입력하고 나서 "이미 예약된 시간입니다"로 튕기는 최악의 순간에 알게 된다.)
  //
  // → 탭으로 돌아왔을 때와 열어둔 동안 주기적으로 다시 읽는다.
  //   서버 캐시가 짧게 걸려 있어(slots route) 여러 탭이 열려도 GAS 호출은 뭉쳐진다.
  //   ⚠ 첫 조회가 끝나기 전(slotsLoading)·시뮬레이션·완료 화면에서는 돌지 않는다.
  const refreshSlots = useCallback(async () => {
    if (sim || !simReady) return
    try {
      const r = await fetch("/api/lazyday/interview/slots", { cache: "no-store" })
      const d = (await r.json()) as { success?: boolean; bookedSlots?: { start: string; end: string }[] }
      if (r.ok && d.success && Array.isArray(d.bookedSlots)) {
        setBookedEvents(d.bookedSlots.map((x) => ({ start: x.start, end: x.end })))
        setSlotsFailed(false)
      }
    } catch {
      /* 갱신 실패는 조용히 넘긴다 — 이미 그려진 목록을 지우면 더 나쁘다 */
    }
  }, [sim, simReady])

  useEffect(() => {
    if (sim || !simReady || slotsLoading || submitted) return
    const onVisible = () => { if (document.visibilityState === "visible") refreshSlots() }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", refreshSlots)
    const timer = setInterval(refreshSlots, 45_000)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", refreshSlots)
      clearInterval(timer)
    }
  }, [sim, simReady, slotsLoading, submitted, refreshSlots])

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
    // 조회 실패 시 자동 선택하지 않는다 — '모든 시간이 비어 있는 것처럼' 보이면
    // 이미 예약된 시간에 중복 예약이 들어온다 (2026-08-06)
    if (slotsFailed) return
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
  }, [slotsLoading, slotsFailed, bookedKeys, nowUTCMs])

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

  /** 예약 창(오늘~DAYS_AHEAD일) 안에 실제로 잡을 수 있는 날이 하나라도 있는지 (2026-08-05).
   *  availableMap은 보고 있는 달 전체(예약 창 밖 먼 날짜 포함)라 0이 되지 않아
   *  '전부 마감' 판정에 쓸 수 없다. */
  const bookableDayCount = useMemo(() => {
    const kst = new Date(Date.now() + 9 * 3600_000)
    let n = 0
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + i))
      const slots = slotsForDay(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCDay(), nowUTCMs, bookedKeys)
      if (slots.some(s => !s.booked)) n++
    }
    return n
  }, [nowUTCMs, bookedKeys])

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

  /** 예약이 실패했을 때 카카오톡으로 대신 보낼 수 있게 내용을 보관 (운영자 지시 2026-08-06) */
  function keepFailed(name?: string, phone?: string) {
    const when = selectedSlot
      ? `${selectedDateLabel} ${selectedSlot.label}`
      : "-"
    setFailedText(
      [
        "[레이지데이 북클럽 전화 인터뷰 예약]",
        `희망 일시: ${when}`,
        `이름: ${name || "-"}`,
        `연락처: ${phone || "-"}`,
      ].join("\n"),
    )
    reportClientError("schedule_book", "전화 인터뷰 예약 실패")
  }

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
      if (sim) {
        await simSubmit(sim) // 테스트 모드: 실제 예약 없음
        setConfirmed(selectedSlot)
        setSubmitted(true)
        setSubmitting(false)
        window.scrollTo(0, 0)
        return
      }
      const res = await fetch("/api/lazyday/interview/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, slotStart: selectedSlot.startISO, slotEnd: selectedSlot.endISO }),
      })
      const data = await res.json()
      if (data.success) {
        // 이 번호가 이미 인터뷰를 확정했으면(시간 변경 재예약, 또는 서면 이력)
        // GAS 가 duplicate=true 로 알려준다 — 전환을 다시 쏘지 않는다.
        // 운영자 2026-08-18: "전화/서면 모두 같은 거고 방식만 다른 거지."
        const isRebooking = !!data.duplicate
        // 표준 전환 — 서면 제출과 **같은 지점**이다 (운영자 2026-08-18 "2. written 제출 =
        // 3. schedule 예약 제출 동일해. 그러므로 동일하게 붙여야해").
        // 인터뷰 방식만 다를 뿐 둘 다 '인터뷰 확정'이 마지막 단계라, 전화를 고른 사람의
        // 전환이 통째로 누락되고 있었다.
        //  · GAS 가 같은 슬롯 재예약을 거부하므로(handlePhoneBooking 캘린더 중복 검사)
        //    연타로 두 번 잡히지 않는다 — 두 번째는 success:false 로 떨어져 여기 못 온다.
        //  ⚠ 시뮬레이션은 위에서 먼저 return 하므로 여기 도달하지 않는다.
        if (!isRebooking) {
          trackStandard(
            "CompleteRegistration",
            {
              content_name: "lazyday_bookclub_4",
              status: true,
              value: 150000, // season-config 4기 참가비와 일치 (서면 쪽과 같은 값)
              currency: "KRW",
            },
            { phone }, // 서버 미러(전환 API) 전용 — 픽셀 파라미터는 위 그대로 불변
          )
        }
        setConfirmed(selectedSlot)
        setSubmitted(true)
        window.scrollTo(0, 0)
      } else {
        setErrors({ _form: data.error ?? "일시적인 오류로 예약이 완료되지 않았어요. 잠시 후 다시 시도해주세요." })
        keepFailed(name, phone)
        reportClientError("schedule_book", String(data.error ?? "예약 실패"))
        // 그 사이 남이 먼저 잡았을 수 있다 — 목록을 바로 새로 읽어 그 시간이
        // '마감'으로 보이게 한다. 안 하면 같은 시간을 계속 다시 누르게 된다.
        refreshSlots()
      }
    } catch {
      setErrors({ _form: "연결이 잠시 불안정했어요. 선택하신 시간은 그대로니, 잠시 후 다시 시도해주세요." })
      keepFailed(name, phone)
      reportClientError("schedule_book", "네트워크 오류")
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
        <SimBanner mode={sim} />
        <div className={styles.successInner}>
          <BlurReveal duration={1.0} blur={10} fromScale={1.03}>
            <img src="/linky-lounge/book-club/lazyday_logo.png" alt="레이지데이" className={styles.successMark} />
          </BlurReveal>
          <FadeUp delay={0.15}><h1 className={styles.successTitle}>인터뷰가 예약되었습니다.</h1></FadeUp>
          <FadeUp delay={0.3}><p className={styles.successSlot}>{label}</p></FadeUp>
          <FadeUp delay={0.45}>
            <p className={styles.successBody}>
              인터뷰는 <span className={styles.successAccent}>전화로 약 20분간</span> 진행됩니다.<br />
              선택하신 시간에 맞추어 연락드리겠습니다.
            </p>
          </FadeUp>
          <FadeUp delay={0.45}><p className={styles.successCloser}>레이지데이 북클럽에서 곧 만나요.</p></FadeUp>
          <FadeUp delay={0.6}>
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
      <SimBanner mode={sim} />
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
        {/* 기수 안내 — 멤버십 가격은 2026-08-25 부터 이 박스에서만 노출한다
            (운영자 지시로 apply 페이지에서 이관. 랜딩·apply 는 비노출 유지,
            서면 인터뷰 쪽 같은 박스에는 넣지 않는다). 값은 SEASON.price 단일 출처. */}
          <div className={styles.refBeigeWrap}>
            <p className={styles.ref0Title}>{SEASON.name} 안내</p>
            <div className={styles.ref0Grid}>
              <span className={styles.ref0Key}>정규모임</span>
              <span className={styles.ref0Val}>{SEASON.regularNote}</span>
              <span className={styles.ref0Key}>자유모임</span>
              <span className={styles.ref0Val}>{SEASON.freeNote}</span>
              <span className={styles.ref0Key}>멤버십 가격</span>
              <span className={`${styles.ref0Val} ${styles.priceNow}`}>{SEASON.price}</span>
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
              ) : slotsFailed ? (
                /* 조회 실패 상태에서 달력을 그리면 마감 시간이 전부 빈 것처럼 보인다 —
                   날짜 선택을 막고 우측 안내(카카오채널 문의)로 유도 (2026-08-12) */
                <p className={styles.timeHint}>예약 현황을 불러오지 못해 날짜 선택을 잠시 닫아두었어요.</p>
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

              {/* 예약 가능한 날짜가 하나도 없으면 그 사실을 알린다 — 안내가 없으면
                  달력이 전부 회색인 채 멈춘 것처럼 보인다 (2026-08-05 감사에서 발견) */}
              {slotsFailed && !slotsLoading ? (
                <p className={styles.timeHint}>
                  예약 가능한 시간을 불러오지 못했어요.
                  <br />
                  잠시 후 새로고침해 주세요. 계속 안 되면 아래로 문의해주세요.
                  <br />
                  <a
                    href={KAKAO_CHAT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.supportLink}
                    onClick={() => reportClientError("schedule_kakao", "슬롯 조회 실패 후 문의")}
                  >
                    카카오채널로 문의하기
                  </a>
                </p>
              ) : selectedDate === null ? (
                bookableDayCount === 0 && !slotsLoading ? (
                  <p className={styles.timeHint}>
                    지금 예약할 수 있는 시간이 모두 찼어요.
                    <br />
                    카카오채널로 문의해 주시면 일정을 조율해 드릴게요.
                    <br />
                    <a
                      href={KAKAO_CHAT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.supportLink}
                      onClick={() => reportClientError("schedule_kakao", "전부 마감 후 문의")}
                    >
                      카카오채널로 문의하기
                    </a>
                  </p>
                ) : (
                  <p className={styles.timeHint}>캘린더에서 날짜를 먼저 선택해주세요.</p>
                )
              ) : (
                <>
                  <p className={styles.selectedDateLabel}>{selectedDateLabel}</p>
                  <div className={styles.slotList}>
                    {daySlots.length === 0 ? (
                      <p className={styles.noSlots}>이 날은 가능한 시간이 없어요. 다른 날짜를 선택해주세요.</p>
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
                {errors._form && (
                  <>
                    <p className={styles.formErr}>{errors._form}</p>
                    {/* 막혔을 때 빠져나갈 길 — 복사해서 카카오톡으로 전달 → 순차 확인 후 연락 (운영자 지시 2026-08-06) */}
                    <p className={styles.rescueGuide}>{KAKAO_SUBMIT_GUIDE}</p>
                    <button type="button" className={styles.rescueCopyBtn} onClick={copyFailed}>
                      {failCopied ? "복사됐어요" : "예약 내용 복사"}
                    </button>
                    <a
                      href={KAKAO_CHAT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.supportLink}
                      onClick={() => reportClientError("schedule_kakao", "예약 실패 후 카카오톡 제출")}
                    >
                      {KAKAO_SUBMIT_LABEL}
                    </a>
                  </>
                )}
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
                <span className={styles.refQuestion}>(참고) 불균형의 균형 (Dissonant Harmony)</span>
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
