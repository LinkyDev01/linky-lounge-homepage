"use client"

import { useEffect, useRef } from "react"
import { POSTER_THREAD_D, POSTER_GLYPHS, SAYU_P1, SAYU_P2, SAYU_P3 } from "./poster-thread"
import styles from "./HeroBreathingPoster.module.css"

/**
 * 숨 쉬는 포스터 — 히어로 채택본 (2026-08-11, hero-motion 시안 ③ 이식).
 *
 * 실 = 4기 포스터에서 골격 추출한 실측 한붓 경로(poster-thread.ts), 큰 글자 12자는
 * 실측 좌표에 완전 정적. 〈사유의 기슭〉 전문이 실을 따라 흐른다 — 한쪽 끝에서
 * 글자가 태어나고 반대쪽 끝에서 사라지는 무한 순환 (실이 비는 구간 없음:
 * 본문을 K벌 이어붙여 오프셋을 한 벌 길이로 순환).
 *
 * 2026-08-12 운영자 원본 스펙 반영:
 * · 서체 Pretendard (Black/Regular, CDN 로드) · 실 위 글자 원본 비율 10.5
 * · 흐름은 JS RAF 속성 갱신 → **SMIL <animate>** 로 교체 — 브라우저 네이티브
 *   타임라인이라 메인 스레드 상태와 무관하게 매 프레임 연속 보간 ("더 부드럽게").
 *   JS는 폰트 로드 후 한 벌 길이(P)를 실측해 반복 벌 수와 주기만 정한다.
 *
 * 모션 원칙 M2의 허용 유형(존재만 하는 배경 루프). prefers-reduced-motion 이면
 * 정지 — 한 벌이 경로보다 길어 정지 상태여도 실이 가득 차 보인다.
 */

const SAYU_FULL = `${SAYU_P1}   ${SAYU_P2}   ${SAYU_P3}`
const SPEED = 10 // px/s (viewBox 단위) — 존재만 하는 배경 속도 (데모 ③ 확정값)

export function HeroBreathingPoster() {
  const rootRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let cancelled = false
    let anim: SVGElement | null = null

    document.fonts.ready.then(() => {
      if (cancelled) return
      const tp = root.querySelector<SVGTextPathElement>("textPath[data-stream]")
      const pathEl = root.querySelector<SVGPathElement>("#heroSayuThread")
      if (!tp || !pathEl) return
      const L = pathEl.getTotalLength()
      const textEl = tp.closest("text") as SVGTextElement
      tp.textContent = `${SAYU_FULL}   ` // 한 벌만 놓고 진행 길이 실측
      const P = textEl.getComputedTextLength()
      if (!(P > 0)) return
      // 오프셋이 [-P, 0] 사이를 돌 때 경로 [0, L]이 항상 덮이도록: K×P ≥ P + L.
      // +1벌은 폰트 스왑으로 실측치가 미세하게 달라져도 끝이 비지 않게 하는 보험
      const K = Math.max(2, Math.ceil((P + L) / P) + 1)
      tp.textContent = `${SAYU_FULL}   `.repeat(K)
      // SMIL — 0 → -P 를 P/SPEED 초에, 무한 반복 (연속 보간, JS 개입 없음)
      const a = document.createElementNS("http://www.w3.org/2000/svg", "animate")
      a.setAttribute("attributeName", "startOffset")
      a.setAttribute("from", "0")
      a.setAttribute("to", String(-P))
      a.setAttribute("dur", `${P / SPEED}s`)
      a.setAttribute("repeatCount", "indefinite")
      tp.appendChild(a)
      anim = a
    })
    return () => {
      cancelled = true
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
      <text className={styles.threadText}>
        <textPath href="#heroSayuThread" data-stream>
          {`${SAYU_FULL}   `}
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
          className={styles.glyph}
        >
          {g.ch}
        </text>
      ))}
    </svg>
  )
}
