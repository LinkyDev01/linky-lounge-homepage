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
 * 2026-08-12 운영자(최종): **큰 글자 12자는 처음부터 떠 있다** — "레이지데이 북클럽
 * 4기 모집 텍스트는 처음부터 뜨고", 생기는 절차만 뺀다.
 * ① 실 위 본문만 2.2초에 걸쳐 스스로 그어진다 (붓끝이 닿는 순서 = draw 이징의
 *    역함수로 깐 글자별 딜레이. 첫 벌만 tspan 분해, CSS 스태거라 JS 없이도 동작).
 *    배분은 **경로 안에 보이는 구간(VISIBLE_RATIO)** 기준 — 경로 밖 글자까지 나눠
 *    가지면 화면이 먼저 다 차 버려 뒤가 멈춘 것처럼 보인다
 * ② 실이 다 그어지면(2.4초) **대기 없이 곧바로** 0.3초 등가속 → 정상 속도의 SMIL 무한 흐름
 * 같은 textPath 하나로 진입→흐름을 잇는다 — 첫 벌은 tspan, 이후 벌은 JS가
 * 폰트 로드 후 통짜로 이어붙이고 SMIL(begin=indefinite)을 시각에 맞춰 발화.
 *
 * 모션 원칙 M2의 허용 유형(존재만 하는 배경 루프 + 진입 1회). reduced-motion 이면
 * 진입 스킵(즉시 노출)·흐름 없음 — 한 벌이 경로보다 길어 정지여도 실이 가득 차 보인다.
 */

const SAYU_FULL = `${SAYU_P1}   ${SAYU_P2}   ${SAYU_P3}`
const SPEED = 10 // px/s (viewBox 단위) — 존재만 하는 배경 속도 (데모 ③ 확정값)

// ── 진입 타이밍 = hero-motion 시안 ①(실선 인트로)의 값 그대로 ────────────────
// 운영자 2026-08-12: "1번 시안처럼 그 속도와 애니메이션으로… 꼬불꼬불 선 대신
// 꼬불꼬불 텍스트가 같은 애니메이션과 속도로 반응하면 되겠어."
// ①은 실을 draw(2200ms, ease inOut(2))로 긋고, 1300ms 부터 큰 글자를 60ms 간격·
// 520ms·out-expo 로 하나씩 띄운다. 여기선 '선' 대신 '문장'이 같은 리듬으로 그어진다.
const DRAW_MS = 2200
const CHAR_DUR_MS = 200 // 그어지는 인상 — 글자 하나의 페이드는 짧게

/** easeInOutQuad(=anime 의 inOut(2))의 역함수 — 진행률 p 에 도달하는 정규화 시각.
 *  선이 그어질 때 위치 p 에 붓끝이 닿는 순간이므로, 그 자리의 글자가 뜰 시각이다.
 *  선형 스태거로 깔면 등속이 되어 ①의 '느리게 시작 → 빨라졌다 → 느리게 끝'이 사라진다. */
function drawTimeAt(p: number) {
  return p < 0.5 ? Math.sqrt(p / 2) : 1 - Math.sqrt((1 - p) / 2)
}

/** 한 벌(P≈3193) 중 **경로(L≈2612) 안에 놓여 실제로 보이는 비율** — 실측 389/480.
 *  뒤쪽 19% 는 경로를 넘어가 렌더되지 않는다. 이 구간까지 2.2초를 배분하면
 *  화면은 1.52초에 이미 다 차고 **877ms 동안 멈춘 것처럼 보인다**(실측, 운영자 지적:
 *  "보이지 않는 부분까지 생기는 것에 대한 딜레이인 것 같기도"). 그래서 배분을
 *  보이는 구간으로 압축하고, 경로 밖 글자는 끝 시각에 몰아 둔다(어차피 안 보인다).
 *  ⚠ 서체·본문·경로가 바뀌면 이 비율을 다시 재야 한다 (텍스트 길이 ÷ 경로 길이). */
const VISIBLE_RATIO = 0.81

