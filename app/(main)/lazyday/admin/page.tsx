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

type BlockEvent = { id: string; title: string; start: string; end: string }
type SlotKey    = `${number}-${number}` // `${day}-${slot}`
type Filter     = "all" | "block" | "interview"
type Modal      = { type: "delete"; block: BlockEvent } | { type: "applyPending"; count: number } | null

// ── 유틸 ────────────────────────────────────────────────────────
function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function slotToTime(dayStart: Date, slotIdx: number): Date {
  const d = new Date(dayStart)
  d.setHours(START_HOUR + Math.floor((slotIdx * SLOT_MIN) / 60))
  d.setMinutes((slotIdx * SLOT_MIN) % 60)
  d.setSeconds(0, 0); return d
}
function timeLabel(slotIdx: number) {
  const totalMin = START_HOUR * 60 + slotIdx * SLOT_MIN
  const h = Math.floor(totalMin / 60), m = totalMin % 60
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`
}
function dayLabel(date: Date) {
  const days = ["일","월","화","수","목","금","토"]
  return `${date.getMonth()+1}/${date.getDate()} (${days[date.getDay()]})`
}
function startOfDay(date: Date) {
  const d = new Date(date); d.setHours(0,0,0,0); return d
}
function slotKey(day: number, slot: number): SlotKey { return `${day}-${slot}` }

function isSlotBlocked(blocks: BlockEvent[], dayStart: Date, slotIdx: number) {
  const s = slotToTime(dayStart, slotIdx).getTime()
  const e = s + SLOT_MIN * 60 * 1000
  return blocks.some(b => new Date(b.start).getTime() < e && new Date(b.end).getTime() > s)
}
function getBlockAtSlot(blocks: BlockEvent[], dayStart: Date, slotIdx: number): BlockEvent | null {
  const s = slotToTime(dayStart, slotIdx).getTime()
  const e = s + SLOT_MIN * 60 * 1000
  return blocks.find(b => new Date(b.start).getTime() < e && new Date(b.end).getTime() > s) ?? null
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [blocks, setBlocks]         = useState<BlockEvent[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState("")
  const [filter, setFilter]         = useState<Filter>("all")
  const [modal, setModal]           = useState<Modal>(null)

  // 멀티체크 (pending 선택)
  const [pending, setPending] = useState<Set<SlotKey>>(new Set())

  // 드래그 상태
  const dragStartRef = useRef<{ day: number; slot: number } | null>(null)
  const [dragRange, setDragRange] = useState<{ day: number; minSlot: number; maxSlot: number } | null>(null)
  const isDragging = useRef(false)

  // 이번 주 첫 날
  const weekStart = (() => {
    const today = new Date(); today.setHours(0,0,0,0)
    today.setDate(today.getDate() + weekOffset * 7); return today
  })()
  const days = Array.from({ length: DAYS_COUNT }, (_, i) => addDays(weekStart, i))

  // ── 데이터 로드 ──────────────────────────────────────────────
  const loadBlocks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/lazyday/admin/blocks")
      if (res.status === 401) { router.replace("/lazyday/admin/login"); return }
      const data = await res.json()
      setBlocks(data.bookedSlots || [])
    } catch { showToast("불러오기 실패") }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => { loadBlocks() }, [loadBlocks])

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(""), 2500)
  }

  // ── 필터된 블록 ──────────────────────────────────────────────
  function visibleBlocks(): BlockEvent[] {
    if (filter === "all") return blocks
    if (filter === "block") return blocks.filter(b => b.title?.startsWith("[BLOCK]"))
    return blocks.filter(b => b.title && !b.title.startsWith("[BLOCK]"))
  }

  // ── 블록 삭제 ────────────────────────────────────────────────
  async function deleteBlock(id: string) {
    setSaving(true)
    try {
      await fetch("/api/lazyday/admin/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      await loadBlocks(); showToast("차단 삭제됨")
    } catch { showToast("삭제 실패") }
    finally { setSaving(false); setModal(null) }
  }

  // ── pending → 일괄 차단 ──────────────────────────────────────
  async function applyPending() {
    setModal(null)
    setSaving(true)
    // pending을 연속 구간으로 합쳐서 전송
    const grouped = new Map<number, number[]>()
    pending.forEach(key => {
      const [d, s] = key.split("-").map(Number)
      if (!grouped.has(d)) grouped.set(d, [])
      grouped.get(d)!.push(s)
    })
    try {
      const promises: Promise<void>[] = []
      grouped.forEach((slots, day) => {
        slots.sort((a,b) => a-b)
        // 연속 구간으로 병합
        const ranges: {min:number;max:number}[] = []
        slots.forEach(s => {
          if (ranges.length && s === ranges[ranges.length-1].max + 1) {
            ranges[ranges.length-1].max = s
          } else { ranges.push({ min: s, max: s }) }
        })
        ranges.forEach(({ min, max }) => {
          const dayStart  = startOfDay(days[day])
          const blockStart = slotToTime(dayStart, min)
          const blockEnd   = slotToTime(dayStart, max + 1)
          promises.push(
            fetch("/api/lazyday/admin/blocks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ start: blockStart.toISOString(), end: blockEnd.toISOString(), title: "차단" }),
            }).then(() => {})
          )
        })
      })
      await Promise.all(promises)
      setPending(new Set())
      await loadBlocks()
      showToast(`${pending.size}개 슬롯 차단 완료`)
    } catch { showToast("차단 추가 실패") }
    finally { setSaving(false) }
  }

  // ── 슬롯 클릭 ────────────────────────────────────────────────
  function onSlotClick(day: number, slot: number) {
    const vb = visibleBlocks()
    const block = getBlockAtSlot(vb, startOfDay(days[day]), slot)
    if (block) {
      if (block.title?.startsWith("[BLOCK]")) {
        setModal({ type: "delete", block })
      }
      return
    }
    const key = slotKey(day, slot)
    setPending(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // ── 드래그 ──────────────────────────────────────────────────
  function onMouseDown(day: number, slot: number) {
    const vb = visibleBlocks()
    const block = getBlockAtSlot(vb, startOfDay(days[day]), slot)
    if (block) {
      if (block.title?.startsWith("[BLOCK]")) setModal({ type: "delete", block })
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
  function onMouseUp(day: number, _slot: number) {
    if (!isDragging.current || !dragRange) return
    isDragging.current = false
    const { minSlot, maxSlot } = dragRange
    setDragRange(null); dragStartRef.current = null
    // 드래그 범위를 pending에 추가
    if (minSlot === maxSlot) {
      // 단순 클릭으로 처리
      onSlotClick(day, minSlot)
      return
    }
    setPending(prev => {
      const next = new Set(prev)
      for (let s = minSlot; s <= maxSlot; s++) {
        const vb = visibleBlocks()
        const bl = getBlockAtSlot(vb, startOfDay(days[day]), s)
        if (!bl) next.add(slotKey(day, s))
      }
      return next
    })
  }
  function onMouseLeaveGrid() {
    if (isDragging.current && dragRange) {
      isDragging.current = false
      const { day, minSlot, maxSlot } = dragRange
      setDragRange(null); dragStartRef.current = null
      setPending(prev => {
        const next = new Set(prev)
        for (let s = minSlot; s <= maxSlot; s++) {
          const vb = visibleBlocks()
          const bl = getBlockAtSlot(vb, startOfDay(days[day]), s)
          if (!bl) next.add(slotKey(day, s))
        }
        return next
      })
    }
  }

  // ── 로그아웃 ────────────────────────────────────────────────
  async function logout() {
    await fetch("/api/lazyday/admin/auth", { method: "DELETE" })
    router.replace("/lazyday/admin/login")
  }

  const vb = visibleBlocks()

  return (
    <main className={styles.page}>
      <div className={styles.container}>

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
          빈 슬롯을 <strong>클릭 또는 드래그</strong>해 선택 → 하단 확인 바에서 차단 적용 &middot; 주황 슬롯 클릭 시 삭제
        </p>

        {/* 툴바 */}
        <div className={styles.toolbar}>
          <div className={styles.weekNav}>
            <button className={styles.navBtn} onClick={() => setWeekOffset(w => w-1)}>← 이전 주</button>
            <span className={styles.weekLabel}>
              {`${weekStart.getMonth()+1}/${weekStart.getDate()}`} – {`${days[6].getMonth()+1}/${days[6].getDate()}`}
            </span>
            <button className={styles.navBtn} onClick={() => setWeekOffset(w => w+1)}>다음 주 →</button>
          </div>

          {/* 캘린더 필터 */}
          <div className={styles.filters}>
            {([
              { key: "all",       label: "전체",    color: "#8a6a50" },
              { key: "block",     label: "차단",    color: "#d2691e" },
              { key: "interview", label: "예약 인터뷰", color: "#4a7fa5" },
            ] as const).map(({ key, label, color }) => (
              <button
                key={key}
                className={[styles.filterBtn, filter === key ? styles.filterBtnActive : ""].join(" ")}
                onClick={() => setFilter(key)}
              >
                <span className={styles.filterDot} style={{ background: filter === key ? "#fff" : color }} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 캘린더 패널 */}
        <div className={styles.panel}>
          {loading ? (
            <div className={styles.loadingWrap}>
              <span className={styles.dot}/><span className={styles.dot}/><span className={styles.dot}/>
            </div>
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
                      const dayStart  = startOfDay(d)
                      const block     = getBlockAtSlot(vb, dayStart, si)
                      const blocked   = !!block
                      const isInterview = block && !block.title?.startsWith("[BLOCK]")
                      const isBlock     = block && block.title?.startsWith("[BLOCK]")
                      const isPending   = pending.has(slotKey(di, si))
                      const inDrag      = dragRange?.day === di && si >= dragRange.minSlot && si <= dragRange.maxSlot

                      return (
                        <div
                          key={`slot-${di}-${si}`}
                          className={[
                            styles.slot,
                            isBlock     ? styles.slotBlocked   : "",
                            isInterview ? styles.slotInterview  : "",
                            isPending   ? styles.slotPending    : "",
                            inDrag      ? styles.slotDragging   : "",
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
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#d2691e" }} /> 차단됨
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#4a7fa5" }} /> 예약된 인터뷰
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "rgba(210,105,30,0.25)", outline: "1.5px solid #d2691e" }} /> 선택 중
            </span>
          </div>
        </div>

      </div>

      {/* ── 확인 바 (pending 있을 때) ── */}
      {pending.size > 0 && (
        <div className={styles.confirmBar}>
          <span className={styles.confirmBarText}>
            <span className={styles.confirmBarAccent}>{pending.size}개</span> 슬롯 선택됨
          </span>
          <button className={styles.confirmCancel} onClick={() => setPending(new Set())}>취소</button>
          <button className={styles.confirmApply} onClick={() => setModal({ type: "applyPending", count: pending.size })}>
            차단 적용
          </button>
        </div>
      )}

      {/* ── 모달 ── */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {modal.type === "delete" && (
              <>
                <p className={styles.modalTitle}>차단 시간을 삭제할까요?</p>
                <p className={styles.modalBody}>
                  선택한 차단 슬롯을 삭제하면 해당 시간에 인터뷰 예약이 가능해집니다.
                </p>
                <div className={styles.modalActions}>
                  <button className={styles.modalCancel} onClick={() => setModal(null)}>취소</button>
                  <button className={styles.modalConfirmDanger} onClick={() => deleteBlock(modal.block.id)}>삭제</button>
                </div>
              </>
            )}
            {modal.type === "applyPending" && (
              <>
                <p className={styles.modalTitle}>차단 시간을 추가할까요?</p>
                <p className={styles.modalBody}>
                  선택한 <strong>{modal.count}개</strong> 슬롯을 차단하면 해당 시간에 인터뷰 예약이 불가능해집니다.
                </p>
                <div className={styles.modalActions}>
                  <button className={styles.modalCancel} onClick={() => setModal(null)}>취소</button>
                  <button className={styles.modalConfirm} onClick={applyPending}>차단 적용</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 저장 중 오버레이 */}
      {saving && (
        <div className={styles.savingOverlay}>
          <span className={styles.dot}/><span className={styles.dot}/><span className={styles.dot}/>
        </div>
      )}

      {/* 토스트 */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </main>
  )
}
