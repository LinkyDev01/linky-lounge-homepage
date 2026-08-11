"use client"

/**
 * 북클럽 모션 시안 — 아카이브 확장 4안 (라운드 132).
 *
 * 라운드 130 쇼케이스가 "이미 있는 요소를 움직이는" 4안이었다면, 이번엔 운영자
 * 지시("기존 안에서 찾는 게 전부야?")에 따라 anime.js 아카이브에서 문법을 새로
 * 발굴해 북클럽 랜딩에 적용한 안이다. 사용 문법(전부 아카이브 데모 계열):
 *   ① seek — 스크롤 진행률을 애니메이션 타임라인에 직접 매핑 (ScrollObserver 계열)
 *   ② 오브젝트 트윈 — 숫자 값 자체를 트윈하고 onRender로 그린다 (counter 데모 계열)
 *   ③ svg.createDrawable — 괘선이 손으로 긋듯 그려진다 (line drawing 데모 계열)
 *   ④ 어절 스태거 — splitText 문법의 어절판 (text/stagger 데모 계열)
 * 모션 원칙(M1~M3)은 라운드 130과 동일: 무표정·1회성·모션 없이도 완결.
 * 실사이트 미반영, 채택 시안만 이식 (철칙 1).
 */

import { useEffect, useRef, useState } from "react"
import { animate, svg } from "animejs"
import styles from "./motion-bookclub.module.css"

const TABS = [
  { key: "turtle", label: "① 스크롤 거북이 (랜딩 전체)" },
  { key: "count", label: "② 페이지 카운트업 (후기 위)" },
  { key: "rule", label: "③ 괘선 손긋기 (섹션 제목)" },
  { key: "words", label: "④ 어절 스태거 (철학 원고)" },
] as const

type TabKey = (typeof TABS)[number]["key"]

const META: Record<TabKey, { where: string; what: string; why: string }> = {
  turtle: {
    where: "북클럽 랜딩 전체 — 화면 하단 고정 헤어라인",
    what: "거북이가 스크롤 진행률만큼 전진. 끝까지 읽으면 우측 결승선을 통과한다 — 축하 문구 없음. 걸음은 스크롤 중에만",
    why: "캘린더 거북이를 북클럽까지 확장해 두 사이트를 관통하는 시그니처로. 진행 표시라는 실용을 무표정한 농담이 겸한다",
  },
  count: {
    where: "북클럽 랜딩 — 후기 섹션 진입 직전 한 줄",
    what: "화면에 들어오는 1회, 숫자가 0에서 목표값까지 1.2초 카운트업 후 정지. 숫자는 데모용 임의값",
    why: "숫자 값 자체를 트윈하는 아카이브 counter 문법. 각주 한 줄('대략입니다')로 정확성의 부담을 미리 내려놓는다",
  },
  rule: {
    where: "북클럽 랜딩 — 모든 섹션 제목의 주황 괘선 (titleRow 괘선 대체)",
    what: "제목 등장 직후 괘선이 손으로 긋듯 왼쪽부터 그려진다 (0.6초 1회). 직선이 아니라 아주 미세하게 흔들리는 획",
    why: "svg.createDrawable — 이미 있는 괘선이 '그어지는 순간'만 얻는다. 새 도형 0개, 종이 위 육필의 결",
  },
  words: {
    where: "북클럽 랜딩 — 철학 원고('결') 도입 문장",
    what: "문장이 어절 단위로 낮게 떠오르며 자리를 잡는다 (어절당 70ms 스태거, 1회). 원고는 운영자 확정 원문 그대로",
    why: "글이 중심인 페이지에서 글 스스로가 유일한 모션이 된다. splitText 문법의 어절판 — 한국어는 글자보다 어절이 자연스럽다",
  },
}

export function MotionBookclub() {
  const [tab, setTab] = useState<TabKey>("turtle")
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>북클럽 모션 — 아카이브 확장 4안</h1>
        <p className={styles.lede}>
          anime.js 아카이브에서 새로 발굴한 문법 4종을 북클럽 랜딩 맥락에 얹었습니다. 라운드 130의
          4안과 별개 시안입니다. 스크롤하고, 다시 보기를 눌러 보세요.
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
          <strong>자리</strong> {META[tab].where}
          <br />
          <strong>동작</strong> {META[tab].what}
          <br />
          <strong>의도</strong> {META[tab].why}
        </p>
        {tab === "turtle" && <ScrollTurtleDemo />}
        {tab === "count" && <CountDemo />}
        {tab === "rule" && <RuleDemo />}
        {tab === "words" && <WordsDemo />}
      </div>
    </main>
  )
}

/* ── ① 스크롤 거북이 (북클럽판) ─────────────────────────────
   아카이브 문법: 스크롤 진행률 → 타임라인 seek 매핑 (ScrollObserver 계열).
   데모는 축소 재현 — 미니 랜딩을 스크롤하면 하단 거북이가 같은 비율로 전진. */
