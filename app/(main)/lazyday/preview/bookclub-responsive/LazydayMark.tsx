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

/** 도미노 발화 세트 — 요소 순서 I ♥ L A Z Y D A Y 를 1·2·3·3 개씩 묶는다.
 *  운영자 2026-08-12 "1, 2 3, 4 5 6, 7 8 9 10 … 파도타기보다 각 파트가 반복되는
 *  형태. 완전 연속이라기보다 한 세트씩 띠용 띠용" — 같은 세트는 **동시에** 넘어가고,
 *  세트 사이에만 간격이 있어 낱글자 파도가 아니라 덩어리 리듬이 된다. */
const FLIP_SET = [0, 1, 1, 2, 2, 2, 3, 3, 3]

// 곡선 배치 — **반지름 6em 원호**에 7글자를 정직하게 얹은 값 (∪ = 가운데가 아래로).
// 운영자 2026-08-12 "라운딩 조금 더 (더 작은 반지름 호 형태로)": 구 값은 반지름 ≈11em
// 손그림 근사여서 완만했다. 6em 으로 좁히며 가운데 처짐 0.22 → 0.341em (1.55배).
// 회전은 그 지점의 접선 각(=asin(x/R)) — 글자가 호에 얹힌 것처럼 보이게 한다.
const ARCH_Y = [0, 0.192, 0.304, 0.341, 0.304, 0.192, 0]
const ARCH_R = [19.4, 12.8, 6.4, 0, -6.4, -12.8, -19.4]

/** 크레파스로 칠한 하트 — 운영자 첨부 굿즈 원본에 맞춘 값 (2026-08-12 2차 조정).
 *  원본은 **꽉 찬 선명한 빨강에 테두리가 또렷**하고 질감은 미세하다. 1차 시도는
 *  파냄(-1.32/1.37)과 가장자리 변형(5.5)이 과해 "크레파스 같지도 않고 칠해지지 않은
 *  부분이 많고 테두리도 모호"했다 — 운영자 지적. 그래서:
 *  ① 파냄을 -0.45/1.3 으로 낮춰 **거의 불투명**(최소 alpha ≈0.85)하게 채우고
 *  ② 가장자리 변형은 2.5 로 줄여 테두리를 또렷하게 두되 완전 매끈하진 않게
 *  결은 x 저주파·y 고주파(0.06 0.18) — 크레파스 획 방향.
 *  ⚠ 결·삐침 크기는 viewBox 단위라 **렌더 크기와 함께 축소된다** (내비 20px 기준). */
function Heart({ className = "" }: { className?: string }) {
  const d =
    "M50 88 C30 70 6 52 6 32 C6 16 20 6 33 10 C41 12 47 20 50 28 C53 19 60 11 69 9 C83 6 95 17 94 33 C93 53 70 70 50 88 Z"
  return (
    <svg viewBox="-8 -8 116 108" className={`${m.heart} ${className}`} aria-hidden focusable="false">
      <filter id="lzCrayon" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="11" result="edge" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="edge"
          scale="2.5"
          xChannelSelector="R"
          yChannelSelector="G"
          result="rough"
        />
        <feTurbulence type="fractalNoise" baseFrequency="0.06 0.18" numOctaves="2" seed="5" result="grain" />
        <feColorMatrix
          in="grain"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.45 1.3"
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
        <span className={`${m.flip} ${m.iChar}`} style={{ "--g": FLIP_SET[0] } as React.CSSProperties}>
          I
        </span>
        <span className={m.flip} style={{ "--g": FLIP_SET[1] } as React.CSSProperties}>
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
            <span className={m.flip} style={{ "--g": FLIP_SET[i + 2] } as React.CSSProperties}>
              {ch}
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}
