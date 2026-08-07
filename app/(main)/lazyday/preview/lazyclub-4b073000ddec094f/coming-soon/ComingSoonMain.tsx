"use client"

/**
 * lazy-club.com 랜딩 인트로 (라운드 47 도입 · 라운드 48 개정)
 *
 * 이 페이지는 '커밍순'이 아니라 정식 랜딩이다. 방문하면 인트로(WELCOME TO →
 * 4×4 알파벳 셔플 → LAZY·CLUB 완성 → 빙고 동그라미)가 재생되고, 끝나는 순간
 * 내비·푸터가 색을 되찾으며 나타난다.
 *
 * 시퀀스 (총 4.6s, 1회성):
 *   0–1.0s   WELX / COME / TOXX / XXXX — 잉크 단색(#1a1208) 정지 화면 (라운드 54)
 *   1.0–3.0s 셔플 2.0s — 16칸이 각자 60~140ms 무작위 간격으로 A–Z를 교체하며,
 *            글자가 바뀔 때마다 3색(#f49938/#96ab9b/#845d5e) 중 무작위 재배정
 *   3.0s     고정 — CWEL / LAZY / UCOM / BETO. LAZY·CLUB 7글자는 세 컬러 중
 *            무작위 1색으로 통일(새로고침마다 다름), 나머지 9글자(=WELCOME TO)는
 *            셔플 마지막 색 유지 — 단 단색과 같으면 다른 색으로 치환
 *            (써클 주위 글자는 써클 안 글자와 반드시 다른 색)
 *   3.3s     LAZY 동그라미 — 글자 확정 후 0.3s, 한 번에 짠 (라운드 59)
 *   3.6s     CLUB 동그라미 — 다시 0.3s 뒤. 글자 확정과 동시에 그리지 않는다
 *   3.6–4.6s 정지 유지 (써클까지 완성된 화면을 1.0s — 라운드 60)
 *   4.6s     최종 상태 — 내비·푸터가 색을 되찾아 노출 (페이드 없이 즉시)
 *
 * 레이아웃 불변 (라운드 48 핵심): 내비·푸터는 t=0부터 최종 레이아웃 그대로
 * 렌더하고, 인트로 동안에만 배경색으로 맞춰 숨긴다(로고 이미지는 opacity 0).
 * 따라서 시작 시점과 끝 시점의 화면 배치가 완전히 같고 그리드는 1px도 움직이지 않는다.
 * 스크롤은 잠그지 않는다 — 잠그면 데스크톱 스크롤바가 사라지며 폭이 바뀐다.
 * 대신 스크롤·휠은 스킵 트리거라 인트로가 즉시 끝난다.
 *
 * 입력(라운드 57): 인트로를 끊지 않는다. 터치·클릭·키·휠·스크롤이 들어오면
 * **내비·푸터만 먼저 드러내고** 애니메이션은 끝까지 재생된다 — 한 번의 터치로
 * 연출 전체가 날아가지 않게. reduced-motion만 예외로 즉시 최종 상태.
 * 인트로는 방문마다 재생.
 *
 * 구현: 단일 rAF 클록 + 순수 함수 stateAt. 난수는 마운트 시 시드 하나만 뽑고
 * (셔플 글자·색·간격·단색은 전부 시드 해시로 유도) stateAt은 읽기만 한다 —
 * 프레임마다 Math.random()을 부르면 화면이 발작하듯 재추첨된다.
 * 시드는 클라이언트 effect에서 생성 (SSR 첫 페인트는 웰컴 배열 → 배치 동일).
 */

