"use client"

/**
 * 북클럽 히어로 모션 시안 4안 (라운드 133) — 인트로 또는 상단 포스터 대체.
 *
 * 재료는 **현행 4기 포스터의 조형 그대로**: ① 흩어진 큰 글자 12자(레이지데이
 * 북클럽 4기 모집) ② 그 사이를 문장이 실처럼 흐르는 얽힌 루프. 새 도형 없음.
 * 데모는 포스터 구도를 축소 재현한 것 — 채택 시 실제 포스터 좌표로 정밀 이식.
 *
 * 실 위 문장은 데모에선 철학 원고('결') 확정 원문 발췌 — 실이식 시 포스터의
 * 원문(운영자 소유 카피)으로 교체한다.
 *
 * anime.js 문법: svg.createDrawable(①·③) / textPath+tspan 스태거(②) /
 * animate+spring(④). 모션 원칙 M1~M3 유지 — ①②는 진입 1회 후 완전 정지,
 * ③은 존재만 하는 루프, ④는 만진 사람만 발견.
 */

import { useEffect, useRef, useState } from "react"
import { animate, createSpring, svg } from "animejs"
import styles from "./hero-motion.module.css"

const TABS = [
  { key: "draw", label: "① 실선 인트로 (실이 먼저 그어진다)" },
  { key: "flow", label: "② 문장이 걸어 들어온다" },
  { key: "breathe", label: "③ 숨 쉬는 포스터 (도착 후 루프)" },
  { key: "touch", label: "④ 만지면 출렁이는 실" },
] as const

type TabKey = (typeof TABS)[number]["key"]

const META: Record<TabKey, { what: string; why: string }> = {
  draw: {
    what: "진입 1회: 실(문장의 루프)이 1.4초에 걸쳐 스스로 그어지고, 끝나갈 때 큰 글자 12자가 60ms 간격으로 내려앉는다. 총 ~2.2초 후 완전 정지 = 현행 포스터",
    why: "포스터가 '그려지는 과정'을 한 번만 보여주는 안. 재방문·스크롤 복귀 시 재생 없음 (M2). 라이브러리 없이도 대체 가능한 가장 견고한 구조",
  },
  flow: {
    what: "실이 선이 아니라 **문장 그 자체**로 들어온다 — 작은 글자들이 루프 경로를 따라 순서대로 자리를 잡고(글자당 12ms), 큰 글자가 뒤따라 앉는다. ~2.8초",
    why: "포스터의 본질(문장이 실이 된 조판)을 모션으로 정직하게 번역한 안. '불필요하게 고퀄' (M3). 데모 문장은 철학 원고 발췌 — 실이식 시 포스터 원문으로",
  },
  breathe: {
    what: "인트로가 끝난 뒤(또는 인트로 없이) 실이 극히 느리게 루프를 따라 흐른다 — 60초에 한 바퀴, 시선을 끌지 않는 속도. 큰 글자는 완전 정적",
    why: "존재만 하는 배경 루프 (M2 허용 유형). ①이나 ②의 도착 상태와 조합하는 안 — 포스터가 죽은 이미지가 아니라 아주 천천히 살아 있다",
  },
  touch: {
    what: "평소 완전 정적. 실을 만지면(호버·탭) 그 루프가 한 번 출렁이고 스프링으로 잦아든다. 연타해도 출렁임은 한 번에 하나",
    why: "발견형 (M3) — 아무 표시도 없고, 우연히 만진 사람만 안다. ①~③ 어느 안과도 조합 가능",
  },
}

