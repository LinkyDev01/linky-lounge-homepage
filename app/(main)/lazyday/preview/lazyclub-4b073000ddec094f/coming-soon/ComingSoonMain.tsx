"use client"

/**
 * lazy-club.com coming soon 본문 (라운드 33 C안 · 37 전면 재구성)
 *
 * 라운드 37 (운영자): 순서 C → L → U·A → B·Z → Y, "부자연스러움" 해결,
 * y2k 컨셉을 미학적으로 + 골때리게.
 *
 * 부자연스러움의 근본 원인: 타이핑(CSS 키프레임)과 그리드(rAF)가 서로 다른
 * 시계로 돌아 탭 전환·로드 지연 시 위상이 어긋났다 → 모든 상태를 단일
 * rAF 클록의 순수 함수로 통합 (드리프트 원천 차단).
 *
 * 연출: 워드서치 퍼즐을 "푸는" 픽셀 선택 커서(반전 블록) 2개 —
 * 하나는 CLUB을 세로로(C→L→U→B), 다른 하나는 두 박자 늦게 A→Z→Y를
 * 가로로 기어가며, 지나간 글자는 잉크색으로 남는다. 두 커서의 보폭이
 * 겹치며 자연히 C / L / U·A / B·Z / Y 그룹이 만들어진다.
 * 단어가 다 찾히면 CLUB 써클 → LAZY 써클 순서로 얇게→굵게 2단계 스탬프.
 * 사라짐은 전부 일괄·즉시, 그라데이션 없음 (라운드 35 규칙 유지).
 */

import { useEffect, useState } from "react"
import styles from "./coming-soon.module.css"

// 원 마크와 동일한 배열 — 2행 = LAZY(가로), 1열 = CLUB(세로)
const GRID = [
  ["C", "D", "E", "F"],
  ["L", "A", "Z", "Y"],
  ["U", "V", "W", "X"],
  ["B", "C", "D", "E"],
]

const PHRASE = "COMING SOON"

/* 커서 경로 — 스텝 s에 커서가 서 있는 칸. 커서2는 두 스텝 늦게 출발.
   s:      0    1    2      3      4
   커서1:  C    L    U      B      —      (CLUB 세로)
   커서2:  —    —    A      Z      Y      (LAZY 꼬리 가로)
   → 점등 그룹: C / L / U·A / B·Z / Y (운영자 라운드 37 순서) */
const CURSOR1_PATH = ["0-0", "1-0", "2-0", "3-0"]
const CURSOR2_PATH = ["1-1", "1-2", "1-3"]
const CURSOR2_LAG = 2

/* 타임라인 (ms) — 단일 클록. 라운드 38: 사이클 12s → 10.5s (소폭 가속),
   써클은 LAZY 먼저 → CLUB */
const T = {
  TYPE_END: 2000, // 타이핑 완료 (11스텝)
  VANISH: 3800, // 문구+커서 일괄 소멸
  CRAWL_START: 4200, // 선택 커서 출발
  STEP: 380, // 커서 보폭
  CAP_LAZY_THIN: 6300, // LAZY 써클 얇게 (커서 퇴장 후)
  CAP_LAZY_THICK: 6650, //           → 굵게
  CAP_CLUB_THIN: 7000, // CLUB 써클 얇게
  CAP_CLUB_THICK: 7350, //           → 굵게
  OFF: 9400, // 전원 일괄 즉시 소등
  CYCLE: 10500,
}

/** 사이클 내 경과시간 → 화면 상태 (순수 함수 — 모든 연출의 단일 출처) */
function stateAt(e: number) {
  const textVisible = e < T.VANISH
  const typed = !textVisible ? 0 : e >= T.TYPE_END ? PHRASE.length : Math.floor((e / T.TYPE_END) * PHRASE.length)
  // 커서: 타이핑 중 점등 고정, 완료 후 0.45s 간격 점멸 (2회)
  const blockCursor = textVisible && (e < T.TYPE_END ? true : Math.floor((e - T.TYPE_END) / 450) % 2 === 0)

  const live = e >= T.CRAWL_START && e < T.OFF
  const step = live ? Math.floor((e - T.CRAWL_START) / T.STEP) : -1
  const cursor1 = step >= 0 && step < CURSOR1_PATH.length ? CURSOR1_PATH[step] : null
  const c2i = step - CURSOR2_LAG
  const cursor2 = c2i >= 0 && c2i < CURSOR2_PATH.length ? CURSOR2_PATH[c2i] : null

  const lit = new Set<string>()
  if (live) {
    CURSOR1_PATH.forEach((k, i) => {
      if (step >= i) lit.add(k)
    })
    CURSOR2_PATH.forEach((k, i) => {
      if (step >= i + CURSOR2_LAG) lit.add(k)
    })
  }
  const capClub = live ? (e >= T.CAP_CLUB_THICK ? 2 : e >= T.CAP_CLUB_THIN ? 1 : 0) : 0
  const capLazy = live ? (e >= T.CAP_LAZY_THICK ? 2 : e >= T.CAP_LAZY_THIN ? 1 : 0) : 0

  return { textVisible, typed, blockCursor, cursor1, cursor2, lit, capClub, capLazy }
}

const STILL_ELAPSED = { type: 2500, hot: 8600 } as const

export function ComingSoonMain() {
  const [now, setNow] = useState(0)
  const [still, setStill] = useState<keyof typeof STILL_ELAPSED | null>(null)
  const [staticAll, setStaticAll] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("phase")
    if (p === "type" || p === "hot") {
      setStill(p)
      return
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStaticAll(true)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      setNow((t - start) % T.CYCLE)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const s = staticAll
    ? { ...stateAt(9500), textVisible: false, typed: 0, blockCursor: false }
    : stateAt(still ? STILL_ELAPSED[still] : now)
  const capClass = (state: number) => (state === 2 ? styles.capThick : state === 1 ? styles.capThin : "")

  return (
    <main className={styles.main}>
      <div className={styles.stage}>
        <div className={styles.grid} aria-label="LAZY CLUB">
          {GRID.map((row, r) =>
            row.map((ch, c) => {
              const key = `${r}-${c}`
              const isCursor = s.cursor1 === key || s.cursor2 === key
              return (
                <span
                  key={key}
                  className={`${styles.cell} ${s.lit.has(key) ? styles.lit : ""} ${isCursor ? styles.cellCursor : ""}`}
                  aria-hidden
                >
                  {ch}
                </span>
              )
            }),
          )}
          {/* 빙고 써클 — LAZY 먼저, 이어 CLUB (운영자 라운드 38), 얇게→굵게 2단계 */}
          <div className={`${styles.capsule} ${styles.capCol} ${capClass(s.capClub)}`} aria-hidden />
          <div className={`${styles.capsule} ${styles.capRow} ${capClass(s.capLazy)}`} aria-hidden />
        </div>

        <div className={styles.overlay} aria-label="COMING SOON">
          {/* CLI식 좌측 고정 타이핑 (라운드 38) — 보이지 않는 완성 문구가 박스 폭을
               고정하고, 타이핑은 그 왼쪽 모서리에서 오른쪽으로 채워진다 (재정렬 없음) */}
          <span className={styles.typeBox} aria-hidden>
            <span className={styles.sizer}>{PHRASE}▮</span>
            {s.textVisible && (
              <span className={styles.typedLine}>
                {PHRASE.slice(0, s.typed)}
                <span className={s.blockCursor ? "" : styles.blockCursorOff}>▮</span>
              </span>
            )}
          </span>
        </div>
      </div>
    </main>
  )
}
