"use client"

/**
 * lazy-club.com 랜딩 인트로 (라운드 47 전면 교체)
 *
 * 이 페이지는 '커밍순'이 아니라 정식 랜딩이다. 방문하면 인트로(4×4 알파벳 셔플 →
 * LAZY·CLUB 완성 → 빙고 동그라미)가 재생되고, 끝나는 순간 내비·푸터가 나타난다.
 * COMING SOON 문구·타이핑·흑백 반전·커서 크롤은 전부 폐기 (라운드 47).
 *
 * 시퀀스 (총 3.5s, 1회성):
 *   0–2.5s   4×4 셔플 — 화면에는 그리드 하나뿐 (내비·푸터 미렌더, 스크롤 없음).
 *            16칸이 각자 60~140ms 무작위 간격으로 A–Z를 빠르게 교체하며,
 *            글자가 바뀔 때마다 3색(#f49938/#96ab9b/#845d5e) 중 무작위 재배정
 *   2.5s     고정 — 원 마크 배열(CDEF/LAZY/UVWX/BCDE). LAZY·CLUB 7글자는
 *            세 컬러 중 무작위 1색으로 통일(새로고침마다 다름), 나머지 9글자는
 *            셔플 마지막 색 유지 — 단, 단색과 같으면 다른 색으로 치환
 *            (써클 주위 글자는 써클 안 텍스트와 반드시 다른 색)
 *   2.5s     LAZY 동그라미 → 2.75s CLUB 동그라미 (각 즉시, 3px 1단계)
 *   3.0–3.5s 정지 유지
 *   3.5s     최종 상태 — 내비·푸터 출현 (페이드 없이 즉시), 그대로 고정
 *
 * 스킵: 인트로 중 어떤 입력이든 즉시 최종 상태. reduced-motion도 즉시 최종.
 * 인트로는 방문마다 재생.
 *
 * 구현: 단일 rAF 클록 + 순수 함수 stateAt. 난수는 마운트 시 시드 하나만 뽑고
 * (셔플 글자·색·간격·단색은 전부 시드 해시로 유도) stateAt은 읽기만 한다 —
 * 프레임마다 Math.random()을 부르면 화면이 발작하듯 재추첨된다.
 * 시드는 클라이언트 effect에서 생성 (SSR 첫 페인트는 빈 그리드 → 하이드레이션 불일치 없음).
 */

import { useEffect, useState } from "react"
import { usePreviewBarHide, WorkroomShell } from "../Shell"
import styles from "./coming-soon.module.css"

// 원 마크와 동일한 최종 배열 — 2행 = LAZY(가로), 1열 = CLUB(세로, L 공유)
const GRID = [
  ["C", "D", "E", "F"],
  ["L", "A", "Z", "Y"],
  ["U", "V", "W", "X"],
  ["B", "C", "D", "E"],
]
const HOT = new Set(["0-0", "1-0", "2-0", "3-0", "1-1", "1-2", "1-3"]) // C·L·U·B + A·Z·Y

const PALETTE = ["#f49938", "#96ab9b", "#845d5e"]
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

/* 타임라인 (ms) — 1회성, 총 3.5s */
const T = {
  FIX: 2500, // 셔플 종료 — LAZY·CLUB 고정
  CAP_LAZY: 2500, // LAZY 동그라미 (즉시)
  CAP_CLUB: 2750, // CLUB 동그라미 (즉시)
  END: 3500, // 최종 상태 — 내비·푸터 출현, 고정
}

/** 결정적 해시 → [0,1) — 시드·칸·틱이 같으면 항상 같은 값 (프레임 간 안정) */
function rnd(seed: number, a: number, b: number) {
  let h = (seed ^ (a * 374761393) ^ (b * 668265263)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return h / 4294967296
}

type Cell = { ch: string; color: string }

/** 경과시간 + 시드 → 화면 상태 (순수 함수 — 모든 연출의 단일 출처) */
function stateAt(raw: number, seed: number) {
  const e = Math.min(raw, T.END)
  const wordColor = PALETTE[Math.floor(rnd(seed, 4242, 1) * 3)]

  const cells: Cell[] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c
      // 칸별 셔플 간격 60~140ms (시드로 고정)
      const interval = 60 + rnd(seed, i, 999) * 80
      // 고정 이후에는 마지막 틱에 멈춘다 → 색이 이어진다
      const tick = Math.floor(Math.min(e, T.FIX - 1) / interval)
      if (e < T.FIX) {
        cells.push({
          ch: ALPHABET[Math.floor(rnd(seed, i, tick) * 26)],
          color: PALETTE[Math.floor(rnd(seed, i, tick + 7) * 3)],
        })
      } else {
        // LAZY·CLUB은 단색 통일. 나머지 9칸은 셔플 마지막 색을 잇되,
        // 그 색이 단색과 같으면 나머지 2색 중 하나로 치환 —
        // 써클 주위 글자는 써클 안 텍스트와 반드시 다른 색 (운영자 지시)
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
    capLazy: e >= T.CAP_LAZY,
    capClub: e >= T.CAP_CLUB,
    done: e >= T.END,
  }
}

export function ComingSoonMain() {
  const [elapsed, setElapsed] = useState(0)
  const [seed, setSeed] = useState<number | null>(null)
  usePreviewBarHide() // 인트로는 셸 밖에서 렌더되므로 여기서도 프리뷰 바를 숨긴다

  useEffect(() => {
    // 난수 시드는 여기서 딱 한 번 (구현 주의 — stateAt은 읽기만 한다)
    const s = Math.floor(Math.random() * 2147483647) || 1
    setSeed(s)

    // ?t=<ms> — 검토 스크린샷용 시점 고정
    const q = new URLSearchParams(window.location.search)
    const t = Number(q.get("t"))
    if (q.get("t") && Number.isFinite(t)) {
      setElapsed(t)
      return
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setElapsed(T.END) // 모션 없이 즉시 최종 상태
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
    // 스킵 — 인트로 중 어떤 입력이든 즉시 최종 상태로 점프
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

  // 시드 전 첫 페인트(SSR 포함)는 빈 그리드 — 하이드레이션 불일치 방지
  const s = seed === null ? null : stateAt(elapsed, seed)

  const grid = (
    <div className={styles.grid} aria-label="LAZY CLUB">
      {(s?.cells ?? Array.from({ length: 16 }, () => null)).map((cell, i) => (
        <span key={i} className={styles.cell} style={cell ? { color: cell.color } : undefined} aria-hidden>
          {cell?.ch ?? ""}
        </span>
      ))}
      {/* 빙고 동그라미 — LAZY 먼저, 이어 CLUB (각 즉시 표시, 3px 1단계) */}
      {s?.capLazy && <div className={`${styles.capsule} ${styles.capRow}`} aria-hidden />}
      {s?.capClub && <div className={`${styles.capsule} ${styles.capCol}`} aria-hidden />}
    </div>
  )

  // 인트로 구간 — 화면에는 그리드 하나뿐 (내비·푸터·스크롤 없음)
  if (!s?.done) {
    return <div className={styles.introRoot}>{grid}</div>
  }

  // 최종 상태 — 내비·푸터 출현, 그리드·색 배치는 그대로 고정
  return (
    <WorkroomShell paper="#f8f3ef">
      <main className={styles.main}>
        <div className={styles.stage}>{grid}</div>
      </main>
    </WorkroomShell>
  )
}
