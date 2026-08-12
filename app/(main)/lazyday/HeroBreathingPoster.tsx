"use client"

import { useEffect, useRef } from "react"
import { POSTER_THREAD_D, POSTER_GLYPHS, SAYU_P1, SAYU_P2, SAYU_P3 } from "./poster-thread"
import styles from "./HeroBreathingPoster.module.css"

/**
 * 숨 쉬는 포스터 — 히어로 채택본 (2026-08-11, 운영자 "3안 업데이트한걸로 포스터
 * 자리를 대체해줘"). hero-motion 데모 ③(BreatheDemo)의 픽셀 동일 이식.
 *
 * 실 = 4기 포스터에서 골격 추출한 실측 한붓 경로(poster-thread.ts), 큰 글자 12자는
 * 실측 좌표에 완전 정적. 〈사유의 기슭〉 전문이 실을 따라 흐른다 — 한쪽 끝에서
 * 글자가 태어나고 반대쪽 끝에서 사라지는 무한 순환 (10px/s, 실이 비는 구간 없음:
 * 본문을 K벌 이어붙여 오프셋을 한 벌 길이로 순환. K = ceil((P+L)/P), 폰트 로드 후 실측).
 *
 * 모션 원칙 M2의 허용 유형(존재만 하는 배경 루프). prefers-reduced-motion 이면
 * 정지 상태로 두는데, 한 벌(~460자 × ~7px ≈ 3200)이 경로(~2687)보다 길어 정지여도
 * 실이 가득 차 보인다.
 */

const SAYU_FULL = `${SAYU_P1}   ${SAYU_P2}   ${SAYU_P3}`
const SPEED = 10 // px/s — 존재만 하는 배경 속도 (데모 ③ 확정값)

export function HeroBreathingPoster() {
  const rootRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    let cancelled = false

    document.fonts.ready.then(() => {
      if (cancelled) return
      const tp = root.querySelector<SVGTextPathElement>("textPath[data-stream]")
      const pathEl = root.querySelector<SVGPathElement>("#heroSayuThread")
      if (!tp || !pathEl) return
      const L = pathEl.getTotalLength()
      const textEl = tp.closest("text") as SVGTextElement
      tp.textContent = `${SAYU_FULL}   ` // 한 벌만 놓고 진행 길이 실측
      const P = textEl.getComputedTextLength()
      // 오프셋이 [-P, 0] 사이를 돌 때 경로 [0, L]이 항상 덮이도록: K×P ≥ P + L
      const K = Math.max(2, Math.ceil((P + L) / P))
      tp.textContent = `${SAYU_FULL}   `.repeat(K)
      const t0 = performance.now()
      const tick = (now: number) => {
        const t = (now - t0) / 1000
        if (P > 0) tp.setAttribute("startOffset", String(-((t * SPEED) % P)))
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