export function HeroMotion() {
  const [tab, setTab] = useState<TabKey>("draw")
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>히어로 모션 — 포스터 기반 4안</h1>
        <p className={styles.lede}>
          현행 4기 포스터의 조형(큰 글자 12자 + 문장의 실 루프)을 그대로 재료로 쓴 인트로/포스터
          대체안입니다. 구도는 축소 재현 — 채택 시 실제 포스터 좌표로 이식합니다.
        </p>
        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`${styles.tabBtn} ${tab === t.key ? styles.tabBtnOn : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className={styles.meta}>
          <strong>동작</strong> {META[tab].what}
          <br />
          <strong>의도</strong> {META[tab].why}
        </p>
        {tab === "draw" && <DrawDemo />}
        {tab === "flow" && <FlowDemo />}
        {tab === "breathe" && <BreatheDemo />}
        {tab === "touch" && <TouchDemo />}
      </div>
    </main>
  )
}

/* ── 공통 조형 (포스터 축소 재현) ───────────────────────────
   viewBox 400×500. 루프 2벌(상단 얽힘 + 하단 8자꼴)과 큰 글자 12자.
   좌표는 포스터의 배치 감각을 따른 근사값 — 이식 시 정밀 좌표로. */

const LOOP_A = "M 82 178 C 64 70, 268 44, 316 148 C 348 224, 170 268, 138 186 C 116 122, 226 96, 262 150"
const LOOP_B =
  "M 66 408 C 48 300, 224 282, 258 356 C 290 428, 128 486, 106 402 C 92 340, 196 322, 238 372 C 286 428, 356 420, 368 340"

const GLYPHS: Array<{ ch: string; x: number; y: number; s: number; r: number }> = [
  { ch: "레", x: 128, y: 150, s: 46, r: 0 },
  { ch: "이", x: 196, y: 96, s: 46, r: 0 },
  { ch: "지", x: 296, y: 112, s: 46, r: 0 },
  { ch: "데", x: 236, y: 218, s: 46, r: 0 },
  { ch: "이", x: 318, y: 214, s: 46, r: 0 },
  { ch: "북", x: 118, y: 330, s: 46, r: 0 },
  { ch: "클", x: 262, y: 320, s: 46, r: 0 },
  { ch: "럽", x: 330, y: 352, s: 46, r: 0 },
  { ch: "4", x: 74, y: 452, s: 48, r: 0 },
  { ch: "기", x: 158, y: 444, s: 48, r: 0 },
  { ch: "모", x: 248, y: 452, s: 48, r: 0 },
  { ch: "집", x: 336, y: 466, s: 48, r: 0 },
]

function PosterGlyphs({ hidden }: { hidden?: boolean }) {
  return (
    <>
      {GLYPHS.map((g, i) => (
        <text
          key={i}
          x={g.x}
          y={g.y}
          fontSize={g.s}
          className={`${styles.glyph} posterGlyph`}
          style={hidden ? { opacity: 0 } : undefined}
          transform={g.r ? `rotate(${g.r} ${g.x} ${g.y})` : undefined}
        >
          {g.ch}
        </text>
      ))}
    </>
  )
}

/* ── ① 실선 인트로 ── */
function DrawDemo() {
  const rootRef = useRef<SVGSVGElement>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const paths = [...root.querySelectorAll<SVGPathElement>("path[data-thread]")]
    const drawables = paths.flatMap((p) => svg.createDrawable(p))
    const anims = drawables.map((d, i) =>
      animate(d, { draw: ["0 0", "0 1"], duration: 1400, delay: i * 260, ease: "inOut(2)" }),
    )
    const glyphs = root.querySelectorAll(".posterGlyph")
    const ga = animate(glyphs, {
      opacity: [0, 1],
      translateY: [8, 0], // SVG text에 y는 속성 트윈이 된다 — transform으로 (라운드 133 실측)
      duration: 520,
      delay: (_el, i) => 900 + (i ?? 0) * 60,
      ease: "cubicBezier(0.22, 1, 0.36, 1)",
    })
    return () => {
      anims.forEach((a) => a.cancel())
      ga.cancel()
    }
  }, [run])

  return (
    <div className={styles.stage}>
      <svg ref={rootRef} className={styles.poster} viewBox="0 0 400 500">
        <path data-thread d={LOOP_A} className={styles.thread} />
        <path data-thread d={LOOP_B} className={styles.thread} />
        <PosterGlyphs hidden />
      </svg>
      <button type="button" className={styles.replayBtn} onClick={() => setRun((n) => n + 1)}>
        처음부터 다시 보기
      </button>
    </div>
  )
}

/* ── ② 문장이 걸어 들어온다 ──
   실이 선이 아니라 문장 자체 — textPath 위 글자를 순서대로 안착. */
const THREAD_TEXT_A = "결국 결이 맞는다는 것은 단순한 취향의 일치가 아닙니다. 서로의 아비투스가 어긋나지 않고 정교하게 맞물려 움직이는 상태입니다. "
const THREAD_TEXT_B =
  "한 사람이 어떤 문장 앞에서 한참을 멈춰 서 있을 때, 다른 이가 기꺼이 그 침묵과 멈춤을 함께 견뎌내는 것. 그 자리에서 누가 말을 보태고 누가 조용히 응시할지가 자연스럽게 정해지는 것. "

function FlowDemo() {
  const rootRef = useRef<SVGSVGElement>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const chars = root.querySelectorAll("tspan[data-ch]")
    const ca = animate(chars, {
      opacity: [0, 1],
      duration: 260,
      delay: (_el, i) => (i ?? 0) * 12,
      ease: "out(2)",
    })
    const glyphs = root.querySelectorAll(".posterGlyph")
    const ga = animate(glyphs, {
      opacity: [0, 1],
      translateY: [8, 0], // SVG text에 y는 속성 트윈이 된다 — transform으로 (라운드 133 실측)
      duration: 520,
      delay: (_el, i) => 1500 + (i ?? 0) * 60,
      ease: "cubicBezier(0.22, 1, 0.36, 1)",
    })
    return () => {
      ca.cancel()
      ga.cancel()
    }
  }, [run])

  return (
    <div className={styles.stage}>
      <svg ref={rootRef} className={styles.poster} viewBox="0 0 400 500">
        <defs>
          <path id="flowLoopA" d={LOOP_A} />
          <path id="flowLoopB" d={LOOP_B} />
        </defs>
        <text className={styles.threadText}>
          <textPath href="#flowLoopA">
            {THREAD_TEXT_A.split("").map((c, i) => (
              <tspan key={i} data-ch style={{ opacity: 0 }}>
                {c}
              </tspan>
            ))}
          </textPath>
        </text>
        <text className={styles.threadText}>
          <textPath href="#flowLoopB">
            {THREAD_TEXT_B.split("").map((c, i) => (
              <tspan key={i} data-ch style={{ opacity: 0 }}>
                {c}
              </tspan>
            ))}
          </textPath>
        </text>
        <PosterGlyphs hidden />
      </svg>
      <p className={styles.note}>데모 문장은 철학 원고 발췌 — 실이식 시 포스터 원문으로 교체합니다.</p>
      <button type="button" className={styles.replayBtn} onClick={() => setRun((n) => n + 1)}>
        처음부터 다시 보기
      </button>
    </div>
  )
}

/* ── ③ 숨 쉬는 포스터 ──
   도착 상태에서 문장이 루프를 따라 극히 느리게 흐른다 (60s/바퀴). */
function BreatheDemo() {
  const aRef = useRef<SVGTextPathElement>(null)
  const bRef = useRef<SVGTextPathElement>(null)

  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = ((now - t0) / 60000) % 1 // 60초에 한 바퀴
      if (aRef.current) aRef.current.setAttribute("startOffset", `${(p * 100).toFixed(3)}%`)
      if (bRef.current) bRef.current.setAttribute("startOffset", `${(p * 100).toFixed(3)}%`)
      raf = requestAnimationFrame(tick)
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={styles.stage}>
      <svg className={styles.poster} viewBox="0 0 400 500">
        <defs>
          <path id="brLoopA" d={LOOP_A} />
          <path id="brLoopB" d={LOOP_B} />
        </defs>
        <text className={styles.threadText}>
          <textPath ref={aRef} href="#brLoopA">
            {THREAD_TEXT_A}
          </textPath>
        </text>
        <text className={styles.threadText}>
          <textPath ref={bRef} href="#brLoopB">
            {THREAD_TEXT_B}
          </textPath>
        </text>
        <PosterGlyphs />
      </svg>
      <p className={styles.note}>실이 60초에 한 바퀴 — 알아챈 사람만 아는 속도입니다.</p>
    </div>
  )
}

/* ── ④ 만지면 출렁이는 실 ── */
function TouchDemo() {
  const aGroup = useRef<SVGGElement>(null)
  const bGroup = useRef<SVGGElement>(null)
  const busy = useRef<Set<SVGGElement>>(new Set())

  const wobble = (g: SVGGElement | null) => {
    if (!g || busy.current.has(g)) return
    busy.current.add(g)
    animate(g, {
      keyframes: [
        { scale: 1.025, duration: 140, ease: "out(2)" },
        { scale: 1, duration: 700, ease: createSpring({ stiffness: 140, damping: 9 }) },
      ],
      onComplete: () => busy.current.delete(g),
    })
  }

  return (
    <div className={styles.stage}>
      <svg className={styles.poster} viewBox="0 0 400 500">
        <g
          ref={aGroup}
          className={styles.touchGroup}
          onPointerEnter={() => wobble(aGroup.current)}
          onClick={() => wobble(aGroup.current)}
        >
          <path d={LOOP_A} className={styles.thread} />
          {/* 만짐 판정을 넉넉히 — 보이지 않는 두꺼운 히트 영역 */}
          <path d={LOOP_A} className={styles.threadHit} />
        </g>
        <g
          ref={bGroup}
          className={styles.touchGroup}
          onPointerEnter={() => wobble(bGroup.current)}
          onClick={() => wobble(bGroup.current)}
        >
          <path d={LOOP_B} className={styles.thread} />
          <path d={LOOP_B} className={styles.threadHit} />
        </g>
        <PosterGlyphs />
      </svg>
      <p className={styles.note}>실을 만져 보세요 (호버·탭).</p>
    </div>
  )
}
