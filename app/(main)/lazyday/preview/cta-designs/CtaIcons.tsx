import s from "./cta-designs.module.css"

/**
 * 텍스트 링크형(E) CTA 에 붙일 아이콘 후보들 (2026-08-12, 운영자
 * "밑줄 정도면 충분한데 단순 화살표가 최선일까, 아니면 적절한 아이콘 만들어볼래?").
 *
 * 전부 인라인 SVG — 15px 텍스트 옆에 서므로 실제 렌더 크기는 12~15px 다.
 * 그 크기에서 뭉개지지 않게 stroke 는 굵게(1.5~1.8 viewBox 단위), 디테일은 최소로.
 * 손그림 계열은 마크(LazydayMark)의 크레파스 필터와 **같은 문법**을 쓰되,
 * 반점·번짐이 viewBox 단위라 작은 크기에서 노이즈로 보이지 않게 강도를 낮췄다.
 */

/** 손그림 계열 공용 필터 — 마크의 lzCrayon 을 작은 크기용으로 순화
 *  (번짐 1.5 → 0.6, 반점 0.36 → 0.5 이지만 제거량은 더 적게) */
function CrayonDefs({ id }: { id: string }) {
  return (
    <filter id={id} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="2" seed="13" result="edge" />
      <feDisplacementMap in="SourceGraphic" in2="edge" scale="0.9" xChannelSelector="R" yChannelSelector="G" result="rough" />
      <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="7" result="grain" />
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.35 1.35" result="grainA" />
      <feComposite in="rough" in2="grainA" operator="in" />
    </filter>
  )
}

/** ② 활자 화살표 → — 지금 시안. 서체가 그리는 글리프라 본문과 굵기가 자동으로 맞는다 */
export function IconArrowGlyph() {
  return (
    <span className={s.iconGlyph} aria-hidden>
      →
    </span>
  )
}

/** ③ 얇은 셰브런 › — 가장 작고 조용하다. 15px 에서 가장 또렷 */
export function IconChevron() {
  return (
    <svg className={s.icon} viewBox="0 0 12 14" aria-hidden focusable="false">
      <path d="M4 3 L8.6 7 L4 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** ④ 손그림 화살표 — 마크·하트와 같은 손의 흔적.
 *  ⚠ 이 크기(11~12px)에서는 **필터의 거칠기가 거의 안 보인다** — 번짐이 viewBox 단위라
 *  같이 축소되기 때문. 그래서 손맛을 **형태 자체**에 넣는다:
 *  ① 축은 미세하게 휘고 ② 촉 두 획의 길이·각도가 다르고 ③ 교차점을 살짝 **지나쳐** 긋는다
 *  (손으로 그은 화살표에서 가장 눈에 띄는 흔적). 필터는 가장자리에만 얇게 얹는다. */
export function IconHandArrow() {
  return (
    <svg className={s.icon} viewBox="0 0 24 15" aria-hidden focusable="false">
      <CrayonDefs id="ctaCrayonArrow" />
      <g filter="url(#ctaCrayonArrow)" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.4 8.4 C7.6 7.1 13.4 8.0 20.3 7.0" strokeWidth="1.8" />
        <path d="M15.0 2.9 C16.8 4.5 18.8 6.1 21.0 6.9" strokeWidth="1.7" />
        <path d="M15.7 11.9 C17.3 10.2 19.1 8.4 20.7 7.5" strokeWidth="1.6" />
      </g>
    </svg>
  )
}

/** ⑤ 크레파스 하트 — 마크(I♥LAZYDAY)의 하트를 그대로 축소해 가져온 것.
 *  브랜드 서명이 가장 직접적이지만, '좋아요'로 읽힐 위험이 있다 */
export function IconHeart() {
  const d =
    "M47.8 84.0 L56.6 76.8 L66.6 69.2 L74.4 62.7 L81.1 55.3 L86.9 47.9 L90.4 40.3 L91.9 30.8 L90.7 23.4 L88.3 17.5 L83.7 12.6 L78.9 8.9 L72.8 6.3 L66.2 5.8 L61.5 6.5 L57.6 9.2 L54.1 13.9 L51.3 19.5 L49.6 26.8 L48.1 19.2 L46.7 14.3 L43.8 10.4 L40.4 8.2 L35.7 8.0 L29.2 8.9 L24.1 11.8 L18.2 14.8 L14.5 19.9 L11.8 25.9 L10.7 33.0 L12.2 40.9 L15.2 49.0 L19.7 56.2 L26.3 63.1 L33.5 69.6 L39.9 76.6 Z"
  return (
    <svg className={s.icon} viewBox="-4 -4 108 100" aria-hidden focusable="false">
      <CrayonDefs id="ctaCrayonHeart" />
      <path d={d} fill="currentColor" filter="url(#ctaCrayonHeart)" />
    </svg>
  )
}

/** ⑥ 책갈피 — 독서모임 맥락을 직접 말한다. '읽기 시작' 은유 */
export function IconBookmark() {
  return (
    <svg className={s.icon} viewBox="0 0 12 15" aria-hidden focusable="false">
      <path
        d="M2.2 1.6 H9.8 V13.2 L6 9.9 L2.2 13.2 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** ⑦ 문 — '들어오세요'. 모집 CTA 의 뜻에 가장 가깝지만 아이콘이 커야 읽힌다 */
export function IconDoor() {
  return (
    <svg className={s.icon} viewBox="0 0 14 15" aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.2 1.8 H12.2 V13.2 H8.2" />
        <path d="M1.6 7.5 H8" />
        <path d="M5.2 4.7 L8 7.5 L5.2 10.3" />
      </g>
    </svg>
  )
}
