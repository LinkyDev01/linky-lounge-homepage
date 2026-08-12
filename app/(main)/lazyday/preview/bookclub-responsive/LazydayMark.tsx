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

/** 크레파스로 칠한 하트 (운영자 2026-08-12 첨부 굿즈 원본 — 빗금 스크리블 폐기).
 *  꽉 채운 빨강 + ① 가장자리를 밀어 삐죽하게(feDisplacementMap) ② 칠이 성긴 결을
 *  가로로 길게 파냄(feTurbulence 를 x 저주파·y 고주파로 = 크레파스 획 방향).
 *  ⚠ 결·삐침의 크기는 viewBox 단위라 **렌더 크기와 함께 축소된다** — 내비에서는
 *  20px 남짓으로 그려지므로 결을 굵게(y 0.21) 잡아야 작은 화면에서도 보인다
 *  (운영자 "작은 화면으로 보는 만큼 조금 더 질감과 결을 살려서 거칠게").
 *  제거율은 낮게(-1.32/1.37) — 대부분 불투명해야 크레파스처럼 진하게 칠한 느낌이 난다. */
function Heart({ className = "" }: { className?: string }) {
  const d =
    "M50 88 C30 70 6 52 6 32 C6 16 20 6 33 10 C41 12 47 20 50 28 C53 19 60 11 69 9 C83 6 95 17 94 33 C93 53 70 70 50 88 Z"
  return (
    <svg viewBox="-8 -8 116 108" className={`${m.heart} ${className}`} aria-hidden focusable="false">
      <filter id="lzCrayon" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="3" seed="11" result="edge" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="edge"
          scale="5.5"
          xChannelSelector="R"
          yChannelSelector="G"
          result="rough"
        />
        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.21" numOctaves="3" seed="5" result="grain" />
        <feColorMatrix
          in="grain"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.32 1.37"
          result="grainA"
        />
        <feComposite in="rough" in2="grainA" operator="in" />
      </filter>
      <path className={m.heartFill} d={d} filter="url(#lzCrayon)" />
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
