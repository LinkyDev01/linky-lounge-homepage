"use client"

/**
 * LAZY CLUB 모션 타이포그래피 시안 5종 — 픽셀 키네틱 (릴 레퍼런스의 웹 구현 검증)
 *
 * 레퍼런스: instagram @antonin.work 릴 — Cavalry(모션 툴)의 '사각형 패턴 + 셀 단위
 * 제어' 문법. 글자를 작은 사각형 셀의 격자로 만들고 셀 하나하나가 이동·회전·점멸하며
 * 타이포가 드러난다. 여기서는 같은 문법을 외부 라이브러리 없이 CSS 애니메이션 +
 * 셀별 지연/색 변수로 구현한다 — 글자당 5×7 비트맵, 워드마크 전체 23×16 격자.
 *
 * 랜딩 인트로(coming-soon)와 별개의 시안 전용 페이지. 실사이트 무변경.
 *
 * 난수 규율 (ComingSoonMain 선례): 시드 하나에서 해시로만 유도 — 프레임/렌더마다
 * Math.random() 금지. 시드는 클라이언트 effect에서 1회 생성(SSR 첫 페인트는 정지
 * 워드마크 → 하이드레이션 불일치 없음), 재생마다 run 카운터로 파생 시드를 바꾼다.
 *
 * 라운드 2 (운영자):
 * ① 정렬(완성) 후에도 셀별 난수 3색을 유지한다 — 잉크 통일 폐기. 완성 마크 = 3색 모자이크.
 * ② 릴의 "무수한 텍스트" 밀도 재현 — F 워드서치 필드 신설 (21×13 = 273자 셔플 필드
 *    속에 브랜드 마크 기하 그대로 LAZY 가로·CLUB 세로, L 공유 + 캡슐). 추천안 교체.
 */

import { useEffect, useMemo, useReducer, useState } from "react"
import styles from "./motion-type.module.css"

const PALETTE = ["#f49938", "#96ab9b", "#845d5e"] as const

// 5×7 픽셀 비트맵 — 셀 단위 제어를 위해 글자를 격자 데이터로 갖는다 (서체 아님)
const GLYPHS: Record<string, string[]> = {
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
}

// 워드마크 격자: LAZY / CLUB 2행 적층. 글자 5열 + 글자 사이 1열 = 23열,
// 7행 + 행간 2행 + 7행 = 16행. gcol/grow 는 격자 전역 좌표.
const LINES = ["LAZY", "CLUB"] as const
const COLS = 23
const ROWS = 16

type Px = { on: boolean; gcol: number; grow: number; i: number }

const CELLS: Px[] = (() => {
  const out: Px[] = []
  let i = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const line = r < 7 ? 0 : r >= 9 ? 1 : -1
      let on = false
      if (line !== -1) {
        const li = Math.floor(c / 6)
        const cc = c % 6
        if (li < 4 && cc < 5) on = GLYPHS[LINES[line][li]][line === 0 ? r : r - 9][cc] === "1"
      }
      out.push({ on, gcol: c, grow: r, i: i++ })
    }
  }
  return out
})()
const ON_CELLS = CELLS.filter((p) => p.on)

