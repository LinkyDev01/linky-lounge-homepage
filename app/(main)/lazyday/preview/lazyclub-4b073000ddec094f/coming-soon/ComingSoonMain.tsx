"use client"

/**
 * lazy-club.com coming soon (라운드 33 C안 · 37 커서 크롤 · 46 와이프 반전)
 *
 * 라운드 46 (운영자 "배경과 텍스트가 하나씩이 아니라 동시에 반전"):
 * 색상 크로스페이드는 중간에 글자·배경이 같은 회갈색에서 만나 순차 반전처럼 보인다.
 * → 같은 장면을 두 팔레트(반전/오트)로 겹쳐 렌더하고, 위에 덮인 반전 레이어를
 *   clip-path 와이프로 위→아래 걷어낸다. 경계면이 지나는 자리마다 배경과 텍스트가
 *   **같은 순간에** 원래 색으로 반전된다 (중간 혼색·색 틀어짐 없음 — backdrop 필터의
 *   청색 시프트 문제로 필터 방식은 폐기).
 *  - 마지막 글자 + 0.7s 텀 → 와이프 1.2s → 오트 상태로 고정 (1회성)
 *  - 써클은 고정 흑색 3px: 반전 레이어(배경 #1a1208)에선 완전히 묻히고,
 *    와이프가 걷힌 오트 레이어에서 드러난다 (라운드 45 유지)
 *  - 내비·푸터는 반전 레이어에서 chromeDim(글자=배경색)으로 묻힘
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

/* 타임라인 (ms) — 1회성, 총 ~7s (라운드 45·46) */
const T = {
  TYPE_END: 1600, // 타이핑 완료 (11스텝)
  VANISH: 2800, // 문구+커서 일괄 소멸 (커서 점멸 2회 후)
  CRAWL_START: 3100, // 선택 커서 출발
  STEP: 350, // 커서 보폭 — 마지막 글자 4500에 완성
  REVERT: 5200, // 마지막 글자 + 0.7s → 반전 레이어 와이프 시작 (CSS 1.2s)
  END: 6500, // 와이프 종료 — 반전 레이어 제거, 상태 고정
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

  // 라운드 46: 반전 레이어가 위에 덮인 채 시작 → REVERT에 와이프 → END에 레이어 제거
  const darkLayerOn = e < T.END
  const wiping = e >= T.REVERT

  return { textVisible, typed, blockCursor, cursor1, cursor2, lit, darkLayerOn, wiping }
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

  /** 장면 — 두 레이어가 완전히 같은 내용을 렌더한다 (팔레트만 셸에서 갈림) */
  const scene = (
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
          {/* 빙고 써클 — 고정 흑색 3px: 반전 레이어에선 배경과 같은 색이라 완전히
               묻히고, 와이프가 걷힌 오트 레이어에서 드러난다 (라운드 45·46) */}
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
  )

  return (
    <div className={styles.wipeWrap}>
      {/* 최종(오트) 레이어 — 항상 문서 흐름에 존재 */}
      <WorkroomShell>{scene}</WorkroomShell>

      {/* 반전 레이어 — 같은 장면을 반전 팔레트로 덮었다가 와이프로 위→아래 걷는다 */}
      {s.darkLayerOn && (
        <div className={`${styles.layerDark} ${s.wiping ? styles.layerDarkWipe : ""}`} aria-hidden>
          <WorkroomShell invert>{scene}</WorkroomShell>
        </div>
      )}
    </div>
  )
}
