"use client"

/**
 * Coming Soon 후반부(클라이맥스) 개선 시안 3안 — 라운드 40
 * 운영자: "처음부터 쭉 좋은데 후반부 임팩트가 전혀 없다"
 *
 * 진단: 현재는 써클이 서고 나면 그냥 유지 → 소등이라, 퍼즐을 '푼' 사건이
 * 결말 없이 흐지부지된다. 세 안 모두 써클 완성(=단서 수집 완료) 직후에
 * "그래서 이게 무엇인가"를 밝히는 한 방을 넣는다. 그라데이션 없음,
 * 사라짐은 일괄, 하드 스텝 문법 유지.
 *
 * A. 정답 반전 — 배경이 잉크로 뒤집히고 LAZY·CLUB만 종이색으로 남는다(2프레임 깜빡).
 * B. 낱말 추출 — 나머지 글자가 일괄 소멸하고 남은 7글자가 중앙으로 모여 LAZY CLUB 워드마크가 된다.
 * C. 스탬프 — 두 단어 위에 잉크 블록이 쾅 찍히고(글자 반전), 아래에 LAZY CLUB이 타이핑된다.
 */

import { useEffect, useState } from "react"
import styles from "./finale.module.css"

const GRID = [
  ["C", "D", "E", "F"],
  ["L", "A", "Z", "Y"],
  ["U", "V", "W", "X"],
  ["B", "C", "D", "E"],
]
const PHRASE = "COMING SOON"
const CURSOR1_PATH = ["0-0", "1-0", "2-0", "3-0"]
const CURSOR2_PATH = ["1-1", "1-2", "1-3"]
const CURSOR2_LAG = 2
const HOT = new Set([...CURSOR1_PATH, ...CURSOR2_PATH])

const T = {
  TYPE_END: 2000,
  VANISH: 3800,
  CRAWL_START: 4200,
  STEP: 380,
  CAP_LAZY_THIN: 6300,
  CAP_LAZY_THICK: 6650,
  CAP_CLUB_THIN: 7000,
  CAP_CLUB_THICK: 7350,
  FINALE: 7900, // 클라이맥스 시작 (라운드 40 신설)
  OFF: 10400,
  CYCLE: 11500,
}

const VARIANTS = [
  {
    key: "invert",
    name: "A. 정답 반전",
    desc: "써클이 완성되는 순간 화면 전체가 잉크색으로 뒤집히고 LAZY·CLUB 두 단어만 종이색으로 남습니다. 2프레임 깜빡인 뒤 반전 상태로 머뭅니다. 브라우저가 통째로 반응하는 y2k 특유의 하드 인버전.",
    reco: "추천안 — 코드 몇 줄로 가장 큰 임팩트. 배경 전환이라 '사건이 끝났다'가 즉시 읽히고, 오트→잉크 대비가 브랜드 팔레트 안에서 해결됩니다.",
  },
  {
    key: "extract",
    name: "B. 낱말 추출",
    desc: "퍼즐의 나머지 아홉 글자가 일괄 소멸하고, 찾아낸 일곱 글자가 제자리에서 중앙으로 미끄러져 'LAZY CLUB' 워드마크로 조립됩니다. 퍼즐 → 로고로 정체가 드러나는 구조.",
    reco: "서사가 가장 명확한 안. 글자가 움직이므로 '이동은 있어도 되는가'를 확인해야 합니다(현재 규칙은 이동 금지가 아님).",
  },
  {
    key: "stamp",
    name: "C. 스탬프",
    desc: "두 단어 위로 잉크 블록이 쾅 찍혀 글자가 반전되고, 그리드 아래에 'LAZY CLUB'이 한 글자씩 타이핑됩니다. 앞의 CLI 타이핑과 짝을 이루는 마무리.",
    reco: "가장 조용하지만 정보(브랜드명)를 확실히 남깁니다. 임팩트는 A보다 약합니다.",
  },
] as const

type Key = (typeof VARIANTS)[number]["key"]

