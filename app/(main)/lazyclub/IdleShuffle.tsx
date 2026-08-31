"use client"

/**
 * 유휴 워드서치 오버레이 (라운드 79 도입 · 2026-08-26 시각부 교체) — lazy-club.com 전 페이지 공통.
 *
 * 마지막 입력으로부터 60초 동안 아무 동작이 없으면, 현재 페이지 위를 종이색으로 덮고
 * **워드서치 필드**(21×13 = 273자)가 끝없이 재생된다. 무수한 글자가 색과 글자를 뒤섞다가
 * 좌→우 물결이 지나가면 그 속에 숨어 있던 LAZY(가로)·CLUB(세로, L 공유)만 또렷해지고,
 * 단어 찾기 동그라미가 그어진 뒤 다시 전체가 뒤섞이는 8.1초 루프.
 *
 * 종전 4×4 3색 셔플을 대체한다 (운영자 확정 — 시안 F안). 브랜드 마크의 문법(숨은 단어 +
 * 동그라미)을 큰 밀도로 확장한 것이라 마크와 한 몸으로 읽힌다.
 *
 * 페이지 이동이 아니라 오버레이다 — 터치·클릭·키·휠·스크롤은 물론 **마우스 이동**까지
 * 동작으로 감지해 즉시 걷히고, 원래 화면이 그대로 돌아온다 (상태 훼손 없음).
 * 셸(WorkroomShell)에 마운트되므로 트리의 모든 페이지에 동일하게 작동한다.
 *
 * 검증용 ?idle=<ms> 로 대기시간을 덮어쓸 수 있다. ?t=(랜딩 시점 고정 스크린샷 모드)와
 * reduced-motion 에서는 비활성.
 *
 * 구현: 랜딩과 같은 시드 해시 + 단일 rAF(50ms 양자화 — 글자 교체는 이산이라 20fps 면
 * 충분하고 273칸 리렌더 비용이 1/3). 난수는 시드 해시로만 유도하고 렌더 중에는
 * Math.random() 을 부르지 않는다 (부르면 프레임마다 재추첨돼 화면이 발작한다).
 * 오버레이가 걷힐 때 타이머가 재장전되고, 다시 뜰 때마다 새 시드를 뽑는다.
 */

import { useEffect, useRef, useState } from "react"
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

const D_COLS = 21
const D_ROWS = 13

/* 타임라인 (ms) — 운영자 확정본. 셔플 유지가 길고(3.9s), 캡슐 완성 후 유지는 짧다(1.7s) */
const DT = { SCRAMBLE: 3900, SWEEP: 900, CAP1: 5500, CAP2: 5800, RESET: 7500, CYCLE: 8100 }

/* 캡슐 기하 — 기존 레이지클럽 마크(coming-soon)에서 실측한 비율.
   글자가 흐르는 방향으로는 살짝 넘치고(가로 1.04 / 세로 1.03), 직교 방향으로는
   칸보다 **좁다**(가로캡슐 높이 0.84행 / 세로캡슐 폭 0.88열) — 글자에 딱 붙는 문법. */
const CAP_ALONG_ROW = 1.04
const CAP_ACROSS_ROW = 0.84
const CAP_ALONG_COL = 1.03
const CAP_ACROSS_COL = 0.88
const D_COL_W = 100 / D_COLS
const D_ROW_H = 100 / D_ROWS
const pct = (v: number) => `${v.toFixed(3)}%`

/** 글자 칸 범위를 감싸는 캡슐 상자 — 중심은 유지하고 진행·직교 방향에 실측 배율만 적용 */
function capBox(c0: number, cols: number, r0: number, rows: number, horizontal: boolean) {
  const x0 = c0 * D_COL_W
  const w0 = cols * D_COL_W
  const y0 = r0 * D_ROW_H
  const h0 = rows * D_ROW_H
  const w = w0 * (horizontal ? CAP_ALONG_ROW : CAP_ACROSS_COL)
  const h = h0 * (horizontal ? CAP_ACROSS_ROW : CAP_ALONG_COL)
  return { left: pct(x0 - (w - w0) / 2), top: pct(y0 - (h - h0) / 2), width: pct(w), height: pct(h) }
}

/* 배치 난수 범위 — 네 칸짜리 단어가 들어가고, 가장자리 한 칸은 비운다
   (캡슐이 진행 방향으로 4% 넘치므로 화면 끝에 붙으면 잘려 보인다) */
const R_MIN = 1
const R_MAX = D_ROWS - 5 // 8
const C_MIN = 1
const C_MAX = D_COLS - 5 // 16

type Cap = { box: React.CSSProperties; horizontal: boolean }

/**
 * 시드 → 이번 사이클의 LAZY·CLUB 배치. 위치와 방향이 **매번 바뀐다**(운영자).
 * 두 배열 중 하나가 뽑히며, 어느 쪽이든 **L 을 축으로 묶인다**:
 *   ①  C          ②  C L U B
 *      L A Z Y          A
 *      U                Z
 *      B                Y
 * ① CLUB 세로 + LAZY 가로 (L 공유) · ② CLUB 가로 + LAZY 세로 (L 공유)
 */
