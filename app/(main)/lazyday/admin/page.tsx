"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import styles from "./admin.module.css"

// ── 상수 ────────────────────────────────────────────────────────
const START_HOUR    = 13
const END_HOUR      = 23
const SLOT_MIN      = 30
const SLOTS_PER_DAY = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN // 20
const DAYS_COUNT    = 7

type BlockEvent = {
  id: string
  title: string
  start: string
  end: string
}

// ── 유틸 ────────────────────────────────────────────────────────
function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function slotToTime(dayStart: Date, slotIdx: number): Date {
  const d = new Date(dayStart)
  d.setHours(START_HOUR + Math.floor((slotIdx * SLOT_MIN) / 60))
  d.setMinutes((slotIdx * SLOT_MIN) % 60)
  d.setSeconds(0, 0)
  return d
}

function timeLabel(slotIdx: number) {
  const totalMin = START_HOUR * 60 + slotIdx * SLOT_MIN
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function dayLabel(date: Date) {
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSlotBlocked(blocks: BlockEvent[], dayStart: Date, slotIdx: number) {
  const slotStart = slotToTime(dayStart, slotIdx).getTime()
  const slotEnd   = slotStart + SLOT_MIN * 60 * 1000
  return blocks.some((b) => {
    const bs = new Date(b.start).getTime()
    const be = new Date(b.end).getTime()
    return bs < slotEnd && be > slotStart
  })
}

function getBlockAtSlot(blocks: BlockEvent[], dayStart: Date, slotIdx: number): BlockEvent | null {
  const slotStart = slotToTime(dayStart, slotIdx).getTime()
  const slotEnd   = slotStart + SLOT_MIN * 60 * 1000
  return blocks.find((b) => {
    const bs = new Date(b.start).getTime()
    const be = new Date(b.end).getTime()
    return bs < slotEnd && be > slotStart
  }) ?? null
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [blocks, setBlocks]         = useState<BlockEvent[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState("")

  // 드래그 상태
  const dragStartRef = useRef<{ day: number; slot: number } | null>(null)
  const [dragRange, setDragRange] = useState<{ day: number; minSlot: number; maxSlot: number } | null>(null)
  const isDragging = useRef(false)

  // 이번 주 첫 날 (오늘 기준 + weekOffset * 7)
  const weekStart = (() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    today.setDate(today.getDate() + weekOffset * 7)
    return today
  })()

  const days = Array.from({ length: DAYS_COUNT }, (_, i) => addDays(weekStart, i))

  // ── 데이터 로드 ────────────────────────────────────────────────
  const loadBlocks = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/lazyday/admin/blocks")
      if (res.status === 401) { router.replace("/lazyday/admin/login"); return }
      const data = await res.json()
      setBlocks(data.bookedSlots || [])
    } catch {
      showToast("불러오기 실패")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadBlocks() }, [loadBlocks])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 2500)
  }

  // ── 블록 삭제 ──────────────────────────────────────────────────
  async function deleteBlock(id: string) {
    setSaving(true)
    try {
      await fetch("/api/lazyday/admin/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      await loadBlocks()
      showToast("삭제했습니다.")
    } catch {
      showToast("삭제 실패")
    } finally {
      setSaving(false)
    }
  }

  // ── 블록 추가 (드래그 완료 시) ──────────────────────────────────
  async function addBlock(day: number, minSlot: number, maxSlot: number) {
    const dayStart  = startOfDay(days[day])
    const blockStart = slotToTime(dayStart, minSlot)
    const blockEnd   = slotToTime(dayStart, maxSlot + 1)

    setSaving(true)
    try {
      await fetch("/api/lazyday/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: blockStart.toISOString(),
          end:   blockEnd.toISOString(),
          title: "차단",
        }),
      })
      await loadBlocks()
      showToast("차단 시간이 추가되었습니다.")
    } catch {
      showToast("추가 실패")
    } finally {
      setSaving(false)
    }
  }

  // ── 드래그 핸들러 ──────────────────────────────────────────────
  function onMouseDown(day: number, slot: number) {
    // 이미 차단된 슬롯 클릭 → 삭제
    const block = getBlockAtSlot(blocks, startOfDay(days[day]), slot)
    if (block) {
      if (confirm(`"${block.title}" 차단을 삭제할까요?`)) deleteBlock(block.id)
      return
    }
    isDragging.current = true
    dragStartRef.current = { day, slot }
    setDragRange({ day, minSlot: slot, maxSlot: slot })
  }

  function onMouseEnter(day: number, slot: number) {
    if (!isDragging.current || !dragStartRef.current) return
    if (dragStartRef.current.day !== day) return
    const start = dragStartRef.current.slot
    setDragRange({ day, minSlot: Math.min(start, slot), maxSlot: Math.max(start, slot) })
  }

  function onMouseUp(day: number, slot: number) {
    if (!isDragging.current || !dragRange) return
    isDragging.current = false
    const { minSlot, maxSlot } = dragRange
    setDragRange(null)
    dragStartRef.current = null
    addBlock(day, minSlot, maxSlot)
  }

  function onMouseLeaveGrid() {
    if (isDragging.current && dragRange) {
      isDragging.current = false
      const { day, minSlot, maxSlot } = dragRange
      setDragRange(null)
      dragStartRef.current = null
      addBlock(day, minSlot, maxSlot)
    }
  }

  // ── 로그아웃 ──────────────────────────────────────────────────
  async function logout() {
    await fetch("/api/lazyday/admin/auth", { method: "DELETE" })
    router.replace("/lazyday/admin/login")
  }

  // ── 렌더 ──────────────────────────────────────────────────────
  return (
    <main className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <h1 className={styles.title}>인터뷰 차단 시간 관리</h1>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={loadBlocks} title="새로고침">↺</button>
          <button className={styles.logoutBtn} onClick={logout}>로그아웃</button>
        </div>
      </header>

      {/* 안내 */}
      <p className={styles.guide}>
        빈 슬롯을 <strong>드래그</strong>해 차단 시간 추가 · 차단된 슬롯을 <strong>클릭</strong>해 삭제
      </p>

      {/* 주 이동 */}
      <div className={styles.weekNav}>
        <button className={styles.navBtn} onClick={() => setWeekOffset((w) => w - 1)}>← 이전 주</button>
        <span className={styles.weekLabel}>
          {`${weekStart.getMonth() + 1}/${weekStart.getDate()}`} –{" "}
          {`${days[6].getMonth() + 1}/${days[6].getDate()}`}
        </span>
        <button className={styles.navBtn} onClick={() => setWeekOffset((w) => w + 1)}>다음 주 →</button>
      </div>

      {/* 캘린더 격자 */}
      {loading ? (
        <p className={styles.loadingText}>불러오는 중...</p>
      ) : (
        <div className={styles.gridWrapper} onMouseLeave={onMouseLeaveGrid}>
          <div className={styles.grid} style={{ gridTemplateColumns: `56px repeat(${DAYS_COUNT}, 1fr)` }}>
            {/* 헤더 행 */}
            <div className={styles.cornerCell} />
            {days.map((d, di) => (
              <div key={di} className={styles.dayHeader}>{dayLabel(d)}</div>
            ))}

            {/* 슬롯 행 */}
            {Array.from({ length: SLOTS_PER_DAY }, (_, si) => (
              <>
                <div key={`time-${si}`} className={styles.timeLabel}>{timeLabel(si)}</div>
                {days.map((d, di) => {
                  const dayStart = startOfDay(d)
                  const blocked  = isSlotBlocked(blocks, dayStart, si)
                  const inDrag   = dragRange?.day === di && si >= dragRange.minSlot && si <= dragRange.maxSlot
                  const block    = blocked ? getBlockAtSlot(blocks, dayStart, si) : null
                  const isInterview = block && !block.title.startsWith("[BLOCK]")

                  return (
                    <div
                      key={`slot-${di}-${si}`}
                      className={[
                        styles.slot,
                        blocked && !isInterview ? styles.slotBlocked : "",
                        isInterview ? styles.slotInterview : "",
                        inDrag ? styles.slotDragging : "",
                      ].filter(Boolean).join(" ")}
                      onMouseDown={() => onMouseDown(di, si)}
                      onMouseEnter={() => onMouseEnter(di, si)}
                      onMouseUp={() => onMouseUp(di, si)}
                      title={block?.title || ""}
                    />
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={styles.legendDotBlocked} /> 차단 (드래그 추가)</span>
        <span className={styles.legendItem}><span className={styles.legendDotInterview} /> 예약된 인터뷰</span>
        <span className={styles.legendItem}><span className={styles.legendDotDrag} /> 선택 중</span>
      </div>

      {/* 저장 중 오버레이 */}
      {saving && <div className={styles.savingOverlay}>저장 중...</div>}

      {/* 토스트 */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </main>
  )
}
