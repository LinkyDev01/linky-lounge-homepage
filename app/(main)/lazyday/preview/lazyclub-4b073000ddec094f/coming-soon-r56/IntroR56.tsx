"use client"

/**
 * 라운드 56 시안 (임시 검토용) — 실 랜딩(/coming-soon)은 건드리지 않는다.
 *
 * 라운드 55 확정본에서 두 가지만 다르다:
 *  ① 빙고 써클을 **4스텝 와이프**로 채운다 (가로 = 왼→오, 세로 = 위→아래,
 *     스텝 간격 60ms, 총 0.24s). 펜 드로잉(연속 이징)이 아니라 이산 스텝 —
 *     셔플·고정·크롬 노출이 전부 툭툭 끊기는 이 화면의 문법에 맞춘다.
 *     CSS transition/keyframes 없이 단일 rAF 클록의 stateAt이 스텝 인덱스를
 *     계산하고 clip-path 정수 값만 바꾼다.
 *  ② 최종 그리드를 **광학 중심**으로 — 본문 하단 여백에 3vh를 더해 위로 올린다.
 *     (인트로 시작·종료 배치는 여전히 완전히 동일)
 *
 * 그 외 타임라인·색 규칙·크롬 처리·시드 해시는 전부 라운드 55와 같다.
 */

import { useEffect, useState } from "react"
import { WorkroomShell } from "../Shell"
import styles from "./r56.module.css"

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

/* 타임라인 (ms) — 라운드 55와 동일, 총 5.0s */
const T = {
  WELCOME: 1000,
  FIX: 3000,
  CAP_LAZY: 3250,
  CAP_CLUB: 3500,
  END: 5000,
}
const STEP = 60 // 써클 와이프 스텝 간격
const STEPS = 4 // 스텝 수 (0.24s에 4토막)

function rnd(seed: number, a: number, b: number) {
  let h = (seed ^ (a * 374761393) ^ (b * 668265263)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return h / 4294967296
}

/** 경과시간 → 0~4 스텝 (보간 없음 — 정수만) */
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

export function IntroR56() {
  const [elapsed, setElapsed] = useState(0)
  const [seed, setSeed] = useState<number | null>(null)

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
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(raf)
      removeListeners()
      setElapsed(T.END)
    }
    const tick = (now: number) => {
      const e = now - start
      if (e >= T.END) {
        finish()
        return
      }
      setElapsed(e)
      raf = requestAnimationFrame(tick)
    }
    const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const
    const onInput = () => finish()
    const removeListeners = () => EVENTS.forEach((ev) => window.removeEventListener(ev, onInput))
    EVENTS.forEach((ev) => window.addEventListener(ev, onInput, { passive: true }))
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      removeListeners()
    }
  }, [])

  const s = seed === null ? null : stateAt(elapsed, seed)
  const cells = s?.cells ?? INITIAL
  // 스텝 → clip-path (가로는 오른쪽을, 세로는 아래쪽을 잘라 두었다가 걷어낸다)
  const rowClip = `inset(0 ${(STEPS - (s?.lazyStep ?? 0)) * 25}% 0 0)`
  const colClip = `inset(0 0 ${(STEPS - (s?.clubStep ?? 0)) * 25}% 0)`

  return (
    <WorkroomShell paper="#f8f3ef" chromeHidden={!s?.done}>
      <main className={styles.main}>
        <div className={styles.stage}>
          <div className={styles.grid} aria-label="LAZY CLUB">
            {cells.map((cell, i) => (
              <span key={i} className={styles.cell} style={{ color: cell.color }} aria-hidden>
                {cell.ch}
              </span>
            ))}
            {!!s?.lazyStep && (
              <div className={`${styles.capsule} ${styles.capRow}`} style={{ clipPath: rowClip }} aria-hidden />
            )}
            {!!s?.clubStep && (
              <div className={`${styles.capsule} ${styles.capCol}`} style={{ clipPath: colClip }} aria-hidden />
            )}
          </div>
        </div>
      </main>
    </WorkroomShell>
  )
}