/** 결정적 해시 → [0,1) — 시드·칸·태그가 같으면 항상 같은 값 (ComingSoonMain과 동일) */
function rnd(seed: number, a: number, b: number) {
  let h = (seed ^ (a * 374761393) ^ (b * 668265263)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return h / 4294967296
}
const pick = (seed: number, a: number, b: number) => PALETTE[Math.floor(rnd(seed, a, b) * 3)]

const area = (p: Px) => ({ gridColumn: p.gcol + 1, gridRow: p.grow + 1 })

const VARIANTS = [
  {
    key: "asm",
    name: "A. 조립 스윕",
    desc: "셀이 브랜드 3색으로 튀어 오르며 대각선 스윕으로 글자를 조립합니다. 도착한 뒤에도 셀마다의 색을 그대로 유지해, 완성된 마크가 3색 모자이크로 남습니다. 인트로·섹션 헤더처럼 '한 번 드러나면 끝'인 자리의 기본형.",
    reco: "차분한 리빌이 필요하면 이 안. 루프 없이 정지 상태로 끝나는 유일한 안입니다 (시안에서는 비교를 위해 자동 반복).",
  },
  {
    key: "noise",
    name: "B. 노이즈 리졸브",
    desc: "화면을 가득 채운 3색 노이즈(지직임)가 좌→우 스캔으로 걷히며 LAZY CLUB만 남습니다. 확정된 글자는 지직이던 그 순간의 색 그대로 굳습니다 — '무질서한 패턴 속에서 글자가 수신된다'는 전파 감성.",
    reco: "임팩트를 원하면 이 안. 노이즈 밀도(셀 368개)가 커서 여백이 많은 화면에 놓아야 삽니다.",
  },
  {
    key: "reorg",
    name: "C. 셀 재배열",
    desc: "무작위로 쌓인 3색 블록 덩어리가 셀 단위로 미끄러져 이동하며 글자로 재조립되고, 완성을 한동안 유지한 뒤 다시 흩어졌다 모이기를 반복합니다. 색은 처음부터 끝까지 셀 고유의 3색 — 도형이 재배열되어 타이포가 되는 릴의 핵심 문법.",
    reco: "차선 — '흩어진 조각이 하나의 클럽으로 모인다'는 브랜드 서사로 읽히고, 랜딩 4×4 셔플 인트로와 정서가 이어집니다.",
  },
  {
    key: "flip",
    name: "D. 플립닷 웨이브",
    desc: "공항 전광판(플립닷)처럼 셀이 앞뒤로 뒤집히는 무한 루프 — 뒤집힐 때마다 앞·뒷면의 난수 3색이 서로 교대합니다. 대각선 파도가 주기적으로 마크를 훑고 지나갑니다. 등장 후에도 계속 살아 있어야 하는 자리(대기 화면·히어로 상주)용.",
    reco: "정지 없이 계속 도는 안 — 시선을 오래 붙잡지만, 본문 곁에 두면 산만할 수 있습니다.",
  },
  {
    key: "cuts",
    name: "E. 자이언트 컷",
    desc: "L·A·Z·Y·C·L·U·B 여덟 글자가 한 글자씩 화면을 가득 채우며 빠르게 컷 전환된 뒤, 전체 마크가 3색 모자이크로 착지합니다. 릴 특유의 비트감·리듬감이 가장 강한 안 — 소리 없는 웹에서도 시선을 세게 잡습니다.",
    reco: "SNS 영상 문법 그대로라 짧은 캠페인·오프닝에 어울립니다. 매 방문 반복되면 피로할 수 있어 1회성 연출에 권장.",
  },
  {
    key: "dense",
    name: "F. 워드서치 필드 (추천)",
    desc: "화면을 가득 채운 무수한 글자(273자)가 쉼 없이 색과 글자를 뒤섞다가, 스윕이 지나가면 그 속에 숨어 있던 LAZY(가로)·CLUB(세로, L 공유)만 또렷해지고 주변은 흐려진 채 계속 웅성입니다. 잠시 뒤 단어 찾기 동그라미가 짠·짠 그려지고, 다시 전체가 뒤섞이는 무한 루프.",
    reco: "추천안 — 릴의 '무수한 텍스트' 밀도에 가장 가깝고, 랜딩 4×4 워드서치 마크의 문법(숨은 단어+동그라미)을 그대로 큰 밀도로 확장한 것이라 브랜드 정체성 연결이 가장 강합니다.",
  },
] as const

type VariantKey = (typeof VARIANTS)[number]["key"]

type StageProps = { seed: number; reduced: boolean; onCycle: () => void }

/** 사이클형 시안의 자동 반복 — 완주 후 부모에 알리면 새 시드로 재마운트된다 */
function useCycle(onCycle: () => void, ms: number, reduced: boolean) {
  useEffect(() => {
    if (reduced) return
    const t = setTimeout(onCycle, ms)
    return () => clearTimeout(t)
  }, [onCycle, ms, reduced])
}

/* ── A. 조립 스윕 ── */
function AssembleStage({ seed, reduced, onCycle }: StageProps) {
  useCycle(onCycle, 4300, reduced)
  return (
    <div className={styles.board} aria-label="LAZY CLUB">
      {ON_CELLS.map((p) => (
        <i
          key={p.i}
          className={styles.asm}
          style={
            {
              ...area(p),
              "--c": pick(seed, p.i, 11),
              "--d": `${(p.gcol * 26 + p.grow * 14 + rnd(seed, p.i, 22) * 140).toFixed(0)}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

/* ── B. 노이즈 리졸브 — 전 격자(368셀)가 지직이다 좌→우 스캔으로 글자만 남는다 ── */
function NoiseStage({ seed, reduced, onCycle }: StageProps) {
  useCycle(onCycle, 4100, reduced)
  return (
    <div className={styles.board} aria-label="LAZY CLUB">
      {CELLS.map((p) => (
        <i
          key={p.i}
          className={p.on ? styles.nzOn : styles.nzOff}
          style={
            {
              ...area(p),
              "--c": pick(seed, p.i, 3),
              "--fd": `${(0.32 + rnd(seed, p.i, 7) * 0.3).toFixed(2)}s`,
              "--fj": `${(-rnd(seed, p.i, 13) * 0.6).toFixed(2)}s`,
              "--d": `${(p.gcol * 34 + rnd(seed, p.i, 91) * 110 + 240).toFixed(0)}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

/* ── C. 셀 재배열 — 팩 블록(12×10) ↔ 워드마크를 오가며 셀이 실제로 이동한다 ── */
function ReorgStage({ seed, reduced }: { seed: number; reduced: boolean }) {
  const [formed, setFormed] = useState(reduced)
  useEffect(() => {
    if (reduced) return
    let on = false
    let t = setTimeout(function step() {
      on = !on
      setFormed(on)
      // 완성 3.9s 유지 → 1.5s 만에 해체 → 다시 조립 (해체도 같은 셀 이동으로)
      t = setTimeout(step, on ? 3900 : 1500)
    }, 350)
    return () => clearTimeout(t)
  }, [reduced])

  // 팩 상태의 셀 배치 — 중앙 12×10 블록에 시드 순서로 적재 (재생마다 결이 바뀐다)
  const packed = useMemo(() => {
    const order = ON_CELLS.map((_, k) => k).sort((a, b) => rnd(seed, a, 303) - rnd(seed, b, 303))
    const pos = new Array<{ sx: number; sy: number }>(ON_CELLS.length)
    order.forEach((cellIdx, slot) => {
      const p = ON_CELLS[cellIdx]
      pos[cellIdx] = { sx: 5.5 + (slot % 12) - p.gcol, sy: 3 + Math.floor(slot / 12) - p.grow }
    })
    return pos
  }, [seed])

  return (
    <div className={`${styles.board} ${formed ? styles.formed : ""}`} aria-label="LAZY CLUB">
      {ON_CELLS.map((p, k) => (
        <i
          key={p.i}
          className={styles.mg}
          style={
            {
              ...area(p),
              "--c": pick(seed, p.i, 5),
              "--sx": String(packed[k].sx),
              "--sy": String(packed[k].sy),
              "--td": `${(p.gcol * 12 + rnd(seed, p.i, 71) * 280).toFixed(0)}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

/* ── D. 플립닷 웨이브 — 등장 후 대각선 파도로 무한 반전 (사이클 없음).
      앞면 --c ↔ 뒷면 --c2, 서로 다른 난수 색 (라운드 2: 잉크 면 폐기) ── */
function FlipStage({ seed }: { seed: number }) {
  return (
    <div className={styles.board} aria-label="LAZY CLUB">
      {ON_CELLS.map((p) => {
        const ci = Math.floor(rnd(seed, p.i, 9) * 3)
        const c2 = PALETTE[(ci + 1 + Math.floor(rnd(seed, p.i, 19) * 2)) % 3]
        return (
          <i
            key={p.i}
            className={styles.fd}
            style={
              {
                ...area(p),
                "--c": PALETTE[ci],
                "--c2": c2,
                "--d": `${((p.gcol + p.grow) * 34 + rnd(seed, p.i, 17) * 60).toFixed(0)}ms`,
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

/* ── E. 자이언트 컷 — 글자별 풀 스테이지 컷 8연타 → 전체 마크 착지 ── */
const SEQ = ["L", "A", "Z", "Y", "C", "L", "U", "B"] as const

function CutsStage({ seed, reduced, onCycle }: StageProps) {
  const [step, setStep] = useState(reduced ? SEQ.length : 0)
  useEffect(() => {
    if (reduced) return
    if (step < SEQ.length) {
      const t = setTimeout(() => setStep(step + 1), step === 0 ? 460 : 320)
      return () => clearTimeout(t)
    }
    const t = setTimeout(onCycle, 3050)
    return () => clearTimeout(t)
  }, [step, reduced, onCycle])

  if (step < SEQ.length) {
    const g = GLYPHS[SEQ[step]]
    return (
      <div key={step} className={styles.giant} aria-label={SEQ[step]}>
        {g.flatMap((rowStr, r) =>
          rowStr.split("").map((v, c) =>
            v === "1" ? (
              <i
                key={`${r}-${c}`}
                className={styles.gc}
                style={
                  {
                    gridColumn: c + 1,
                    gridRow: r + 1,
                    "--c": PALETTE[step % 3],
                    "--d": `${(rnd(seed, step * 40 + r * 5 + c, 9) * 90).toFixed(0)}ms`,
                  } as React.CSSProperties
                }
              />
            ) : null,
          ),
        )}
      </div>
    )
  }
  return (
    <div className={styles.board} aria-label="LAZY CLUB">
      {ON_CELLS.map((p) => (
        <i
          key={p.i}
          className={styles.cut}
          style={
            {
              ...area(p),
              "--c": pick(seed, p.i, 21),
              "--d": `${(rnd(seed, p.i, 33) * 260).toFixed(0)}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

/* ── F. 워드서치 필드 — 릴의 "무수한 텍스트" 밀도 (라운드 2 신설).
      21×13 = 273자 필드가 쉼 없이 글자·색을 뒤섞고, 잠금 스윕이 지나가면 그 속의
      LAZY(가로)·CLUB(세로, L 공유 — 브랜드 마크 기하 그대로)만 또렷해진다.
      주변 글자는 흐려진 채 계속 웅성이고, 캡슐 두 개가 짠·짠 그려진 뒤 전체가
      다시 뒤섞이는 무한 루프. 셔플은 rAF 클록(50ms 양자화 — 이산 교체라 충분)이
      구동하고 stateless 해시로만 읽는다. ── */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const D_COLS = 21
const D_ROWS = 13
// 워드서치 배치 — LAZY 4행(가로) · CLUB 8열(세로), (4,8)의 L 공유
const D_WORD: Record<string, string> = {
  "3-8": "C",
  "4-8": "L",
  "5-8": "U",
  "6-8": "B",
  "4-9": "A",
  "4-10": "Z",
  "4-11": "Y",
}
/* 타임라인 (라운드 4, 운영자): ① 난수 필드가 옅어지기 전 유지 구간 3배 —
   SCRAMBLE 1300 → 3900 ② 두 캡슐이 그려진 뒤 유지 절반 — CAP2→RESET 3400 → 1700.
   나머지 간격(스윕 900 · 잠금→캡슐 700·300 · 해제 꼬리 600)은 종전 그대로 뒤로 밀린다 */
const DT = { SCRAMBLE: 3900, SWEEP: 900, CAP1: 5500, CAP2: 5800, RESET: 7500, CYCLE: 8100 }

/* ── 캡슐 기하 — 기존 레이지클럽 마크(coming-soon)에서 실측한 비율 그대로 (라운드 3, 운영자
   "레이지와 클럽을 감싼 테두리 길쭉한 동그라미 … 굵고 여백이 넓어 보여").
   실측: 글자가 흐르는 방향으로는 살짝 넘치고(가로 1.04 / 세로 1.03), 직교 방향으로는
   칸보다 **좁다**(가로캡슐 높이 0.84행 / 세로캡슐 폭 0.88열) — 글자에 딱 붙는 문법이다.
   라운드 2는 직교로 1.23~1.49배 부풀어 있어 여백이 넓어 보였다. */
const CAP_ALONG_ROW = 1.04
const CAP_ACROSS_ROW = 0.84
const CAP_ALONG_COL = 1.03
const CAP_ACROSS_COL = 0.88
const D_COL_W = 100 / D_COLS
const D_ROW_H = 100 / D_ROWS
const pct = (v: number) => `${v.toFixed(3)}%`

/** 글자 칸 범위(열 c0부터 cols칸 · 행 r0부터 rows칸)를 감싸는 캡슐 상자 — 중심은 유지하고
    진행 방향(along)·직교 방향(across)에 실측 배율만 적용한다 */
function capBox(c0: number, cols: number, r0: number, rows: number, horizontal: boolean) {
  const x0 = c0 * D_COL_W
  const w0 = cols * D_COL_W
  const y0 = r0 * D_ROW_H
  const h0 = rows * D_ROW_H
  const w = w0 * (horizontal ? CAP_ALONG_ROW : CAP_ACROSS_COL)
  const h = h0 * (horizontal ? CAP_ACROSS_ROW : CAP_ALONG_COL)
  return { left: pct(x0 - (w - w0) / 2), top: pct(y0 - (h - h0) / 2), width: pct(w), height: pct(h) }
}
// LAZY = 4행 8~11열(가로) · CLUB = 8열 3~6행(세로) — D_WORD 배치와 같은 좌표
const D_CAP_LAZY = capBox(8, 4, 4, 1, true)
const D_CAP_CLUB = capBox(8, 1, 3, 4, false)

export function DenseStage({ seed, reduced }: { seed: number; reduced: boolean }) {
  // 모션 최소화면 잠금+캡슐이 완성된 정지 화면에 고정
  const [clock, setClock] = useState(reduced ? 6800 : 0)
  useEffect(() => {
    if (reduced) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      // 50ms 양자화 — 셔플은 이산 교체라 20fps면 충분하고 리렌더 비용이 1/3로 준다
      const q = Math.floor((now - start) / 50) * 50
      setClock((p) => (p === q ? p : q))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  const phase = reduced ? 6800 : clock % DT.CYCLE
  const cycle = reduced ? 0 : Math.floor(clock / DT.CYCLE)
  const cells = []
  for (let r = 0; r < D_ROWS; r++) {
    for (let c = 0; c < D_COLS; c++) {
      const i = r * D_COLS + c
      const word = D_WORD[`${r}-${c}`]
      /* 잠금 스윕 (라운드 3 — 운영자 "뻣뻣해보이는 건 기분탓?"):
         종전은 열 좌표만 봐서 **같은 열 13칸이 한 프레임에 통째로** 넘어갔다 —
         계단이 눈에 보여 딱딱했다. 열이 주도하되 행·난수를 섞어 대각선 물결로 흩는다. */
      const lockAt =
        DT.SCRAMBLE + ((c / D_COLS) * 0.78 + (r / D_ROWS) * 0.14 + rnd(seed, i, 61) * 0.08) * DT.SWEEP
      // 해제(색이 다시 진해지는 것)도 잠금과 마찬가지로 좌→우로 확산한다
      // (라운드 4, 운영자 "다시 색 진해지는 것도 마찬가지로 우측방향으로 확산") —
      // 같은 물결 공식을 해제 길이(420ms)로 축소 적용
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
    <div className={styles.dense} aria-label="LAZY CLUB 워드서치 필드">
      {cells}
      {/* 캡슐은 clip-path 로 한쪽 끝에서부터 그어진다 (라운드 3) — 손으로 동그라미를
          치는 워드서치의 몸짓. 스타디움 모양이라 SVG 대신 clip-path 를 쓴다
          (SVG stroke 그리기는 늘린 타원이 되어 방금 맞춘 캡슐 비율이 깨진다) */}
      {capLazy && <div className={`${styles.dCap} ${styles.dCapRow}`} style={D_CAP_LAZY} aria-hidden />}
      {capClub && <div className={`${styles.dCap} ${styles.dCapCol}`} style={D_CAP_CLUB} aria-hidden />}
    </div>
  )
}

/** 시드 확정 전(SSR 포함) 정지 워드마크 — 배치가 이후와 동일해 화면이 튀지 않는다.
    색은 고정 시드 3색 모자이크: 상수라 서버·클라이언트 렌더가 같다 (라운드 2) */
function PreBoard() {
  return (
    <div className={styles.board} aria-label="LAZY CLUB">
      {ON_CELLS.map((p) => (
        <i
          key={p.i}
          className={styles.preCell}
          style={{ ...area(p), "--c": pick(7, p.i, 11) } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export function MotionTypeShowcase() {
  const [active, setActive] = useState<VariantKey>("dense")
  const [run, bump] = useReducer((x: number) => x + 1, 0)
  const [salt, setSalt] = useState<number | null>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setSalt(Math.floor(Math.random() * 2147483647) || 1)
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    // ?v=<key> — 시안 딥링크 (검토·스크린샷용)
    const q = new URLSearchParams(window.location.search).get("v")
    if (q && VARIANTS.some((x) => x.key === q)) setActive(q as VariantKey)
  }, [])

  // 레이지클럽 트리 공통 — 프리뷰 이동 바 숨김 (EffectsShowcase와 동일 규칙)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[class*="previewBar"]'))
    els.forEach((el) => {
      el.style.display = "none"
    })
    return () =>
      els.forEach((el) => {
        el.style.display = ""
      })
  }, [])

  // 파생 시드 — 탭 전환·재생마다 새 결. 렌더 중 Math.random() 금지 (헤더 주석 참조)
  const seed = salt === null ? null : ((salt ^ Math.imul(run + 1, 2654435761) ^ (active.charCodeAt(0) * 97)) >>> 0) || 1
  const v = VARIANTS.find((x) => x.key === active)!
  const stageKey = `${active}:${run}`

  return (
    <div className={styles.page}>
      <div className={styles.head}>LAZY CLUB 모션 타이포그래피 시안 — 픽셀 키네틱</div>
      <p className={styles.sub}>
        탭으로 6가지 모션 문법을 비교하세요. A–E는 23×16 픽셀 격자, F는 21×13 글자 필드입니다.
      </p>

      <div className={styles.stageWrap}>
        {seed === null ? (
          <PreBoard />
        ) : active === "asm" ? (
          <AssembleStage key={stageKey} seed={seed} reduced={reduced} onCycle={bump} />
        ) : active === "noise" ? (
          <NoiseStage key={stageKey} seed={seed} reduced={reduced} onCycle={bump} />
        ) : active === "reorg" ? (
          <ReorgStage key={stageKey} seed={seed} reduced={reduced} />
        ) : active === "flip" ? (
          <FlipStage key={stageKey} seed={seed} />
        ) : active === "dense" ? (
          <DenseStage key={stageKey} seed={seed} reduced={reduced} />
        ) : (
          <CutsStage key={stageKey} seed={seed} reduced={reduced} onCycle={bump} />
        )}
      </div>

      <div className={styles.tabs}>
        {VARIANTS.map((x) => (
          <button
            key={x.key}
            type="button"
            className={`${styles.tab} ${x.key === active ? styles.tabActive : ""}`}
            onClick={() => setActive(x.key)}
          >
            {x.name}
          </button>
        ))}
        <button type="button" className={styles.replay} onClick={bump}>
          다시 재생
        </button>
      </div>

      <div className={styles.desc}>
        <p>{v.desc}</p>
        <p className={styles.reco}>{v.reco}</p>
      </div>

      <p className={styles.note}>
        레퍼런스: @antonin.work 릴 (Cavalry 셀 패턴) · 웹 표준 CSS/JS만 사용, 라이브러리 없음 · 랜딩
        인트로와 별개의 시안 전용 페이지
      </p>
    </div>
  )
}