function ScrollTurtleDemo() {
  const paneRef = useRef<HTMLDivElement>(null)
  const laneRef = useRef<HTMLDivElement>(null)
  const turtleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pane = paneRef.current
    const lane = laneRef.current
    const turtle = turtleRef.current
    if (!pane || !lane || !turtle) return
    const dist = Math.max(0, lane.clientWidth - 40)
    // 진행률(0~1)을 seek 로 타임라인에 직접 매핑 — 스크롤이 곧 재생 헤드
    const anim = animate(turtle, { x: dist, duration: 1000, ease: "linear", autoplay: false })
    let walkTimer: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
      const max = pane.scrollHeight - pane.clientHeight
      anim.seek((max > 0 ? pane.scrollTop / max : 0) * 1000)
      turtle.dataset.walking = "true"
      if (walkTimer) clearTimeout(walkTimer)
      walkTimer = setTimeout(() => delete turtle.dataset.walking, 220)
    }
    pane.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      pane.removeEventListener("scroll", onScroll)
      if (walkTimer) clearTimeout(walkTimer)
      anim.cancel()
    }
  }, [])

  return (
    <div className={styles.stage}>
      <div className={styles.scrollPane} ref={paneRef}>
        {["선정 도서", "모임 소개", "진행 방식", "일정과 장소", "후기", "FAQ"].map((s) => (
          <div key={s} className={styles.fakeSection}>
            <div className={styles.fakeTitle}>{s}</div>
            <div className={styles.fakeBlock} />
          </div>
        ))}
        <p className={styles.fakeEnd}>여기까지 읽으셨습니다.</p>
      </div>
      <div className={styles.turtleLane} ref={laneRef}>
        <span className={styles.finish} />
        <span className={styles.finishDash} />
        <div className={styles.miniTurtle} ref={turtleRef}>
          <div className={styles.miniSprite} />
        </div>
      </div>
      <p className={styles.hint}>위 상자를 스크롤해 보세요 — 끝까지 읽으면 완주합니다.</p>
    </div>
  )
}

/* ── ② 페이지 카운트업 ──────────────────────────────────────
   아카이브 문법: 오브젝트 값 트윈 + onRender (counter 데모 계열). */
const COUNT_TARGET = 4812 // 데모용 임의값 — 실이식 시 운영자 확정값으로

function CountDemo() {
  const numRef = useRef<HTMLSpanElement>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const el = numRef.current
    if (!el) return
    const obj = { n: 0 }
    const anim = animate(obj, {
      n: COUNT_TARGET,
      duration: 1200,
      ease: "out(3)",
      onRender: () => {
        el.textContent = Math.round(obj.n).toLocaleString("ko-KR")
      },
    })
    return () => {
      anim.cancel()
    }
  }, [run])

  return (
    <div className={styles.stage}>
      <div className={styles.stageCenter}>
        <p className={styles.countLine}>
          지금까지 함께 읽은 페이지, <span className={styles.countNum} ref={numRef}>0</span>
          <span className={styles.countUnit}>쪽</span>
        </p>
        <p className={styles.countFoot}>대략입니다. 세다가 그만뒀습니다.</p>
        <button type="button" className={styles.replayBtn} onClick={() => setRun((n) => n + 1)}>
          다시 보기
        </button>
      </div>
    </div>
  )
}

/* ── ③ 괘선 손긋기 ─────────────────────────────────────────
   아카이브 문법: svg.createDrawable — 패스가 그려지는 과정 자체를 트윈. */
function RuleDemo() {
  const pathRef = useRef<SVGPathElement>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const [drawable] = svg.createDrawable(path)
    const anim = animate(drawable, {
      draw: ["0 0", "0 1"],
      duration: 600,
      delay: 250,
      ease: "cubicBezier(0.22, 1, 0.36, 1)",
    })
    return () => {
      anim.cancel()
    }
  }, [run])

  return (
    <div className={styles.stage}>
      <div className={styles.stageCenter}>
        <h2 className={styles.demoSectionTitle}>선정 도서</h2>
        {/* 실제 titleRow 괘선(56×1.5, 주황 .6)과 같은 자리 — 직선 대신 미세하게 흔들리는 획 */}
        <svg className={styles.ruleSvg} viewBox="0 0 56 6" aria-hidden>
          <path
            ref={pathRef}
            d="M1 3.4 C 12 2.2, 24 4.4, 34 3.2 S 50 2.6, 55 3.6"
            fill="none"
            stroke="rgba(210, 105, 30, 0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <button type="button" className={styles.replayBtn} onClick={() => setRun((n) => n + 1)}>
          다시 긋기
        </button>
      </div>
    </div>
  )
}

/* ── ④ 어절 스태거 ─────────────────────────────────────────
   아카이브 문법: splitText 계열 — 한국어라 글자가 아닌 **어절** 단위.
   문장은 철학 원고('결') 확정 원문 그대로 (philosophy-content.tsx 3번째 문단 첫 문장). */
const SENTENCE = "결국 “결이 맞는다”는 것은 단순한 취향의 일치가 아닙니다."

function WordsDemo() {
  const rootRef = useRef<HTMLParagraphElement>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const words = root.querySelectorAll(`.${styles.word}`)
    const anim = animate(words, {
      opacity: [0, 1],
      y: [8, 0],
      duration: 560,
      delay: (_el, i) => 200 + (i ?? 0) * 70,
      ease: "cubicBezier(0.22, 1, 0.36, 1)",
    })
    return () => {
      anim.cancel()
    }
  }, [run])

  return (
    <div className={styles.stage}>
      <div className={styles.stageCenter}>
        <p className={styles.wordsLine} ref={rootRef} aria-label={SENTENCE}>
          {SENTENCE.split(" ").map((w, i) => (
            <span key={i} className={styles.word} aria-hidden>
              {w}
            </span>
          ))}
        </p>
        <button type="button" className={styles.replayBtn} onClick={() => setRun((n) => n + 1)}>
          다시 보기
        </button>
      </div>
    </div>
  )
}
