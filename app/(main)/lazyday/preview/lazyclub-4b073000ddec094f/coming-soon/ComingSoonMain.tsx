"use client"

/**
 * lazy-club.com coming soon (라운드 33 C안 · 37 커서 크롤 · 45 확정 구성)
 *
 * 라운드 45 (운영자): 총 7초. 깜빡임·블록 색칠 단계 전부 제거.
 *  - 마지막 글자까지 하나씩 찍고 → 0.7s 텀 → **색상을 서서히 반전** (1.5s 페이드)
 *  - 써클은 처음부터 끝까지 **고정 흑색** — 반전(잉크) 배경에선 보이지 않다가
 *    배경이 오트로 밝아지며 서서히 드러난다
 *  - 1회성, 복귀 상태로 고정
 *
 * 반전은 셸 팔레트(--ink/--paper) 스왑 + 내비·푸터는 chromeDim으로 글자만 잉크 고정
 * (배경에 묻힘 — 복귀 후에도 같은 잉크색이라 색이 튀지 않고 배경만 밝아진다).
 * 모든 타이밍은 단일 rAF 클록의 순수 함수(stateAt).
 */

import { useEffect, useState } from "react"
import { WorkroomShell } from "../Shell"
import styles from "./coming-soon.module.css"

// 원 마크와 동일한 배열 — 2행 = LAZY(가로), 1열 = CLUB(세로)
const GRID = [
  ["C", "D", "E", "F"],
  ["L", "A", "Z", "Y"],
  ["U", "V", "W", "X"],
  ["B", "C", "D", "E"],
]

const PHRASE = "COMING SOON"

/* 커서 경로 — 커서1은 CLUB 세로, 커서2는 두 박자 늦게 LAZY 꼬리 가로.
   보폭이 겹쳐 점등 그룹 C / L / U·A / B·Z / Y 가 만들어진다 (라운드 37) */
const CURSOR1_PATH = ["0-0", "1-0", "2-0", "3-0"]
const CURSOR2_PATH = ["1-1", "1-2", "1-3"]
const CURSOR2_LAG = 2

/* 타임라인 (ms) — 1회성, 총 ~7s (라운드 45) */
const T = {
  TYPE_END: 1600, // 타이핑 완료 (11스텝)
  VANISH: 2800, // 문구+커서 일괄 소멸 (커서 점멸 2회 후)
  CRAWL_START: 3100, // 선택 커서 출발
  STEP: 350, // 커서 보폭 — 마지막 글자 4500에 완성
  REVERT: 5200, // 마지막 글자 + 0.7s → 서서히 오트로 반전 (CSS 1.5s 페이드)
  END: 5300, // 상태 고정 (페이드는 CSS가 이어서 6.7s에 마무리)
}

/** 경과시간 → 화면 상태 (순수 함수 — 모든 연출의 단일 출처) */
function stateAt(raw: number) {
  const e = Math.min(raw, T.END)

  const textVisible = e < T.VANISH
  const typed = !textVisible ? 0 : e >= T.TYPE_END ? PHRASE.length : Math.floor((e / T.TYPE_END) * PHRASE.length)
  // 타이핑 커서: 입력 중 점등 고정, 완료 후 0.3s 간격 점멸 2회
  const blockCursor = textVisible && (e < T.TYPE_END ? true : Math.floor((e - T.TYPE_END) / 300) % 2 === 0)

  const live = e >= T.CRAWL_START
  const step = live ? Math.floor((e - T.CRAWL_START) / T.STEP) : -1
  const cursor1 = step >= 0 && step < CURSOR1_PATH.length ? CURSOR1_PATH[step] : null
  const c2i = step - CURSOR2_LAG
  const cursor2 = c2i >= 0 && c2i < CURSOR2_PATH.length ? CURSOR2_PATH[c2i] : null

  const lit = new Set<string>()
  if (live) {
    CURSOR1_PATH.forEach((k, i) => step >= i && lit.add(k))
    CURSOR2_PATH.forEach((k, i) => step >= i + CURSOR2_LAG && lit.add(k))
  }

  // 라운드 45: 깜빡임 없이 REVERT에 팔레트를 바꾸고 CSS transition이 서서히 페이드
  const inverted = e < T.REVERT
  // 페이드 트랜지션은 복귀 직전에만 켠다 — 크롤 중 커서 블록이 번지는 것 방지
  const smooth = e >= T.REVERT - 150

  return { textVisible, typed, blockCursor, cursor1, cursor2, lit, inverted, smooth }
}

export function ComingSoonMain() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    // ?t=<ms> — 검토 스크린샷용 시점 고정
    const q = new URLSearchParams(window.location.search)
    const t = Number(q.get("t"))
    if (q.get("t") && Number.isFinite(t)) {
      setElapsed(t)
      return
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setElapsed(T.END) // 모션 없이 최종 상태로
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const e = now - start
      setElapsed(e)
      if (e < T.END) raf = requestAnimationFrame(tick) // 1회성 — 끝나면 고정
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const s = stateAt(elapsed)

  return (
    <WorkroomShell invert={s.inverted} smooth={s.smooth}>
      <main className={styles.main}>
        <div className={styles.stage}>
          <div className={styles.grid} aria-label="LAZY CLUB">
            {GRID.map((row, r) =>
              row.map((ch, c) => {
                const key = `${r}-${c}`
                const isCursor = s.cursor1 === key || s.cursor2 === key
                const cls = [styles.cell, s.lit.has(key) ? styles.lit : "", isCursor ? styles.cellCursor : ""]
                  .filter(Boolean)
                  .join(" ")
                return (
                  <span key={key} className={cls} aria-hidden>
                    {ch}
                  </span>
                )
              }),
            )}
            {/* 빙고 써클 — 처음부터 끝까지 고정 흑색(3px). 반전 배경에선 보이지 않다가
                 배경이 오트로 페이드되며 서서히 드러난다 (라운드 45) */}
            <div className={`${styles.capsule} ${styles.capRow}`} aria-hidden />
            <div className={`${styles.capsule} ${styles.capCol}`} aria-hidden />
          </div>

          <div className={styles.overlay} aria-label="COMING SOON">
            {/* CLI식 좌측 고정 타이핑 — sizer가 폭을 잡고 왼쪽부터 채워진다 */}
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
    </WorkroomShell>
  )
}
