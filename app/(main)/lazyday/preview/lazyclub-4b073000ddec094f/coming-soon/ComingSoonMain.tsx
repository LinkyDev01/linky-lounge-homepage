"use client"

/**
 * lazy-club.com coming soon (라운드 33 C안 · 37 커서 크롤 · 41 A안 클라이맥스)
 *
 * 라운드 41 A안(정답 반전) · 라운드 42 정정 (운영자):
 *  - **처음부터 반전(잉크 배경)인 채로 시작** — 타이핑·크롤·써클 전부 반전 위에서 진행
 *  - 강조 차례가 온 글자는 사라지지 않고 **블록**으로 표시 (크롤 커서와 같은 문법)
 *  - **마지막에 원래 오트 컬러로 복귀** (2프레임 깜빡 후) — **1회성, 복귀 상태로 고정**
 *
 * 반전은 셸의 팔레트 변수(--ink/--paper) 스왑이라 헤더·푸터까지 화면 전체가 뒤집힌다.
 * 모든 타이밍은 단일 rAF 클록의 순수 함수(stateAt) — 시계가 하나라 어긋남이 없다.
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
const HOT = new Set([...CURSOR1_PATH, ...CURSOR2_PATH])

/* 타임라인 (ms) — 1회성. END 이후에는 최종 상태로 고정된다 */
const T = {
  TYPE_END: 2000, // 타이핑 완료 (11스텝)
  VANISH: 3800, // 문구+커서 일괄 소멸
  CRAWL_START: 4200, // 선택 커서 출발
  STEP: 380, // 커서 보폭 (마지막 글자 5720)
  CAP_LAZY_THIN: 6300, // LAZY 써클 얇게 → 굵게
  CAP_LAZY_THICK: 6650,
  CAP_CLUB_THIN: 7000, // CLUB 써클 얇게 → 굵게
  CAP_CLUB_THICK: 7350,
  BLOCK_IN: 7900, // 찾은 글자 블록 강조 시작
  REVERT: 9500, // 원래 오트 컬러로 복귀 (직전 2프레임 깜빡) → 고정
  END: 9500, // 이후 고정
}

/** 경과시간 → 화면 상태 (순수 함수 — 모든 연출의 단일 출처) */
function stateAt(raw: number) {
  const e = Math.min(raw, T.END)

  const textVisible = e < T.VANISH
  const typed = !textVisible ? 0 : e >= T.TYPE_END ? PHRASE.length : Math.floor((e / T.TYPE_END) * PHRASE.length)
  // 커서: 타이핑 중 점등 고정, 완료 후 0.45s 간격 점멸
  const blockCursor = textVisible && (e < T.TYPE_END ? true : Math.floor((e - T.TYPE_END) / 450) % 2 === 0)

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

  const capLazy = e >= T.CAP_LAZY_THICK ? 2 : e >= T.CAP_LAZY_THIN ? 1 : 0
  const capClub = e >= T.CAP_CLUB_THICK ? 2 : e >= T.CAP_CLUB_THIN ? 1 : 0

  // 라운드 42: 처음부터 반전으로 시작 → 복귀 직전 원컬러가 2프레임 깜빡 → 복귀 고정.
  // 깜빡 슬롯: [REVERT-390, REVERT-260) · [REVERT-130, REVERT) 에서 잠깐 원컬러
  const flash = e >= T.REVERT - 390 && ((e < T.REVERT - 260) || e >= T.REVERT - 130)
  const inverted = e < T.REVERT && !flash
  // 블록 강조 구간 — 찾은 글자는 사라지지 않고 블록으로 (운영자 라운드 41)
  const blocked = e >= T.BLOCK_IN && e < T.REVERT

  return { textVisible, typed, blockCursor, cursor1, cursor2, lit, capLazy, capClub, inverted, blocked }
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
  const capClass = (n: number) => (n === 2 ? styles.capThick : n === 1 ? styles.capThin : "")

  return (
    <WorkroomShell>
      <main className={`${styles.main} ${s.inverted ? styles.inverted : ""}`}>
        <div className={styles.stage}>
          <div className={styles.grid} aria-label="LAZY CLUB">
            {GRID.map((row, r) =>
              row.map((ch, c) => {
                const key = `${r}-${c}`
                const isCursor = s.cursor1 === key || s.cursor2 === key
                const cls = [
                  styles.cell,
                  s.lit.has(key) ? styles.lit : "",
                  isCursor ? styles.cellCursor : "",
                  s.blocked && HOT.has(key) ? styles.cellBlock : "",
                ]
                  .filter(Boolean)
                  .join(" ")
                return (
                  <span key={key} className={cls} aria-hidden>
                    {ch}
                  </span>
                )
              }),
            )}
            {/* 빙고 써클 — LAZY 먼저, 이어 CLUB (얇게→굵게 2단계) */}
            <div className={`${styles.capsule} ${styles.capRow} ${capClass(s.capLazy)}`} aria-hidden />
            <div className={`${styles.capsule} ${styles.capCol} ${capClass(s.capClub)}`} aria-hidden />
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
