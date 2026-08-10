"use client"

/**
 * 모션 시안 쇼케이스 (라운드 130) — anime.js v4 (문서 402개 데모 아카이브 검토 기반).
 *
 * 운영자 요구 명세 (라운드 129~130 대화에서 확정):
 *   M1 톤앤매너 — 새 색·도형 도입 없이 이미 있는 요소(글자·괘선·거북이·하트)가 움직인다
 *   M2 덜어냄 — 화면당 동시 모션 1개, 루프는 배경 존재만, 모션 없이도 페이지 완결
 *   M3 유머 — 무표정·발견형·"불필요하게 고퀄". 같은 농담 반복 노출 금지
 *   보정(라운드 130): 북클럽은 자주 들어오니 **더 간결**, 인트로는 북클럽만 검토
 *     (상단 포스터 자리 대체안 포함), 레이지클럽 인트로 신설은 하지 않는다
 *
 * anime.js 사용 기능: createTimeline·stagger(시안1) / animate+spring(시안2·4) /
 * createDraggable+createSpring(시안3). 전부 모듈 임포트 — 트리셰이킹.
 * 실사이트 미반영, 채택 시안만 이식 (철칙 1).
 */

import { useEffect, useRef, useState } from "react"
import { animate, createDraggable, createSpring, createTimeline, stagger } from "animejs"
import styles from "./motion-designs.module.css"

const TABS = [
  { key: "hero", label: "① 히어로 잉크 리빌 (북클럽)" },
  { key: "click", label: "② 클릭 피드백 (북클럽)" },
  { key: "turtle", label: "③ 거북이 물리 (레이지클럽)" },
  { key: "heart", label: "④ 하트 두근 (제품)" },
] as const

type TabKey = (typeof TABS)[number]["key"]

const META: Record<TabKey, { where: string; what: string; why: string }> = {
  hero: {
    where: "북클럽 랜딩 — 상단 포스터 자리 (인트로 대체안)",
    what: "진입 1회: 글자가 잉크처럼 내려앉고(스태거 0.62s) 주황 괘선이 그어진 뒤 완전 정지. 총 1.1초, 재방문·스크롤 복귀 시 재생 없음",
    why: "자주 들어오는 페이지라 '기다리게 하는 인트로'가 아니라 '늦게 온 조판'. 기존 리빌 이징(cubic-bezier 0.22,1,0.36,1) 그대로",
  },
  click: {
    where: "북클럽 랜딩 — 신청 CTA·FAQ 등 누르는 모든 곳",
    what: "누름 순간 스프링 눌림(0.96→1) + 클릭 지점에 잉크 점 하나가 번졌다 사라짐(0.5s). FAQ는 + 회전과 본문 펼침에 같은 결",
    why: "자주 방문 전제의 최소 단위 — 화면을 바꾸지 않고 손끝 감각만. 모션이 없어도 기능 동일 (M2-④)",
  },
  turtle: {
    where: "레이지클럽 캘린더 — 거북이 트랙",
    what: "거북이를 집어 옮길 수 있다. 놓으면 스프링으로 꾸역꾸역 제자리 복귀, 문구 한 줄: \"거북이가 지름길을 거절했습니다.\"",
    why: "카운트다운 세계관을 물리로 방어하는 농담. 만진 사람만 발견 (M3 발견형 · 불필요하게 고퀄)",
  },
  heart: {
    where: "레이지클럽 제품 — I ♥ LAZYDAY 하트",
    what: "하트에 손을 올리면 한 번 두근(두 박자 스프링). 평소엔 완전 정적, 연타해도 심박은 한 번에 하나",
    why: "3초짜리처럼 보이는 것에 감쇠 곡선을 제대로 들인 마이크로 유머 (M3)",
  },
}

export function MotionDesigns() {
  const [tab, setTab] = useState<TabKey>("hero")
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>모션 시안 — 만져 보는 4안</h1>
        <p className={styles.lede}>
          anime.js v4 아카이브 검토 기반 · 실사이트 미반영 프리뷰. 각 시안은 실제 위치의 맥락을 축소
          재현했습니다. 직접 눌러 보고 끌어 보세요.
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
        {tab === "hero" && <HeroDemo />}
        {tab === "click" && <ClickDemo />}
        {tab === "turtle" && <TurtleDemo />}
        {tab === "heart" && <HeartDemo />}
      </div>
    </main>
  )
}

/* ── 시안 1: 히어로 잉크 리빌 ─────────────────────────────── */
const HERO_TITLE = "레이지데이 북클럽"

function HeroDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const chars = root.querySelectorAll(`.${styles.ch}`)
    const tl = createTimeline({ defaults: { ease: "cubicBezier(0.22, 1, 0.36, 1)" } })
      .add(root.querySelector(`.${styles.heroKicker}`)!, { opacity: [0, 1], duration: 500 })
      .add(chars, { opacity: [0, 1], y: [10, 0], duration: 620, delay: stagger(34) }, 120)
      .add(root.querySelector(`.${styles.heroRule}`)!, { scaleX: [0, 1], duration: 500 }, "-=260")
      .add(root.querySelector(`.${styles.heroSub}`)!, { opacity: [0, 1], duration: 450 }, "-=200")
    return () => {
      tl.cancel()
    }
  }, [run])

  return (
    <div className={`${styles.stage} ${styles.heroStage}`}>
      <div className={styles.stageInner} ref={rootRef}>
        <p className={styles.heroKicker}>LAZYDAY BOOKCLUB</p>
        <h2 className={styles.heroTitle} aria-label={HERO_TITLE}>
          {HERO_TITLE.split("").map((c, i) => (
            <span key={i} className={styles.ch} aria-hidden>
              {c === " " ? " " : c}
            </span>
          ))}
        </h2>
        <div className={styles.heroRule} />
        <p className={styles.heroSub}>4기를 모집합니다.</p>
        <button type="button" className={styles.replayBtn} onClick={() => setRun((n) => n + 1)}>
          처음부터 다시 보기
        </button>
      </div>
    </div>
  )
}

