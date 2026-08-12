"use client"

/**
 * 북클럽 히어로 모션 시안 4안 (라운드 133) — 인트로 또는 상단 포스터 대체.
 *
 * 재료는 **현행 4기 포스터의 조형 그대로**: ① 흩어진 큰 글자 12자(레이지데이
 * 북클럽 4기 모집) ② 그 사이를 문장이 실처럼 흐르는 얽힌 루프. 새 도형 없음.
 * 라운드 135부터 실·글자 좌표는 포스터 원본에서 추출한 실측값(poster-thread.ts)
 * — 얽힌 실 전체를 한 번씩 지나는 한붓 경로다.
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
import { POSTER_THREAD_D, POSTER_GLYPHS, SAYU_P1, SAYU_P2, SAYU_P3 } from "../../poster-thread"

const TABS = [
  { key: "draw", label: "① 실선 인트로 (실이 먼저 그어진다)" },
  { key: "flow", label: "② 문장이 걸어 들어온다" },
  { key: "breathe", label: "③ 숨 쉬는 포스터 (도착 후 루프)" },
  { key: "touch", label: "④ 만지면 출렁이는 실" },
  { key: "jamo", label: "⑤ 자모 조립 (포스터 무관)" },
  { key: "count", label: "⑥ 기수 카운트 (포스터 무관)" },
  { key: "walkline", label: "⑦ 거북이 개장 (포스터 무관)" },
] as const

type TabKey = (typeof TABS)[number]["key"]

const META: Record<TabKey, { what: string; why: string }> = {
  draw: {
    what: "진입 1회: 포스터 실측 실(한붓 경로)이 2.2초에 걸쳐 스스로 그어지고, 끝나갈 때 큰 글자 12자가 60ms 간격으로 내려앉는다. 총 ~2.9초 후 완전 정지 = 현행 포스터",
    why: "포스터가 '그려지는 과정'을 한 번만 보여주는 안. 재방문·스크롤 복귀 시 재생 없음 (M2). 라이브러리 없이도 대체 가능한 가장 견고한 구조",
  },
  flow: {
    what: "실이 선이 아니라 **문장 그 자체**로 들어온다 — 작은 글자들이 실측 경로 전체를 따라 순서대로 자리를 잡고, 큰 글자가 뒤따라 앉는다. ~2.9초",
    why: "포스터의 본질(문장이 실이 된 조판)을 모션으로 정직하게 번역한 안. '불필요하게 고퀄' (M3). 데모 문장은 철학 원고 발췌 — 실이식 시 포스터 원문으로",
  },
  breathe: {
    what: "〈사유의 기슭〉 전문이 포스터의 얽힌 실(실측 한붓 경로)을 따라 흐른다 — 실 한쪽 끝에서 글자가 태어나고 반대쪽 끝에서 사라지며 끝없이 반복 (10px/s, 실이 비는 구간 없음). 큰 글자 12자는 완전 정적",
    why: "존재만 하는 배경 루프 (M2 허용 유형). 포스터의 복잡한 실 그대로 — 포스터가 죽은 이미지가 아니라 아주 천천히 살아 있다",
  },
  touch: {
    what: "평소 완전 정적. 실을 만지면(호버·탭) 그 루프가 한 번 출렁이고 스프링으로 잦아든다. 연타해도 출렁임은 한 번에 하나",
    why: "발견형 (M3) — 아무 표시도 없고, 우연히 만진 사람만 안다. ①~③ 어느 안과도 조합 가능",
  },
  jamo: {
    what: "제목이 초성만으로 먼저 온다 — 'ㄹㅇㅈㄷㅇ ㅂㅋㄹ'. 잠깐 뒤 글자마다 모음·받침이 들어와 조립된다 (글자당 70ms). 총 ~1.4초 후 정지",
    why: "포스터 무관 신규안. 한글이라서만 가능한 인트로 — 글자가 만들어지는 과정 자체가 조판. 짧아서 자주 방문에도 부담 없음",
  },
  count: {
    what: "'4기 모집'의 숫자가 1→2→3을 빠르게 지나(180ms씩) 4에서 살짝 찍히며 멈춘다. 총 ~0.9초",
    why: "포스터 무관 신규안. 가장 짧고 가장 무표정 — 숫자 하나가 네 번의 계절을 요약한다. 모집 기수가 바뀌면 숫자만 교체",
  },
  walkline: {
    what: "진입 1회: 거북이가 화면 하단을 왼쪽에서 오른쪽으로 한 번 걸어 지나가고, 지나간 자리에 주황 괘선이 남는다. 거북이는 화면 밖으로 퇴장, 괘선은 히어로의 밑줄로 남음 (~2.4초)",
    why: "포스터 무관 신규안. 캘린더·레이지클럽 홈의 거북이를 북클럽 인트로까지 잇는 시그니처 — 괘선이라는 기존 요소를 거북이가 '만들고 간다'",
  },
}

export function HeroMotion() {
  const [tab, setTab] = useState<TabKey>("draw")
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>히어로 모션 — 7안 (포스터 기반 4 + 신규 3)</h1>
        <p className={styles.lede}>
          ①~④는 현행 4기 포스터의 조형(큰 글자 12자 + 문장의 실 루프)을 그대로 재료로 쓴
          안입니다 — 실과 글자 좌표는 포스터 원본에서 추출한 실측값(얽힌 실 전체를 한 번씩
          지나는 한붓 경로). ⑤~⑦은 포스터에 얽매이지 않은 신규안입니다.
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
        {tab === "jamo" && <JamoDemo />}
        {tab === "count" && <CountSeasonDemo />}
        {tab === "walkline" && <TurtleLineDemo />}
      </div>
    </main>
  )
}

/* ── 공통 조형 (포스터 실측 이식 — 라운드 135) ───────────────
   viewBox 400×500. 실 = 실제 4기 포스터에서 골격 추출한 한붓 경로
   (poster-thread.ts — 교차 8개를 직진 통과, 얽힌 실 전체를 한 번씩 지남).
   큰 글자 12자도 포스터 실측 중심 좌표. */

