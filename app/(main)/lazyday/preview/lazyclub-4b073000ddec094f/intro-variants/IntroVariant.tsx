"use client"

/**
 * 세로 써클(C·L·U·B)을 레이지클럽 랜딩 입구로 — 어포던스 3안 비교 (임시 시안).
 * 실 랜딩(/coming-soon)은 건드리지 않는다. 캡션 문구는 넣지 않는다 (운영자).
 *
 *  A: 인트로 종료 직후 세로 써클이 3→5→3px 로 2회 스텝 점멸 (모션으로 알림)
 *  B: 세로 써클만 상시 5px — 가로 3px와의 굵기 위계로 알림 (모션 없음)
 *  C: 세로 써클만 주황(#f49938) — 색으로 알림 (모션 없음)
 *
 * 공통: 써클 박스 전체가 <a> 링크(레이지클럽 홈). 인트로가 끝난 5.0s부터 활성.
 * 데스크톱 hover에서 굵기 +2px, 키보드 포커스 아웃라인. 그 외 연출은 실 랜딩과 동일.
 */

import { useEffect, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { BASE, WorkroomShell } from "../Shell"
import styles from "./variant.module.css"

const WELCOME = [
  ["W", "E", "L", "X"],
  ["C", "O", "M", "E"],
  ["T", "O", "X", "X"],
  ["X", "X", "X", "X"],
]
const GRID = [
  ["C", "W", "E", "L"],
  ["L", "A", "Z", "Y"],
  ["U", "C", "O", "M"],
  ["B", "E", "T", "O"],
]
const HOT = new Set(["0-0", "1-0", "2-0", "3-0", "1-1", "1-2", "1-3"])

const PALETTE = ["#f49938", "#96ab9b", "#845d5e"]
const INK = "#1a1208"
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

const T = { WELCOME: 1000, FIX: 3000, CAP_LAZY: 3250, CAP_CLUB: 3500, END: 5000 }
const STEP = 60
const STEPS = 4

/* A안 점멸 시퀀스 — 인트로 종료 후 굵기(px)를 이 순서로 밟는다 (2회) */
const PULSE: [number, number][] = [
  [0, 5],
  [120, 3],
  [240, 5],
  [360, 3],
]

function rnd(seed: number, a: number, b: number) {
  let h = (seed ^ (a * 374761393) ^ (b * 668265263)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return h / 4294967296
}

function wipeStep(e: number, from: number) {
  if (e < from) return 0
  return Math.min(STEPS, Math.floor((e - from) / STEP) + 1)
}

type Cell = { ch: string; color: string }

function stateAt(raw: number, seed: number) {
  const e = Math.min(raw, T.END)
  const wordColor = PALETTE[Math.floor(rnd(seed, 4242, 1) * 3)]
  const cells: Cell[] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c
      if (e < T.WELCOME) {
        cells.push({ ch: WELCOME[r][c], color: INK })
        continue
      }
      const interval = 60 + rnd(seed, i, 999) * 80
      const tick = Math.floor((Math.min(e, T.FIX - 1) - T.WELCOME) / interval)
      if (e < T.FIX) {
        cells.push({
          ch: ALPHABET[Math.floor(rnd(seed, i, tick) * 26)],
          color: PALETTE[Math.floor(rnd(seed, i, tick + 7) * 3)],
        })
      } else {
        let color = PALETTE[Math.floor(rnd(seed, i, tick + 7) * 3)]
        if (HOT.has(`${r}-${c}`)) {
          color = wordColor
        } else if (color === wordColor) {
          const others = PALETTE.filter((p) => p !== wordColor)
          color = others[Math.floor(rnd(seed, i, 555) * 2)]
        }
        cells.push({ ch: GRID[r][c], color })
      }
    }
  }
  return {
    cells,
    lazyStep: wipeStep(e, T.CAP_LAZY),
    clubStep: wipeStep(e, T.CAP_CLUB),
    done: e >= T.END,
  }
}

const INITIAL: Cell[] = WELCOME.flat().map((ch) => ({ ch, color: INK }))

/* D안 — 인트로가 끝난 뒤 세로 열이 한 번 더 셔플되어 P·L·A·Y 로 착지한다.
   새 장치를 더하는 대신 이미 쓰던 셔플 문법을 그대로 재사용해 의미를 전달한다.
   2행(L)은 건드리지 않는다 — 가로 LAZY와 공유하는 칸이라 바꾸면 LAZY가 깨진다. */
const OPEN = ["P", "L", "A", "Y"]
const OPEN_DELAY = 600 // 인트로 종료 후 대기
const OPEN_SHUFFLE = 600 // 셔플 길이
const OPEN_TICK = 80 // 글자 교체 간격