const INTRO_DONE_MS = DRAW_MS + CHAR_DUR_MS // 큰 글자는 정적이라 실 그어짐이 곧 진입 전체

// 흐름 — 정지에서 툭 시작하지 않고 등가속으로 정상 속도까지 올린다.
// 진입 완료 직후 **대기 0** 이므로(운영자 확인 2026-08-12) 가속 자체를 더 빠르게:
// 0.5초 → **0.3초**. 등가속이면 이동 거리는 평균속도 × 시간 = (SPEED/2) × 0.3.
const RAMP_MS = 300
const RAMP_DIST = (SPEED * (RAMP_MS / 1000)) / 2
const FLOW_START_MS = INTRO_DONE_MS // 대기 없이 가속 구간으로 이어 붙인다

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
      // +1벌은 폰트 스왑으로 실측치가 미세하게 달라져도 끝이 비지 않게 하는 보험
      const K = Math.max(2, Math.ceil((P + L) / P) + 1)
      const wait = Math.max(0, FLOW_START_MS - (performance.now() - mounted))
      timer = setTimeout(() => {
        if (cancelled) return
        // ⚠ 성능: 진입용 tspan(480개)을 남긴 채 startOffset 을 굴리면 매 프레임
        // 글자마다 경로 재배치가 일어나 **30fps 로 반토막** 난다 (실측 33.3ms/frame,
        // 운영자 "뻣뻣해 보여"). 흐름 직전에 통짜 텍스트 노드 한 개로 되돌리면
        // 60fps 회복 — 진입이 끝난 시점이라 시각적으로는 같은 화면이다
        tp.textContent = `${SAYU_FULL}   `.repeat(K)
        // SMIL 2단 — ① 0.3초 가속 램프 ② 등속 무한 반복. 둘 다 네이티브 타임라인이라
        // 메인 스레드와 무관하게 이어지고, 램프 끝 속도와 등속 속도가 정확히 같아
        // 이음매가 보이지 않는다 (t² 곡선의 끝 기울기 2 × 평균속도 = SPEED).
        const mk = (attrs: Record<string, string>) => {
          const el = document.createElementNS("http://www.w3.org/2000/svg", "animate") as SVGAnimateElement
          el.setAttribute("attributeName", "startOffset")
          for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
          tp.appendChild(el)
          return el
        }
        const rampId = "lzHeroRamp"
        // keySplines "0.333 0 0.667 0.333" = s ∝ t² 의 정확한 3차 베지어 표현 (등가속)
        const ramp = mk({
          id: rampId,
          values: `0;${-RAMP_DIST}`,
          dur: `${RAMP_MS / 1000}s`,
          calcMode: "spline",
          keyTimes: "0;1",
          keySplines: "0.333 0 0.667 0.333",
          fill: "freeze",
          begin: "indefinite",
        })
        mk({
          values: `${-RAMP_DIST};${-(RAMP_DIST + P)}`,
          dur: `${P / SPEED}s`,
          repeatCount: "indefinite",
          begin: `${rampId}.end`,
        })
        ramp.beginElement()
        anim = ramp
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
          {/* 첫 벌 — 글자별 tspan. 딜레이를 draw 이징의 역함수로 깔아, 붓끝이 그
              자리에 닿는 순간 글자가 뜬다 = 시안 ①의 선 긋기와 같은 리듬·속도.
              CSS 애니라 JS 하이드레이션 전·실패 시에도 페인트부터 돈다 */}
          {(() => {
            const chars = `${SAYU_FULL}   `.split("")
            const last = chars.length - 1
            return chars.map((c, i) => (
              <tspan
                key={i}
                className={styles.introChar}
                style={{
                  ["--d" as string]: `${(DRAW_MS * drawTimeAt(Math.min(1, i / last / VISIBLE_RATIO))).toFixed(1)}ms`,
                }}
              >
                {c}
              </tspan>
            ))
          })()}
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
          // 등장 애니 없음 — 처음부터 완성 상태 (운영자 2026-08-12 최종)
          className={styles.glyph}
        >
          {g.ch}
        </text>
      ))}
    </svg>
  )
}