import { useEffect, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { BASE, WorkroomShell } from "../Shell"
import styles from "./coming-soon.module.css"

// 오프닝 1.0s — WELCOME TO + 채움 X (라운드 48 도입 · 54에서 0.5s→1.0s)
const WELCOME = [
  ["W", "E", "L", "X"],
  ["C", "O", "M", "E"],
  ["T", "O", "X", "X"],
  ["X", "X", "X", "X"],
]
// 최종 배열 — 2행 = LAZY(가로), 1열 = CLUB(세로, L 공유).
// 나머지 9칸을 행 순서로 읽으면 W E L C O M E T O (라운드 48)
const GRID = [
  ["C", "W", "E", "L"],
  ["L", "A", "Z", "Y"],
  ["U", "C", "O", "M"],
  ["B", "E", "T", "O"],
]
const HOT = new Set(["0-0", "1-0", "2-0", "3-0", "1-1", "1-2", "1-3"]) // C·L·U·B + A·Z·Y

const PALETTE = ["#f49938", "#96ab9b", "#845d5e"]
const INK = "#1a1208"
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

/* 타임라인 (ms) — 1회성, 총 5.0s */
const T = {
  WELCOME: 1000, // 웰컴 정지 화면 종료 — 셔플 시작 (라운드 54: 0.5s → 1.0s)
  FIX: 3000, // 셔플 종료(2.0s) — LAZY·CLUB 고정
  CAP_LAZY: 3300, // LAZY 동그라미 — 글자 확정 후 0.3s, 한 번에 짠 (라운드 59)
  CAP_CLUB: 3600, // CLUB 동그라미 — 다시 0.3s 뒤
  END: 4600, // 최종 상태 — 써클까지 그린 뒤 1.0s 유지하고 내비·푸터 노출 (라운드 60)
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
      if (e < T.WELCOME) {
        // 오프닝 — 잉크 단색 정지 (색 규칙과 별개)
        cells.push({ ch: WELCOME[r][c], color: INK })
        continue
      }
      // 칸별 셔플 간격 60~140ms (시드로 고정)
      const interval = 60 + rnd(seed, i, 999) * 80
      // 고정 이후에는 마지막 틱에 멈춘다 → 색이 이어진다
      const tick = Math.floor((Math.min(e, T.FIX - 1) - T.WELCOME) / interval)
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

/** 시드 전(SSR 포함) 첫 페인트 — 웰컴 배열 잉크 단색. 배치는 이후와 동일 */
const INITIAL: Cell[] = WELCOME.flat().map((ch) => ({ ch, color: INK }))

export function ComingSoonMain() {
  const [elapsed, setElapsed] = useState(0)
  const [seed, setSeed] = useState<number | null>(null)
  // 입력이 있으면 인트로를 끊지 않고 내비·푸터만 먼저 내보낸다 (라운드 57)
  const [chromeEarly, setChromeEarly] = useState(false)

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
    const tick = (now: number) => {
      const e = now - start
      if (e >= T.END) {
        setElapsed(T.END)
        removeListeners()
        return
      }
      setElapsed(e)
      raf = requestAnimationFrame(tick)
    }
    // 입력 — 인트로를 끊지 않는다. 내비·푸터만 먼저 드러내고 애니메이션은 끝까지 재생
    // (라운드 57: 터치 한 번에 연출이 통째로 날아가던 동작 폐기)
    const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const
    const onInput = () => setChromeEarly(true)
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

  const gridInner = (
    <>
      {cells.map((cell, i) => (
        <span key={i} className={styles.cell} style={{ color: cell.color }} aria-hidden>
          {cell.ch}
        </span>
      ))}
      {/* 빙고 동그라미 — 각각 한 번에 짠 하고 나타난다 (라운드 59, 4스텝 와이프 폐기).
          글자 확정 0.3s 뒤 LAZY, 다시 0.3s 뒤 CLUB */}
      {s?.capLazy && <div className={`${styles.capsule} ${styles.capRow}`} aria-hidden />}
      {s?.capClub && <div className={`${styles.capsule} ${styles.capCol}`} aria-hidden />}
    </>
  )

  // 셸은 t=0부터 최종 레이아웃 그대로 — 인트로 동안 내비·푸터만 배경색으로 가린다
  // (인트로가 끝났거나, 사용자가 입력해 크롬을 먼저 요청했으면 노출)
  return (
    <WorkroomShell paper="#f8f3ef" chromeHidden={!s?.done && !chromeEarly}>
      <main className={styles.main}>
        <div className={styles.stage}>
          {/* 인트로가 끝나면 마크 전체가 레이지클럽 홈으로 가는 링크가 된다 (라운드 58).
              화면에는 어떤 표시도 더하지 않는다 — 마크가 변하지 않는다는 것이 선택 이유.
              반응은 hover·press의 옅은 그림자뿐 (모바일은 상시 옅은 그림자) */}
          {s?.done ? (
            <LazydayLink href={BASE} className={`${styles.grid} ${styles.gridLink}`} aria-label="레이지클럽 홈으로">
              {gridInner}
            </LazydayLink>
          ) : (
            <div className={styles.grid} aria-label="LAZY CLUB">
              {gridInner}
            </div>
          )}
        </div>
      </main>
    </WorkroomShell>
  )
}