export function IntroVariant({ variant }: { variant: "a" | "b" | "c" | "d" | "e" }) {
  const [elapsed, setElapsed] = useState(0)
  const [seed, setSeed] = useState<number | null>(null)
  const [chromeEarly, setChromeEarly] = useState(false)
  const [pulse, setPulse] = useState(0) // A안: 점멸 중 굵기(px), 0이면 기본값
  const [openPhase, setOpenPhase] = useState(0) // D안: 0 대기 · 1 셔플 · 2 OPEN 착지
  const [openTick, setOpenTick] = useState(0) // D안: 셔플 틱

  useEffect(() => {
    const s = Math.floor(Math.random() * 2147483647) || 1
    setSeed(s)

    const q = new URLSearchParams(window.location.search)
    const t = Number(q.get("t"))
    if (q.get("t") && Number.isFinite(t)) {
      setElapsed(t)
      return
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setElapsed(T.END)
      return
    }

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const e = now - start
      if (e >= T.END) {
        setElapsed(T.END)
        removeListeners()
        return
      }
      setElapsed(e)
      raf = requestAnimationFrame(tick)
    }
    const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const
    const onInput = () => setChromeEarly(true)
    const removeListeners = () => EVENTS.forEach((ev) => window.removeEventListener(ev, onInput))
    EVENTS.forEach((ev) => window.addEventListener(ev, onInput, { passive: true }))
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      removeListeners()
    }
  }, [])

  const s = seed === null ? null : stateAt(elapsed, seed)
  const done = !!s?.done

  // A안 — 인트로가 끝나는 순간 2회 점멸. 트랜지션 없이 굵기 값만 갈아끼운다
  useEffect(() => {
    if (variant !== "a" || !done) return
    const timers = PULSE.map(([at, w]) => setTimeout(() => setPulse(w), at))
    timers.push(setTimeout(() => setPulse(0), PULSE[PULSE.length - 1][0] + 120))
    return () => timers.forEach(clearTimeout)
  }, [variant, done])

  // D안 — 종료 0.6s 뒤 세로 열만 다시 셔플 → OPEN 착지
  useEffect(() => {
    if (variant !== "d" || !done) return
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setOpenPhase(1), OPEN_DELAY))
    const iv = setInterval(() => setOpenTick((n) => n + 1), OPEN_TICK)
    timers.push(
      setTimeout(() => {
        setOpenPhase(2)
        clearInterval(iv)
      }, OPEN_DELAY + OPEN_SHUFFLE)
    )
    return () => {
      timers.forEach(clearTimeout)
      clearInterval(iv)
    }
  }, [variant, done])

  const rowClip = `inset(0 ${(STEPS - (s?.lazyStep ?? 0)) * 25}% 0 0)`
  const colClip = `inset(0 0 ${(STEPS - (s?.clubStep ?? 0)) * 25}% 0)`
  let cells = s?.cells ?? INITIAL
  // D안 — 1열만 교체하되 2행(L)은 유지. 색은 단색 그대로
  if (variant === "d" && openPhase > 0) {
    cells = cells.map((cell, i) => {
      if (i % 4 !== 0 || i === 4) return cell
      const row = i / 4
      const ch =
        openPhase === 2
          ? OPEN[row]
          : ALPHABET[Math.floor(rnd(seed ?? 1, i, openTick + row * 31) * 26)]
      return { ...cell, ch }
    })
  }

  // 세로 써클 — 안별 기본 표현
  const colClass = `${styles.capsule} ${styles.capCol} ${
    variant === "b" ? styles.capThick : variant === "c" ? styles.capAccent : ""
  }`
  const colStyle: React.CSSProperties = { clipPath: colClip }
  if (pulse) colStyle.borderWidth = `${pulse}px`

  const capsuleCol = !!s?.clubStep && <div className={colClass} style={colStyle} aria-hidden />

  const gridInner = (
    <>
      {cells.map((cell, i) => (
        <span key={i} className={styles.cell} style={{ color: cell.color }} aria-hidden>
          {cell.ch}
        </span>
      ))}
      {!!s?.lazyStep && (
        <div className={`${styles.capsule} ${styles.capRow}`} style={{ clipPath: rowClip }} aria-hidden />
      )}
      {done && variant !== "e" ? (
        <LazydayLink href={BASE} className={styles.enter} aria-label="레이지클럽 홈으로">
          {capsuleCol}
        </LazydayLink>
      ) : (
        capsuleCol
      )}
    </>
  )

  // E안 — 표시 없음. 인트로가 끝나면 그리드 전체가 링크가 되고, 누를 때만 반응한다
  if (variant === "e") {
    return (
      <WorkroomShell paper="#f8f3ef" chromeHidden={!done && !chromeEarly}>
        <main className={styles.main}>
          <div className={styles.stage}>
            {done ? (
              <LazydayLink href={BASE} className={`${styles.grid} ${styles.gridLink}`} aria-label="레이지클럽 홈으로">
                {gridInner}
              </LazydayLink>
            ) : (
              <div className={styles.grid} aria-label="LAZY CLUB">
                {gridInner}
              </div>
            )}
          </div>
        </main>
      </WorkroomShell>
    )
  }

  // A~D안 — 세로 써클 자체가 링크
  return (
    <WorkroomShell paper="#f8f3ef" chromeHidden={!done && !chromeEarly}>
      <main className={styles.main}>
        <div className={styles.stage}>
          <div className={styles.grid} aria-label="LAZY CLUB">
            {gridInner}
          </div>
        </div>
      </main>
    </WorkroomShell>
  )
}
