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

/** 스텐실로 찍은 하트 (운영자 2026-08-12 정정: "크레파스보다는 스텐실로 입힌 질감").
 *  두 축으로 만든다:
 *  ① **형태** — 손으로 깎아낸 스텐실 판. 하트 파라메트릭 곡선을 26개 짧은 직선으로
 *     근사하고 꼭짓점마다 ±0.9 흔들었다. 완전한 곡선이 아니라 "아주 미세한 직선적
 *     성격"이 남아, 커터로 오려낸 판처럼 보인다 (베지어 곡선 버전은 폐기)
 *  ② **질감** — 스프레이가 판 위로 앉은 반점. 크레파스의 방향성 결(x 저주파·y 고주파)과
 *     달리 **등방성**(0.36)이어야 스텐실이 된다. 가장자리 번짐은 아주 약하게(1.5)
 *  ⚠ 반점·번짐 크기는 viewBox 단위라 **렌더 크기와 함께 축소된다** (내비 20px 기준). */
function Heart({ className = "" }: { className?: string }) {
  const d =
    "M49.2 24.6 L51.1 22.5 L54.7 14.4 L63.7 7.9 L74.6 6.0 L87.1 11.1 L93.7 21.0 L93.5 33.8 L87.1 47.0 L75.4 57.2 L63.3 68.4 L53.7 77.2 L50.3 83.5 L50.2 86.2 L49.1 83.2 L44.8 76.1 L37.2 68.1 L25.7 58.6 L12.7 47.2 L5.9 33.4 L5.9 21.2 L12.7 11.7 L25.6 5.8 L36.1 7.3 L45.5 13.8 L49.2 21.3 Z"
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
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.6 1.36"
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