/* ── 시안 2: 클릭 잉크 피드백 ─────────────────────────────── */
function ClickDemo() {
  const stageRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLButtonElement>(null)
  const crossRef = useRef<HTMLSpanElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const inkAt = (e: React.MouseEvent) => {
    const stage = stageRef.current
    if (!stage) return
    const r = stage.getBoundingClientRect()
    const dot = document.createElement("span")
    dot.className = styles.inkDot
    dot.style.left = `${e.clientX - r.left}px`
    dot.style.top = `${e.clientY - r.top}px`
    stage.appendChild(dot)
    animate(dot, {
      scale: [0.4, 2.6],
      opacity: [0.55, 0],
      duration: 500,
      ease: "out(2)",
      onComplete: () => dot.remove(),
    })
  }

  const pressCta = (e: React.MouseEvent) => {
    inkAt(e)
    if (ctaRef.current)
      animate(ctaRef.current, { scale: [0.96, 1], duration: 480, ease: createSpring({ stiffness: 210, damping: 13 }) })
  }

  const toggleFaq = (e: React.MouseEvent) => {
    inkAt(e)
    const body = bodyRef.current
    const cross = crossRef.current
    const next = !open
    setOpen(next)
    if (cross) animate(cross, { rotate: next ? 45 : 0, duration: 360, ease: "cubicBezier(0.22, 1, 0.36, 1)" })
    if (body) {
      const h = body.scrollHeight
      animate(body, {
        height: next ? [0, h] : [h, 0],
        duration: 380,
        ease: "cubicBezier(0.22, 1, 0.36, 1)",
      })
    }
  }

  return (
    <div className={`${styles.stage} ${styles.clickStage}`} ref={stageRef}>
      <div className={styles.stageInner}>
        <button type="button" ref={ctaRef} className={styles.demoCta} onClick={pressCta}>
          4기 신청하기
        </button>
        <button type="button" className={styles.demoFaq} onClick={toggleFaq} aria-expanded={open}>
          인터뷰는 왜 하나요?
          <span className={styles.demoFaqCross} ref={crossRef}>
            +
          </span>
        </button>
        <div className={styles.demoFaqBody} ref={bodyRef} style={{ height: 0 }}>
          <p>서로의 결을 가늠하는 자리예요. 전화·서면 중 편한 방식을 선택할 수 있어요.</p>
        </div>
      </div>
    </div>
  )
}

/* ── 시안 3: 거북이 물리 ─────────────────────────────────── */
function TurtleDemo() {
  const spriteRef = useRef<HTMLDivElement>(null)
  const [caption, setCaption] = useState<"idle" | "grab" | "refused">("idle")

  useEffect(() => {
    const el = spriteRef.current
    if (!el) return
    let refusedOnce = false
    const d = createDraggable(el, {
      onGrab: () => setCaption("grab"),
      onRelease: () => {
        // 어디에 내려놓든 꾸역꾸역 제자리로 — 지름길은 없다
        animate(el, {
          x: 0,
          y: 0,
          duration: 900,
          ease: createSpring({ stiffness: 90, damping: 11 }),
        })
        if (!refusedOnce) {
          refusedOnce = true
          setCaption("refused")
        } else {
          setCaption("refused")
        }
      },
    })
    return () => {
      d.revert()
    }
  }, [])

  return (
    <div className={`${styles.stage} ${styles.turtleStage}`}>
      <div className={styles.stageInner}>
        <div className={styles.turtleTrackLine}>
          <div className={styles.turtleLane} />
          <div className={styles.turtleSprite} ref={spriteRef} role="img" aria-label="거북이 (끌 수 있음)" />
        </div>
        <p className={styles.turtleCaption}>
          {caption === "idle" && "거북이를 집어 옮겨 보세요."}
          {caption === "grab" && " "}
          {caption === "refused" && (
            <>
              거북이가 <strong>지름길을 거절했습니다.</strong>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

/* ── 시안 4: 하트 두근 ───────────────────────────────────── */
function HeartDemo() {
  const heartRef = useRef<HTMLSpanElement>(null)
  const busyRef = useRef(false)

  const beat = () => {
    const el = heartRef.current
    if (!el || busyRef.current) return
    busyRef.current = true
    // 두 박자: 쿵(1.18) — 살짝 — 쿵(1.24) — 스프링 감쇠 복귀
    animate(el, {
      keyframes: [
        { scale: 1.18, duration: 120, ease: "out(2)" },
        { scale: 1.02, duration: 110 },
        { scale: 1.24, duration: 130, ease: "out(2)" },
        { scale: 1, duration: 620, ease: createSpring({ stiffness: 260, damping: 10 }) },
      ],
      onComplete: () => {
        busyRef.current = false
      },
    })
  }

  return (
    <div className={`${styles.stage} ${styles.heartStage}`}>
      <div className={styles.stageInner}>
        <div className={styles.heartCard} onPointerEnter={beat} onClick={beat}>
          I{" "}
          <span className={styles.heartGlyph} ref={heartRef}>
            ♥
          </span>{" "}
          LAZYDAY
        </div>
      </div>
    </div>
  )
}
