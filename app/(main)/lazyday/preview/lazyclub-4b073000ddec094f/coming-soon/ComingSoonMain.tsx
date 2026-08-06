"use client"

/**
 * lazy-club.com coming soon 본문 (라운드 33 C안 · 35 개편)
 * 둥근모꼴 4×4 워드서치 그리드 + COMING SOON 타이핑.
 *
 * 라운드 35 (운영자):
 *  - 사라짐은 전부 "일괄·즉시" — 글자 하나씩 지우기·흐려지기 금지
 *  - 그라데이션 금지 — 빙고 써클(캡슐)은 얇은 선 → 굵은 선 2단계로 채움
 * 그리드 점등은 켤 때만 글자당 캐스케이드(하드 스텝), 끌 때는 전체가 한 번에 꺼진다.
 * ON 스태거 + 일괄 OFF는 CSS 키프레임으로 불가능해 rAF 상태 전환으로 구동한다.
 * (타이핑·커서는 종전대로 순수 CSS 키프레임 — 14s 사이클 공유)
 */

import { useEffect, useRef, useState } from "react"
import styles from "./coming-soon.module.css"

// 원 마크와 동일한 배열 — 2행 = LAZY(가로), 1열 = CLUB(세로)
const GRID = [
  ["C", "D", "E", "F"],
  ["L", "A", "Z", "Y"],
  ["U", "V", "W", "X"],
  ["B", "C", "D", "E"],
]

/** 활성 글자와 점등 순서: LAZY 좌→우, 이어서 CLUB 위→아래(L은 LAZY에 포함) */
const HOT_ORDER: Record<string, number> = {
  "1-0": 0, // L
  "1-1": 1, // A
  "1-2": 2, // Z
  "1-3": 3, // Y
  "0-0": 4, // C
  "2-0": 5, // U
  "3-0": 6, // B
}

/* 타임라인 (ms) — CSS 사이클(14s)과 동일 기준.
   문구 일괄 소멸(38% = 5.32s) 뒤 점등 시작, 86%(12.04s)에 전원 일괄 소등 */
const CYCLE = 14000
const GRID_ON = 5600 // 글자 캐스케이드 시작 (transition-delay가 0.18s씩 지연)
const CAP_ROW_THIN = 6900 // LAZY 써클 — 얇은 선
const CAP_ROW_THICK = 7350 //            → 굵은 선
const CAP_COL_THIN = 7800 // CLUB 써클 — 얇은 선
const CAP_COL_THICK = 8250 //            → 굵은 선
const ALL_OFF = 12040 // 전체 일괄 소등 (글자·써클 동시, 즉시)

export function ComingSoonMain() {
  const ghostRef = useRef<HTMLSpanElement>(null)
  const [typeW, setTypeW] = useState<number | null>(null)
  const [phase, setPhase] = useState<"type" | "hot" | null>(null)
  const [gridOn, setGridOn] = useState(false)
  const [capRow, setCapRow] = useState(0) // 0 없음 · 1 얇게 · 2 굵게
  const [capCol, setCapCol] = useState(0)

  // 타이핑 완성 폭 실측 — ch 계산은 폰트 크기·로딩 시점에 따라 마지막 글자가 잘린다
  useEffect(() => {
    const measure = () => {
      if (ghostRef.current) setTypeW(ghostRef.current.getBoundingClientRect().width)
    }
    measure()
    document.fonts?.ready.then(measure).catch(() => {})
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  // ?phase=type|hot — 검토 스크린샷용 정지
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("phase")
    if (p === "type" || p === "hot") setPhase(p)
  }, [])

  // 그리드 상태 머신 — rAF로 사이클 내 위치를 계산 (드리프트 없음)
  useEffect(() => {
    if (phase) return // 정지 모드
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGridOn(true)
      setCapRow(2)
      setCapCol(2)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const e = (now - start) % CYCLE
      const lit = e >= GRID_ON && e < ALL_OFF
      setGridOn(lit)
      setCapRow(lit ? (e >= CAP_ROW_THICK ? 2 : e >= CAP_ROW_THIN ? 1 : 0) : 0)
      setCapCol(lit ? (e >= CAP_COL_THICK ? 2 : e >= CAP_COL_THIN ? 1 : 0) : 0)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  const phaseClass = phase === "type" ? styles.phaseType : phase === "hot" ? styles.phaseHot : ""
  const capClass = (state: number) => (state === 2 ? styles.capThick : state === 1 ? styles.capThin : "")

  return (
    <main className={`${styles.main} ${phaseClass}`}>
      <div className={styles.stage}>
        <div className={`${styles.grid} ${gridOn ? styles.gridOn : ""}`} aria-label="LAZY CLUB">
          {GRID.map((row, r) =>
            row.map((ch, c) => {
              const key = `${r}-${c}`
              const hot = key in HOT_ORDER
              return (
                <span
                  key={key}
                  className={`${styles.cell} ${hot ? styles.hot : ""}`}
                  style={hot ? ({ ["--i"]: HOT_ORDER[key] } as React.CSSProperties) : undefined}
                  aria-hidden
                >
                  {ch}
                </span>
              )
            }),
          )}
          {/* 빙고 써클 — 얇게 → 굵게 2단계 (가로 LAZY · 세로 CLUB) */}
          <div className={`${styles.capsule} ${styles.capRow} ${capClass(capRow)}`} aria-hidden />
          <div className={`${styles.capsule} ${styles.capCol} ${capClass(capCol)}`} aria-hidden />
        </div>

        <div className={styles.overlay} aria-label="COMING SOON">
          <span ref={ghostRef} className={styles.ghost} aria-hidden>
            COMING SOON
          </span>
          <span
            className={styles.typing}
            style={typeW ? ({ ["--typeW"]: `${Math.ceil(typeW)}px` } as React.CSSProperties) : undefined}
            aria-hidden
          >
            COMING SOON
          </span>
          <span className={styles.cursor} aria-hidden>
            ▮
          </span>
        </div>
      </div>
    </main>
  )
}