function stateAt(e: number, variant: Key) {
  const textVisible = e < T.VANISH
  const typed = !textVisible ? 0 : e >= T.TYPE_END ? PHRASE.length : Math.floor((e / T.TYPE_END) * PHRASE.length)
  const blockCursor = textVisible && (e < T.TYPE_END ? true : Math.floor((e - T.TYPE_END) / 450) % 2 === 0)

  const live = e >= T.CRAWL_START && e < T.OFF
  const step = live ? Math.floor((e - T.CRAWL_START) / T.STEP) : -1
  const cursor1 = step >= 0 && step < CURSOR1_PATH.length ? CURSOR1_PATH[step] : null
  const c2i = step - CURSOR2_LAG
  const cursor2 = c2i >= 0 && c2i < CURSOR2_PATH.length ? CURSOR2_PATH[c2i] : null

  const lit = new Set<string>()
  if (live) {
    CURSOR1_PATH.forEach((k, i) => step >= i && lit.add(k))
    CURSOR2_PATH.forEach((k, i) => step >= i + CURSOR2_LAG && lit.add(k))
  }
  const capClub = live ? (e >= T.CAP_CLUB_THICK ? 2 : e >= T.CAP_CLUB_THIN ? 1 : 0) : 0
  const capLazy = live ? (e >= T.CAP_LAZY_THICK ? 2 : e >= T.CAP_LAZY_THIN ? 1 : 0) : 0

  // ── 클라이맥스 ──
  const f = live && e >= T.FINALE ? e - T.FINALE : -1
  // A: 반전 (2프레임 깜빡: on-off-on)
  const inverted = variant === "invert" && f >= 0 && (f < 120 || (f >= 240 && f < 360) || f >= 480)
  // B: 추출 (나머지 소멸 → 중앙 조립)
  const extracted = variant === "extract" && f >= 200
  const othersGone = variant === "extract" && f >= 0
  // C: 스탬프 + 하단 워드마크 타이핑
  const stamped = variant === "stamp" && f >= 0
  const markTyped = variant === "stamp" && f >= 300 ? Math.min(9, Math.floor((f - 300) / 110)) : 0

  return { textVisible, typed, blockCursor, cursor1, cursor2, lit, capClub, capLazy, inverted, extracted, othersGone, stamped, markTyped }
}

export function FinaleShowcase() {
  const [variant, setVariant] = useState<Key>("invert")
  const [now, setNow] = useState(0)
  const [frozen, setFrozen] = useState<number | null>(null)

  // ?t=8200&v=invert — 검토 스크린샷용: 사이클 내 특정 시점 고정
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const t = Number(q.get("t"))
    if (Number.isFinite(t) && q.get("t")) setFrozen(t % T.CYCLE)
    const pick = q.get("v")
    if (pick && VARIANTS.some((x) => x.key === pick)) setVariant(pick as Key)
  }, [])

  useEffect(() => {
    if (frozen !== null) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      setNow((t - start) % T.CYCLE)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [frozen])

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[class*="previewBar"]'))
    els.forEach((el) => (el.style.display = "none"))
    return () => els.forEach((el) => (el.style.display = ""))
  }, [])

  const s = stateAt(frozen ?? now, variant)
  const v = VARIANTS.find((x) => x.key === variant)!
  const capClass = (n: number) => (n === 2 ? styles.capThick : n === 1 ? styles.capThin : "")

  return (
    <div className={`${styles.page} ${s.inverted ? styles.inverted : ""}`}>
      <div className={styles.head}>COMING SOON 후반부 임팩트 시안 — A / B / C</div>

      <div className={styles.stageWrap}>
        <div className={styles.stage}>
          <div className={`${styles.grid} ${s.extracted ? styles.gridExtract : ""}`} aria-label="LAZY CLUB">
            {GRID.map((row, r) =>
              row.map((ch, c) => {
                const key = `${r}-${c}`
                const hot = HOT.has(key)
                const isCursor = s.cursor1 === key || s.cursor2 === key
                const cls = [
                  styles.cell,
                  s.lit.has(key) ? styles.lit : "",
                  isCursor ? styles.cellCursor : "",
                  s.inverted && hot ? styles.cellInvert : "",
                  s.stamped && hot ? styles.cellStamp : "",
                  s.othersGone && !hot ? styles.cellGone : "",
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
            <div className={`${styles.capsule} ${styles.capRow} ${capClass(s.capLazy)}`} aria-hidden />
            <div className={`${styles.capsule} ${styles.capCol} ${capClass(s.capClub)}`} aria-hidden />
          </div>

          <div className={styles.overlay} aria-label="COMING SOON">
            <span className={styles.typeBox} aria-hidden>
              <span className={styles.sizer}>{PHRASE}▮</span>
              {s.textVisible && (
                <span className={styles.typedLine}>
                  {PHRASE.slice(0, s.typed)}
                  <span className={s.blockCursor ? "" : styles.hidden}>▮</span>
                </span>
              )}
            </span>
          </div>

          {/* C안 — 하단 워드마크 타이핑 */}
          {variant === "stamp" && (
            <div className={styles.wordmark} aria-hidden>
              {"LAZY CLUB".slice(0, s.markTyped)}
            </div>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        {VARIANTS.map((x) => (
          <button
            key={x.key}
            type="button"
            className={`${styles.tab} ${x.key === variant ? styles.tabActive : ""}`}
            onClick={() => setVariant(x.key)}
          >
            {x.name}
          </button>
        ))}
      </div>
      <div className={styles.desc}>
        <p>{v.desc}</p>
        <p className={styles.reco}>{v.reco}</p>
      </div>
    </div>
  )
}
