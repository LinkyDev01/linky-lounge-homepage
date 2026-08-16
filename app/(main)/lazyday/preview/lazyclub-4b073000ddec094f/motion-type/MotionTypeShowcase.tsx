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
    desc: "셀이 브랜드 3색으로 튀어 오르며 대각선 스윕으로 글자를 조립하고, 도착하는 순간 잉크색으로 가라앉습니다. 한 방향으로 흐르는 가장 단정한 등장 — 인트로·섹션 헤더처럼 '한 번 드러나면 끝'인 자리의 기본형.",
    reco: "차분한 리빌이 필요하면 이 안. 루프 없이 정지 상태로 끝나는 유일한 안입니다 (시안에서는 비교를 위해 자동 반복).",
  },
  {
    key: "noise",
    name: "B. 노이즈 리졸브",
    desc: "화면을 가득 채운 3색 노이즈(지직임)가 좌→우 스캔으로 걷히며 LAZY CLUB만 남습니다. '무질서한 패턴 속에서 글자가 수신된다'는 전파 감성 — 릴의 밀도감에 가장 가까운 안.",
    reco: "임팩트 최우선이면 이 안. 노이즈 밀도(셀 368개)가 커서 여백이 많은 화면에 놓아야 삽니다.",
  },
  {
    key: "reorg",
    name: "C. 셀 재배열 (추천)",
    desc: "무작위로 쌓인 3색 블록 덩어리가 셀 단위로 미끄러져 이동하며 글자로 재조립되고, 완성을 한동안 유지한 뒤 다시 흩어졌다 모이기를 반복합니다. 도형이 재배열되어 타이포가 되는 릴의 핵심 문법을 그대로 옮긴 안.",
    reco: "추천안 — 릴과 문법이 같고, '흩어진 조각이 하나의 클럽으로 모인다'는 브랜드 서사로도 읽힙니다. 랜딩 4×4 셔플 인트로와 정서가 이어지면서 겹치지는 않습니다.",
  },
  {
    key: "flip",
    name: "D. 플립닷 웨이브",
    desc: "공항 전광판(플립닷)처럼 셀이 앞뒤로 뒤집히며 잉크↔3색을 오가는 무한 루프. 대각선 파도가 주기적으로 마크를 훑고 지나갑니다. 등장 후에도 계속 살아 있어야 하는 자리(대기 화면·히어로 상주)용.",
    reco: "정지 없이 계속 도는 유일한 안 — 시선을 오래 붙잡지만, 본문 곁에 두면 산만할 수 있습니다.",
  },
  {
    key: "cuts",
    name: "E. 자이언트 컷",
    desc: "L·A·Z·Y·C·L·U·B 여덟 글자가 한 글자씩 화면을 가득 채우며 빠르게 컷 전환된 뒤, 전체 마크로 착지합니다. 릴 특유의 비트감·리듬감이 가장 강한 안 — 소리 없는 웹에서도 시선을 세게 잡습니다.",
    reco: "SNS 영상 문법 그대로라 짧은 캠페인·오프닝에 어울립니다. 매 방문 반복되면 피로할 수 있어 1회성 연출에 권장.",
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
      {ON_CELLS.map((p, k) => {
        const td = p.gcol * 12 + rnd(seed, p.i, 71) * 280
        return (
          <i
            key={p.i}
            className={styles.mg}
            style={
              {
                ...area(p),
                "--c": pick(seed, p.i, 5),
                "--sx": String(packed[k].sx),
                "--sy": String(packed[k].sy),
                "--td": `${td.toFixed(0)}ms`,
                "--tc": `${(td + 380).toFixed(0)}ms`,
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

/* ── D. 플립닷 웨이브 — 등장 후 대각선 파도로 무한 반전 (사이클 없음) ── */
function FlipStage({ seed }: { seed: number }) {
  return (
    <div className={styles.board} aria-label="LAZY CLUB">
      {ON_CELLS.map((p) => (
        <i
          key={p.i}
          className={styles.fd}
          style={
            {
              ...area(p),
              "--c": pick(seed, p.i, 9),
              "--d": `${((p.gcol + p.grow) * 34 + rnd(seed, p.i, 17) * 60).toFixed(0)}ms`,
            } as React.CSSProperties
          }
        />
      ))}
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

/** 시드 확정 전(SSR 포함) 정지 워드마크 — 배치가 이후와 동일해 화면이 튀지 않는다 */
function PreBoard() {
  return (
    <div className={styles.board} aria-label="LAZY CLUB">
      {ON_CELLS.map((p) => (
        <i key={p.i} className={styles.preCell} style={area(p)} />
      ))}
    </div>
  )
}

export function MotionTypeShowcase() {
  const [active, setActive] = useState<VariantKey>("reorg")
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
        탭으로 5가지 모션 문법을 비교하세요. 모든 안이 같은 23×16 셀 격자 위에서 움직입니다.
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
