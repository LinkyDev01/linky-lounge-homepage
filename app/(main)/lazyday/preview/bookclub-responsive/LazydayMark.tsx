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

// 곡선 배치 실측 — 시안 ① 확정값 (em, 아래로 +) / 접선 방향 회전
const ARCH_Y = [0, 0.13, 0.2, 0.22, 0.19, 0.1, -0.04]
const ARCH_R = [11, 6.5, 2, 0, -3.5, -9, -15]

function Heart({ className = "" }: { className?: string }) {
  const d =
    "M50 83 C26 64 8 46 11.5 29.5 C14 16.5 29 10.5 38.5 17.5 C44 21.5 47.8 26.5 50 32 C52.5 26 56.5 21 62 17 C71.5 10 86.5 16 88.8 29 C91.8 45.5 75 63.5 50 83 Z"
  return (
    <svg viewBox="0 0 100 92" className={`${m.heart} ${className}`} aria-hidden focusable="false">
      <clipPath id="lzMarkHeartClip">
        <path d={d} />
      </clipPath>
      <g clipPath="url(#lzMarkHeartClip)" className={m.heartScribble}>
        <path d="M6 47 L84 14" />
        <path d="M4 60 L92 24" />
        <path d="M14 70 L94 37" />
        <path d="M26 79 L92 51" />
        <path d="M38 87 L88 65" />
        <path d="M20 30 L54 15" />
      </g>
      <path className={m.heartOutline} d={d} />
    </svg>
  )
}

export function LazydayMark({ className = "" }: { className?: string }) {
  return (
    <span className={`${m.mark} ${className}`} role="img" aria-label="레이지데이 북클럽">
      <span className={m.top}>
        <span className={`${m.flip} ${m.iChar}`} style={{ "--i": 0 } as React.CSSProperties}>
          I
        </span>
        <span className={m.flip} style={{ "--i": 1 } as React.CSSProperties}>
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
            <span className={m.flip} style={{ "--i": i + 2 } as React.CSSProperties}>
              {ch}
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}
