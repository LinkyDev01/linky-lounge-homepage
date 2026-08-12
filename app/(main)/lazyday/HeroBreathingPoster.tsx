"use client"

import { useEffect, useRef } from "react"
import { POSTER_THREAD_D, POSTER_GLYPHS, SAYU_P1, SAYU_P2, SAYU_P3 } from "./poster-thread"
import styles from "./HeroBreathingPoster.module.css"

/**
 * 숨 쉬는 포스터 — 히어로 채택본 (2026-08-11, hero-motion 시안 ③ 이식).
 *
 * 실 = 4기 포스터에서 골격 추출한 실측 한붓 경로(poster-thread.ts), 큰 글자 12자는
 * 실측 좌표에 정적. 〈사유의 기슭〉 전문이 실을 따라 흐른다 — 한쪽 끝에서
 * 글자가 태어나고 반대쪽 끝에서 사라지는 무한 순환 (실이 비는 구간 없음:
 * 본문을 K벌 이어붙여 오프셋을 한 벌 길이로 순환).
 *
 * 2026-08-12 운영자: **2안+3안 조합** — 진입은 시안 ②(문장이 걸어 들어온다):
 * ① 실 위 본문이 글자 순서대로 안착 (첫 벌만 tspan 분해, CSS 스태거 —
 *    JS 없이도 페인트부터 동작하는 폴백 겸용)
 * ② 큰 글자는 **레이지 / 데이 / 북클럽 / 4기모집 묶음 단위**로 순차 등장
 * ③ 다 노출되면 **0.5초 후** 시안 ③의 SMIL 무한 흐름 시작 ("지금처럼")
 * 같은 textPath 하나로 진입→흐름을 잇는다 — 첫 벌은 tspan, 이후 벌은 JS가
 * 폰트 로드 후 통짜로 이어붙이고 SMIL(begin=indefinite)을 시각에 맞춰 발화.
 *
 * 모션 원칙 M2의 허용 유형(존재만 하는 배경 루프 + 진입 1회). reduced-motion 이면
 * 진입 스킵(즉시 노출)·흐름 없음 — 한 벌이 경로보다 길어 정지여도 실이 가득 차 보인다.
 */

const SAYU_FULL = `${SAYU_P1}   ${SAYU_P2}   ${SAYU_P3}`
const SPEED = 10 // px/s (viewBox 단위) — 존재만 하는 배경 속도 (데모 ③ 확정값)

// 진입 타이밍 (시안 ② 실측값 계열) — 실 글자 3.2ms 스태거·260ms, 묶음 300ms 간격·520ms
const CHAR_STAGGER_MS = 3.2
const CHAR_DUR_MS = 260
const GROUP_BASE_MS = 1300
const GROUP_GAP_MS = 300
const GROUP_DUR_MS = 520
// 큰 글자 12자 → 묶음 인덱스 (운영자: "레이지/데이/북클럽/4기모집 묶음 단위")
const GLYPH_GROUP = [0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 3]

const INTRO_DONE_MS = Math.max(
  SAYU_FULL.length * CHAR_STAGGER_MS + CHAR_DUR_MS,
  GROUP_BASE_MS + 3 * GROUP_GAP_MS + GROUP_DUR_MS,
)
const FLOW_START_MS = INTRO_DONE_MS + 500 // "다 노출되면 0.5초 후부터"

export function HeroBreathingPoster() {
  const rootRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const mounted = performance.now()
    let cancelled = false
    let anim: SVGAnimateElement | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    document.fonts.ready.then(() => {
      if (cancelled) return
      const tp = root.querySelector<SVGTextPathElement>("textPath[data-stream]")
      const pathEl = root.querySelector<SVGPathElement>("#heroSayuThread")
      if (!tp || !pathEl) return
      const L = pathEl.getTotalLength()
      const textEl = tp.closest("text") as SVGTextElement
      // 첫 벌(tspan들)만 놓인 상태에서 진행 길이 실측
      const P = textEl.getComputedTextLength()
      if (!(P > 0)) return
      // 오프셋이 [-P, 0] 사이를 돌 때 경로 [0, L]이 항상 덮이도록: K×P ≥ P + L.
      // +1벌은 폰트 스왑으로 실측치가 미세하게 달라져도 끝이 비지 않게 하는 보험.
      // 첫 벌은 진입 애니 중인 tspan 그대로 두고, 나머지 벌만 통짜로 이어붙인다
      const K = Math.max(2, Math.ceil((P + L) / P) + 1)
      tp.appendChild(document.createTextNode(`${SAYU_FULL}   `.repeat(K - 1)))
      // SMIL — 0 → -P 를 P/SPEED 초에 무한 반복. 진입이 모두 끝나고 0.5초 뒤 발화
      const a = document.createElementNS("http://www.w3.org/2000/svg", "animate") as SVGAnimateElement
      a.setAttribute("attributeName", "startOffset")
      a.setAttribute("from", "0")
      a.setAttribute("to", String(-P))
      a.setAttribute("dur", `${P / SPEED}s`)
      a.setAttribute("repeatCount", "indefinite")
      a.setAttribute("begin", "indefinite")
      tp.appendChild(a)
      anim = a
      const wait = Math.max(0, FLOW_START_MS - (performance.now() - mounted))
      timer = setTimeout(() => {
        if (!cancelled) a.beginElement()
      }, wait)
    })
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      anim?.remove()
    }
  }, [])

  return (
    <svg
      ref={rootRef}
      className={styles.poster}
      viewBox="0 0 400 500"
      role="img"
      aria-label="레이지데이 북클럽 4기 모집"
    >
      <defs>
        <path id="heroSayuThread" d={POSTER_THREAD_D} />
      </defs>
      <text className={styles.threadText} xmlSpace="preserve">
        <textPath href="#heroSayuThread" data-stream>
          {/* 첫 벌 — 글자별 tspan (시안 ② 진입: CSS 스태거라 JS 죽어도 노출 폴백) */}
          {`${SAYU_FULL}   `.split("").map((c, i) => (
            <tspan
              key={i}
              className={styles.introChar}
              style={{ ["--d" as string]: `${(i * CHAR_STAGGER_MS).toFixed(1)}ms` }}
            >
              {c}
            </tspan>
          ))}
        </textPath>
      </text>
      {POSTER_GLYPHS.map((g, i) => (
        <text
          key={i}
          x={g.x}
          y={g.y}
          fontSize={g.s}
          textAnchor="middle"
          dominantBaseline="central"
          className={`${styles.glyph} ${styles.glyphIn}`}
          style={{ ["--gd" as string]: `${GROUP_BASE_MS + GLYPH_GROUP[i] * GROUP_GAP_MS}ms` }}
        >
          {g.ch}
        </text>
      ))}
    </svg>
  )
}