function placementFor(s: number) {
  const vertClub = rnd(s, 7001, 11) < 0.5
  const r = R_MIN + Math.floor(rnd(s, 7002, 13) * (R_MAX - R_MIN + 1))
  const c = C_MIN + Math.floor(rnd(s, 7003, 17) * (C_MAX - C_MIN + 1))
  const cells: Record<string, string> = {}
  let capLazy: Cap
  let capClub: Cap
  if (vertClub) {
    // ① CLUB 세로(c열) + LAZY 가로(r+1행) — 공유 L 은 (r+1, c)
    ;["C", "L", "U", "B"].forEach((ch, k) => (cells[`${r + k}-${c}`] = ch))
    ;["A", "Z", "Y"].forEach((ch, k) => (cells[`${r + 1}-${c + 1 + k}`] = ch))
    capLazy = { box: capBox(c, 4, r + 1, 1, true), horizontal: true }
    capClub = { box: capBox(c, 1, r, 4, false), horizontal: false }
  } else {
    // ② CLUB 가로(r행) + LAZY 세로(c+1열) — 공유 L 은 (r, c+1)
    ;["C", "L", "U", "B"].forEach((ch, k) => (cells[`${r}-${c + k}`] = ch))
    ;["A", "Z", "Y"].forEach((ch, k) => (cells[`${r + 1 + k}-${c + 1}`] = ch))
    capLazy = { box: capBox(c + 1, 1, r, 4, false), horizontal: false }
    capClub = { box: capBox(c, 4, r, 1, true), horizontal: true }
  }
  return { cells, capLazy, capClub }
}

export function IdleShuffle() {
  // null = 오버레이 비활성 (평상시). 숫자 = 오버레이 시작부터의 경과 ms (50ms 양자화)
  const [clock, setClock] = useState<number | null>(null)
  // 이번 등장의 시드 — 뜰 때마다 새로 뽑아 매번 다른 글자·색 배열이 된다
  const seedRef = useRef(1)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const q = new URLSearchParams(window.location.search)
    if (q.get("t") !== null) return // 랜딩 시점 고정(스크린샷) 모드에선 비활성
    const idleQ = Number(q.get("idle"))
    const idleDelay = q.get("idle") && Number.isFinite(idleQ) && idleQ > 0 ? idleQ : IDLE_DELAY

    let raf = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        seedRef.current = Math.floor(Math.random() * 2147483647) || 1
        const start = performance.now()
        const tick = (now: number) => {
          // 50ms 양자화 — 글자 교체는 이산이라 20fps 로 충분하고 리렌더가 1/3로 준다
          const e = Math.floor((now - start) / 50) * 50
          setClock((prev) => (prev === e ? prev : e))
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      }, idleDelay)
    }

    // 마우스 이동까지 동작으로 본다 (운영자: "터치 또는 마우스 이동 등 동작감지")
    const EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "touchmove", "scroll"] as const
    const onInput = () => {
      cancelAnimationFrame(raf)
      setClock(null)
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

  if (clock === null) return null

  const seed = seedRef.current
  const phase = clock % DT.CYCLE
  const cycle = Math.floor(clock / DT.CYCLE)
  // 배치는 **사이클마다** 새로 뽑는다 — 한 번 뜬 화면 안에서도 8.1초마다 자리가 바뀐다.
  // 사이클 경계에서는 전부 셔플 상태(해제 완료 7920 < 8100)라 갈아끼워도 티가 없다.
  const place = placementFor((seed ^ Math.imul(cycle + 1, 2654435761)) >>> 0 || 1)
  const cells = []
  for (let r = 0; r < D_ROWS; r++) {
    for (let c = 0; c < D_COLS; c++) {
      const i = r * D_COLS + c
      const word = place.cells[`${r}-${c}`]
      // 잠금 스윕 — 열이 주도하되 행·난수를 섞어 대각선 물결로 흩는다(열 단위면 계단이 보인다)
      const lockAt =
        DT.SCRAMBLE + ((c / D_COLS) * 0.78 + (r / D_ROWS) * 0.14 + rnd(seed, i, 61) * 0.08) * DT.SWEEP
      // 해제(다시 진해지는 것)도 같은 좌→우 방향으로 확산한다 (운영자 확정)
      const unlockAt =
        DT.RESET + ((c / D_COLS) * 0.78 + (r / D_ROWS) * 0.14 + rnd(seed, i, 67) * 0.08) * 420
      const locked = phase >= lockAt && phase < unlockAt
      const interval = 90 + rnd(seed, i, 41) * 90
      const tick = Math.floor(clock / interval) // 절대 시계 — 흐려진 뒤에도 계속 진화
      const ch = word && locked ? word : ALPHABET[Math.floor(rnd(seed, i, tick) * 26)]
      const color =
        word && locked
          ? PALETTE[Math.floor(rnd(seed ^ Math.imul(cycle + 1, 40503), i, 4242) * 3)]
          : PALETTE[Math.floor(rnd(seed, i, tick + 7) * 3)]
      cells.push(
        <span
          key={i}
          className={word && locked ? styles.dLock : locked ? styles.dDim : styles.dCell}
          style={{ color }}
        >
          {ch}
        </span>,
      )
    }
  }
  const capLazy = phase >= DT.CAP1 && phase < DT.RESET
  const capClub = phase >= DT.CAP2 && phase < DT.RESET

  return (
    <div className={styles.overlay} aria-hidden>
      <div className={styles.dense}>
        {cells}
        {/* 캡슐은 clip-path 로 한쪽 끝에서부터 그어진다 — 워드서치에 손으로 동그라미 치는 몸짓 */}
        {capLazy && (
          <div
            key={`lazy-${cycle}`}
            className={`${styles.dCap} ${place.capLazy.horizontal ? styles.dCapRow : styles.dCapCol}`}
            style={place.capLazy.box}
          />
        )}
        {capClub && (
          <div
            key={`club-${cycle}`}
            className={`${styles.dCap} ${place.capClub.horizontal ? styles.dCapRow : styles.dCapCol}`}
            style={place.capClub.box}
          />
        )}
      </div>
    </div>
  )
}
