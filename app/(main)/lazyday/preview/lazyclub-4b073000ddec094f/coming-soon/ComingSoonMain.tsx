"use client"

/**
 * lazy-club.com coming soon 본문 (라운드 33 — C안 워터마크 확정)
 * 이미지 대신 둥근모꼴로 워드서치 그리드를 조판하고, 그 위에 COMING SOON을 얹는다.
 * 문구가 한 번에 사라진 뒤 가로 LAZY · 세로 CLUB이 y2k 스텝 점멸로 활성화된다.
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

export function ComingSoonMain() {
  const ghostRef = useRef<HTMLSpanElement>(null)
  const [typeW, setTypeW] = useState<number | null>(null)
  const [phase, setPhase] = useState<"type" | "hot" | null>(null)

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

  const phaseClass = phase === "type" ? styles.phaseType : phase === "hot" ? styles.phaseHot : ""

  return (
    <main className={`${styles.main} ${phaseClass}`}>
      <div className={styles.stage}>
        <div className={styles.grid} aria-label="LAZY CLUB">
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
          {/* 찾은 단어 캡슐 — 가로 LAZY · 세로 CLUB */}
          <div className={`${styles.capsule} ${styles.capRow}`} aria-hidden />
          <div className={`${styles.capsule} ${styles.capCol}`} aria-hidden />
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
