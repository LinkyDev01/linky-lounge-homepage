"use client"

import { useEffect, useRef } from "react"
import m from "./lazyday-mark.module.css"

/**
 * 레이지데이 북클럽 동적 마크 — 채택안 (운영자 2026-08-12)
 * "로고 애니메이션은 9번으로 하되, 1번처럼 2행으로, 레이지데이는 라운딩해서 배열.
 *  로고 세로 길이는 레이지클럽 네비 기준 세로 길이 유지"
 *
 * = 시안 ①의 조형(2행 · I ♥ 위, LAZYDAY 는 곡선 배열) + 시안 ⑨의 모션(도미노).
 * 원본 포스터의 LAZYDAY 는 **가운데가 내려앉은 ∪(스마일)** 곡선이다 (∩ 아치가 아니다).
 *
 * ⚠ 아치 배치와 도미노 회전은 **서로 다른 요소**에 건다 — 한 요소의 transform 에
 * 둘을 얹으면 애니메이션이 배치 transform 을 덮어써 글자가 제자리로 튄다.
 * 바깥 span = 곡선 배치(정적), 안쪽 span = 도미노(rotateX).
 *
 * 높이는 --mark-h (레이지클럽 내비 실측 54.9px / 모바일 51.7px)를 컨테이너에 주고,
 * 글자 크기는 그 높이에서 역산한 배수로 따라간다 — 내비 행 높이가 흔들리지 않게.
 */


// 곡선 배치 — **반지름 6em 원호**에 7글자를 정직하게 얹은 값 (∪ = 가운데가 아래로).
// 운영자 2026-08-12 "라운딩 조금 더 (더 작은 반지름 호 형태로)": 구 값은 반지름 ≈11em
// 손그림 근사여서 완만했다. 6em 으로 좁히며 가운데 처짐 0.22 → 0.341em (1.55배).
// 회전은 그 지점의 접선 각(=asin(x/R)) — 글자가 호에 얹힌 것처럼 보이게 한다.
const ARCH_Y = [0, 0.192, 0.304, 0.341, 0.304, 0.192, 0]
const ARCH_R = [19.4, 12.8, 6.4, 0, -6.4, -12.8, -19.4]

/** 스텐실로 찍은 하트 (운영자 2026-08-12 정정: "크레파스보다는 스텐실로 입힌 질감").
 *  두 축으로 만든다:
 *  ① **형태** — 손으로 깎아낸 스텐실 판 (운영자 3차 정정 2026-08-12: 첨부 이모지형
 *     하트 기준). 큰 볼록 로브 + **뭉툭한 꼬리**(바닥을 한 점이 아니라 짧은 구간
 *     48–52 로) 베지어를 36개 짧은 직선으로 근사, 지터 ±0.45. **사알짝 비대칭** —
 *     오른쪽 로브만 1.5% 확대. 구 파라메트릭 하트(꼬리 뾰족·대칭)는 폐기
 *  ② **질감** — 등방성 반점(0.36), 단 제거는 **면적의 ~1%만 살짝 덜 칠해진** 수준
 *     (-0.6/1.5 → 최소 alpha 0.9, 대부분 완전 불투명). 가장자리 번짐 1.5
 *  ⚠ 반점·번짐 크기는 viewBox 단위라 **렌더 크기와 함께 축소된다** (내비 20px 기준). */
function Heart({ className = "" }: { className?: string }) {
  const d =
    "M51.6 84.1 L60.1 77.1 L67.8 70.8 L75.3 63.5 L80.9 56.8 L86.1 48.7 L89.3 41.3 L90.4 31.9 L89.7 24.4 L86.8 18.6 L82.6 13.3 L77.5 9.7 L71.9 7.5 L65.5 6.9 L60.9 7.2 L56.8 8.9 L53.6 10.9 L51.7 13.8 L50.0 17.7 L48.6 14.1 L46.1 11.5 L43.5 8.4 L39.2 7.2 L35.0 6.6 L28.6 7.4 L22.7 10.4 L17.3 13.3 L13.7 18.8 L10.8 24.8 L10.3 32.0 L11.3 40.9 L14.4 48.9 L19.3 56.1 L25.7 63.3 L33.0 70.2 L40.2 77.0 Z"
  return (
    <svg viewBox="-4 -4 108 100" className={`${m.heart} ${className}`} aria-hidden focusable="false">
      <filter id="lzCrayon" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed="13" result="edge" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="edge"
          scale="1.5"
          xChannelSelector="R"
          yChannelSelector="G"
          result="rough"
        />
        <feTurbulence type="fractalNoise" baseFrequency="0.36" numOctaves="2" seed="7" result="grain" />
        <feColorMatrix
          in="grain"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.6 1.5"
          result="grainA"
        />
        <feComposite in="rough" in2="grainA" operator="in" />
      </filter>
      <path className={m.heartFill} d={d} filter="url(#lzCrayon)" />
    </svg>
  )
}

export function LazydayMark({ className = "" }: { className?: string }) {
  const rootRef = useRef<HTMLSpanElement>(null)

  // 도미노 — 고정 세트가 아니라 **난수 그룹** (운영자 2026-08-12 정정):
  // 9개 요소(I ♥ L A Z Y D A Y)에서 매 라운드 1~3개를 무작위로 골라 동시에
  // 넘겼다가, 복귀가 끝나면 쉬고(1.8~3.4s 난수) 다른 조합으로 반복.
  // CSS 무한 루프로는 '랜덤'이 안 되므로 JS 가 라운드마다 .flipGo 를 붙였다 뗀다.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const flips = [...root.querySelectorAll<HTMLElement>("[data-flip]")]
    if (flips.length === 0) return
    let timer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false
    const round = () => {
      if (cancelled) return
      const k = 1 + Math.floor(Math.random() * 3) // 1~3개
      const picked = [...flips].sort(() => Math.random() - 0.5).slice(0, k)
      picked.forEach((el) => {
        el.classList.remove(m.flipGo)
        void el.offsetWidth // 재발화를 위한 리플로 강제 (같은 요소 연속 당첨 대비)
        el.classList.add(m.flipGo)
      })
      // 복귀(1.05s) 후 텀을 두고 다음 라운드 — "끝없이 몰아치는 건 아냐"
      timer = setTimeout(round, 1050 + 1800 + Math.random() * 1600)
    }
    timer = setTimeout(round, 900)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <span ref={rootRef} className={`${m.mark} ${className}`} role="img" aria-label="레이지데이 북클럽">
      <span className={m.top}>
        <span className={`${m.flip} ${m.iChar}`} data-flip>
          I
        </span>
        <span className={m.flip} data-flip>
          <Heart />
        </span>
      </span>
      <span className={m.arch}>
        {"LAZYDAY".split("").map((ch, i) => (
          <span
            key={i}
            className={m.slot}
            style={{ "--ay": `${ARCH_Y[i]}em`, "--ar": `${ARCH_R[i]}deg` } as React.CSSProperties}
          >
            <span className={m.flip} data-flip>
              {ch}
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}
