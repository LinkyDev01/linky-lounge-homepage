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