const GLYPHS = POSTER_GLYPHS

function PosterGlyphs({ hidden }: { hidden?: boolean }) {
  return (
    <>
      {GLYPHS.map((g, i) => (
        <text
          key={i}
          x={g.x}
          y={g.y}
          fontSize={g.s}
          textAnchor="middle"
          dominantBaseline="central"
          className={`${styles.glyph} posterGlyph`}
          style={hidden ? { opacity: 0 } : undefined}
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
    const anims = drawables.map((d) =>
      animate(d, { draw: ["0 0", "0 1"], duration: 2200, ease: "inOut(2)" }),
    )
    const glyphs = root.querySelectorAll(".posterGlyph")
    const ga = animate(glyphs, {
      opacity: [0, 1],
      translateY: [8, 0], // SVG text에 y는 속성 트윈이 된다 — transform으로 (라운드 133 실측)
      duration: 520,
      delay: (_el, i) => 1300 + (i ?? 0) * 60,
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
        <path data-thread d={POSTER_THREAD_D} className={styles.thread} />
        <PosterGlyphs hidden />
      </svg>
      <button type="button" className={styles.replayBtn} onClick={() => setRun((n) => n + 1)}>
        처음부터 다시 보기
      </button>
    </div>
  )
}

/* ── ② 문장이 걸어 들어온다 ──
   실이 선이 아니라 문장 자체 — textPath 위 글자를 순서대로 안착.
   실측 경로(~2687 단위) 전체를 채우도록 결 발췌 2문장을 이어 반복. */
const THREAD_TEXT_A = "결국 결이 맞는다는 것은 단순한 취향의 일치가 아닙니다. 서로의 아비투스가 어긋나지 않고 정교하게 맞물려 움직이는 상태입니다. "
const THREAD_TEXT_B =
  "한 사람이 어떤 문장 앞에서 한참을 멈춰 서 있을 때, 다른 이가 기꺼이 그 침묵과 멈춤을 함께 견뎌내는 것. 그 자리에서 누가 말을 보태고 누가 조용히 응시할지가 자연스럽게 정해지는 것. "
const FLOW_TEXT = `${THREAD_TEXT_A}${THREAD_TEXT_B}`.repeat(3)

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
      delay: (_el, i) => (i ?? 0) * 3.2, // 실측 경로 전체(~800자)를 ~2.6초에 채운다
      ease: "out(2)",
    })
    const glyphs = root.querySelectorAll(".posterGlyph")
    const ga = animate(glyphs, {
      opacity: [0, 1],
      translateY: [8, 0], // SVG text에 y는 속성 트윈이 된다 — transform으로 (라운드 133 실측)
      duration: 520,
      delay: (_el, i) => 1900 + (i ?? 0) * 60,
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
          <path id="flowLoop" d={POSTER_THREAD_D} />
        </defs>
        <text className={styles.threadText}>
          <textPath href="#flowLoop">
            {FLOW_TEXT.split("").map((c, i) => (
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

/* ── ③ 숨 쉬는 포스터 (라운드 134 재구성 — 운영자 원문·구도 반영) ──
   본문 = 〈사유의 기슭〉 전문 (운영자 제공 원문 그대로 — 임의 수정 금지).
   구도 = 정원(타원)이 아니라 **포스터의 얽힌 실 그대로** (운영자 "원형이 아닌
   내가 던진 구도로"): 열린 실 경로 위를 본문이 흐른다 — 실의 한쪽 끝에서 글자가
   태어나고 반대쪽 끝에서 사라지며, 본문을 여러 벌 이어붙여 오프셋을 한 벌
   길이로 순환시키므로 실이 비는 구간이 없다 (운영자 "초반이나 후반에 너무
   비어지는 걸 원치 않음"). 반복 벌 수는 경로 길이를 실측해 동적으로 정한다. */

// 〈사유의 기슭〉 원문은 poster-thread.ts 단일 출처 (채택 히어로와 공유)

/* 얽힌 실 경로 — 포스터 실측 한붓 경로 그대로 (라운드 135).
   글자가 태어나는 끝(경로 끝)과 사라지는 끝(경로 시작)이 있는 열린 실이다. */
const STREAMS = [
  { id: "sayuStr", d: POSTER_THREAD_D, text: `${SAYU_P1}   ${SAYU_P2}   ${SAYU_P3}`, speed: 10 },
]

function BreatheDemo() {
  const rootRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    let cancelled = false

    // 폰트 적용 후 실측 — 경로 길이 대비 본문 반복 벌 수를 동적으로 결정해야
    // 실이 항상 가득 찬 채 순환한다 (한 벌 길이 P ≥ 필요 조건은 코드가 보장)
    document.fonts.ready.then(() => {
      if (cancelled) return
      const tracks = [...root.querySelectorAll<SVGTextPathElement>("textPath[data-stream]")].map((tp, i) => {
        const stream = STREAMS[i]
        const pathEl = root.querySelector<SVGPathElement>(`#${stream.id}`)!
        const L = pathEl.getTotalLength()
        const textEl = tp.closest("text") as SVGTextElement
        tp.textContent = `${stream.text}   ` // 한 벌만 놓고 진행 길이 실측
        const P = textEl.getComputedTextLength()
        // 오프셋이 [-P, 0] 사이를 돌 때 경로 [0, L]이 항상 덮이도록: K×P ≥ P + L
        const K = Math.max(2, Math.ceil((P + L) / P))
        tp.textContent = `${stream.text}   `.repeat(K)
        return { tp, P, speed: stream.speed }
      })
      const t0 = performance.now()
      const tick = (now: number) => {
        const t = (now - t0) / 1000
        for (const { tp, P, speed } of tracks) {
          if (P > 0) tp.setAttribute("startOffset", String(-((t * speed) % P)))
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className={styles.stage}>
      <svg ref={rootRef} className={styles.poster} viewBox="0 0 400 500">
        <defs>
          {STREAMS.map((s) => (
            <path key={s.id} id={s.id} d={s.d} />
          ))}
        </defs>
        {STREAMS.map((s) => (
          <text key={s.id} className={styles.threadText}>
            <textPath href={`#${s.id}`} data-stream>
              {`${s.text}   `}
            </textPath>
          </text>
        ))}
        <PosterGlyphs />
      </svg>
      <p className={styles.note}>
        본문은 〈사유의 기슭〉 전문 — 실의 한쪽 끝에서 글자가 태어나고 반대쪽 끝에서 사라지며
        끝없이 흐릅니다.
      </p>
    </div>
  )
}

/* ── ④ 만지면 출렁이는 실 ── */
function TouchDemo() {
  const aGroup = useRef<SVGGElement>(null)
  const busy = useRef<Set<SVGGElement>>(new Set())

  const wobble = (g: SVGGElement | null) => {
    if (!g || busy.current.has(g)) return
    busy.current.add(g)
    animate(g, {
      keyframes: [
        { scale: 1.02, duration: 140, ease: "out(2)" },
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
          <path d={POSTER_THREAD_D} className={styles.thread} />
          {/* 만짐 판정을 넉넉히 — 보이지 않는 두꺼운 히트 영역 */}
          <path d={POSTER_THREAD_D} className={styles.threadHit} />
        </g>
        <PosterGlyphs />
      </svg>
      <p className={styles.note}>실을 만져 보세요 (호버·탭).</p>
    </div>
  )
}

/* ── ⑤ 자모 조립 (포스터 무관) ──
   초성만 먼저 오고, 글자마다 모음·받침이 들어와 조립된다.
   한글 음절 분해: (code−0xAC00)/588 → 초성 인덱스. */
const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"]
const JAMO_TITLE = "레이지데이 북클럽"

function choseong(ch: string) {
  const code = ch.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return ch
  return CHO[Math.floor((code - 0xac00) / 588)] ?? ch
}

function JamoDemo() {
  const rootRef = useRef<HTMLHeadingElement>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const spans = [...root.querySelectorAll<HTMLSpanElement>("span[data-jamo]")]
    // 1) 초성으로 초기화 후 스태거 등장
    spans.forEach((s) => {
      s.textContent = choseong(s.dataset.jamo!)
    })
    const inAnim = animate(spans, {
      opacity: [0, 1],
      duration: 300,
      delay: (_el, i) => (i ?? 0) * 40,
      ease: "out(2)",
    })
    // 2) 700ms부터 글자당 70ms 간격으로 완성 음절로 조립 (살짝 눌리는 팝)
    const timers = spans.map((s, i) =>
      setTimeout(() => {
        s.textContent = s.dataset.jamo!
        animate(s, { scale: [1.12, 1], duration: 320, ease: "out(3)" })
      }, 700 + i * 70),
    )
    return () => {
      inAnim.cancel()
      timers.forEach(clearTimeout)
    }
  }, [run])

  return (
    <div className={`${styles.stage} ${styles.stageTall}`}>
      <h2 className={styles.heroTitle} ref={rootRef} aria-label={JAMO_TITLE}>
        {JAMO_TITLE.split("").map((c, i) =>
          c === " " ? (
            <span key={i} className={styles.heroSpace} />
          ) : (
            <span key={i} data-jamo={c} className={styles.heroCh} aria-hidden />
          ),
        )}
      </h2>
      <button type="button" className={styles.replayBtn} onClick={() => setRun((n) => n + 1)}>
        처음부터 다시 보기
      </button>
    </div>
  )
}

/* ── ⑥ 기수 카운트 (포스터 무관) ──
   숫자가 1→2→3을 지나 4에서 찍히며 멈춘다. 기수 바뀌면 숫자만 교체. */
function CountSeasonDemo() {
  const numRef = useRef<HTMLSpanElement>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const el = numRef.current
    if (!el) return
    el.textContent = "1"
    const timers: ReturnType<typeof setTimeout>[] = []
    ;[2, 3].forEach((n, i) =>
      timers.push(
        setTimeout(() => {
          el.textContent = String(n)
          animate(el, { translateY: [6, 0], opacity: [0.4, 1], duration: 160, ease: "out(2)" })
        }, 300 + i * 180),
      ),
    )
    timers.push(
      setTimeout(() => {
        el.textContent = "4"
        animate(el, { scale: [1.18, 1], duration: 460, ease: createSpring({ stiffness: 240, damping: 12 }) })
      }, 300 + 2 * 180),
    )
    return () => timers.forEach(clearTimeout)
  }, [run])

  return (
    <div className={`${styles.stage} ${styles.stageTall}`}>
      <h2 className={styles.heroTitle}>
        <span className={styles.heroNum} ref={numRef}>
          1
        </span>
        기 모집
      </h2>
      <button type="button" className={styles.replayBtn} onClick={() => setRun((n) => n + 1)}>
        처음부터 다시 보기
      </button>
    </div>
  )
}

/* ── ⑦ 거북이 개장(開場) (포스터 무관) ──
   거북이가 하단을 한 번 횡단하고, 지나간 자리에 주황 괘선이 남는다. */
function TurtleLineDemo() {
  const turtleRef = useRef<HTMLDivElement>(null)
  const ruleRef = useRef<HTMLDivElement>(null)
  const laneRef = useRef<HTMLDivElement>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const turtle = turtleRef.current
    const rule = ruleRef.current
    const lane = laneRef.current
    if (!turtle || !rule || !lane) return
    const dist = lane.clientWidth + 56 // 화면 밖 퇴장까지
    turtle.dataset.walking = "true"
    const ta = animate(turtle, { translateX: [-48, dist], duration: 2400, ease: "inOut(1.4)" })
    // 괘선은 거북이 뒤꽁무니를 따라 자란다 — 같은 이징, 같은 시간
    const ra = animate(rule, { scaleX: [0, 1], duration: 2400, ease: "inOut(1.4)" })
    const t = setTimeout(() => {
      delete turtle.dataset.walking
    }, 2450)
    return () => {
      ta.cancel()
      ra.cancel()
      clearTimeout(t)
    }
  }, [run])

  return (
    <div className={`${styles.stage} ${styles.stageTall}`}>
      <div className={styles.walkHero}>
        <h2 className={styles.heroTitleStatic}>레이지데이 북클럽</h2>
        <p className={styles.heroSubStatic}>4기를 모집합니다.</p>
        <div className={styles.walkLane} ref={laneRef}>
          <div className={styles.walkRule} ref={ruleRef} />
          <div className={styles.walkTurtle} ref={turtleRef} data-walking="true">
            <div className={styles.walkSprite} />
          </div>
        </div>
      </div>
      <button type="button" className={styles.replayBtn} onClick={() => setRun((n) => n + 1)}>
        처음부터 다시 보기
      </button>
    </div>
  )
}
