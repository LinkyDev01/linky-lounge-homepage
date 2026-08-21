"use client"

/**
 * 유휴 셔플 오버레이 (라운드 79, 운영자) — lazy-club.com 트리 전 페이지 공통.
 *
 * 마지막 입력으로부터 60초 동안 아무 동작이 없으면, 현재 페이지 위를 종이색으로
 * 덮고 랜딩 인트로와 같은 4×4 3색 난수 셔플이 **끝없이** 재생된다.
 * 페이지 이동이 아니라 오버레이다 — 터치·클릭·키·휠·스크롤은 물론 **마우스 이동**까지
 * 동작으로 감지해 즉시 걷히고, 원래 화면이 그대로 돌아온다 (상태 훼손 없음).
 *
 * 셸(WorkroomShell)에 마운트되므로 트리의 모든 페이지(랜딩·홈·모임·아카이브·카트·상세)에
 * 동일하게 작동한다. 랜딩의 페이지 내 유휴 셔플(라운드 77)은 이 오버레이로 승격·대체.
 *
 * 검증용 ?idle=<ms> 로 대기시간을 덮어쓸 수 있다. ?t=(랜딩 시점 고정 스크린샷 모드)와
 * reduced-motion 에서는 비활성.
 *
 * 구현: 랜딩과 같은 시드 해시 + 단일 rAF. 오버레이가 걷힐 때 타이머가 재장전된다.
 */

import { useEffect, useState } from "react"
import styles from "./idle-shuffle.module.css"

const PALETTE = ["#f49938", "#96ab9b", "#845d5e"]
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const IDLE_DELAY = 60_000

/** 결정적 해시 → [0,1) — ComingSoonMain 과 같은 문법 (시드·칸·틱이 같으면 같은 값) */
function rnd(seed: number, a: number, b: number) {
  let h = (seed ^ (a * 374761393) ^ (b * 668265263)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return h / 4294967296
}

type Cell = { ch: string; color: string }

/** 경과시간 → 16칸 셔플 상태 (칸별 60~140ms 간격, 종료 시점 없음) */
function cellsAt(e: number, seed: number): Cell[] {
  const cells: Cell[] = []
  for (let i = 0; i < 16; i++) {
    const interval = 60 + rnd(seed, i, 999) * 80
    const tick = Math.floor(e / interval)
    cells.push({
      ch: ALPHABET[Math.floor(rnd(seed, i, tick + 31337) * 26)],
      color: PALETTE[Math.floor(rnd(seed, i, tick + 31344) * 3)],
    })
  }
  return cells
}

export function IdleShuffle() {
  // null = 오버레이 비활성 (평상시)
  const [cells, setCells] = useState<Cell[] | null>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const q = new URLSearchParams(window.location.search)
    if (q.get("t") !== null) return // 랜딩 시점 고정(스크린샷) 모드에선 비활성
    const idleQ = Number(q.get("idle"))
    const idleDelay = q.get("idle") && Number.isFinite(idleQ) && idleQ > 0 ? idleQ : IDLE_DELAY
    const seed = Math.floor(Math.random() * 2147483647) || 1

    let raf = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const start = performance.now()
        const tick = (now: number) => {
          setCells(cellsAt(now - start, seed))
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      }, idleDelay)
    }

    // 마우스 이동까지 동작으로 본다 (운영자: "터치 또는 마우스 이동 등 동작감지")
    const EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "touchmove", "scroll"] as const
    const onInput = () => {
      cancelAnimationFrame(raf)
      setCells(null)
      arm()
    }
    EVENTS.forEach((ev) => window.addEventListener(ev, onInput, { passive: true }))
    arm()
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      EVENTS.forEach((ev) => window.removeEventListener(ev, onInput))
    }
  }, [])

  if (!cells) return null
  return (
    <div className={styles.overlay} aria-hidden>
      <div className={styles.grid}>
        {cells.map((cell, i) => (
          <span key={i} className={styles.cell} style={{ color: cell.color }}>
            {cell.ch}
          </span>
        ))}
      </div>
    </div>
  )
}
