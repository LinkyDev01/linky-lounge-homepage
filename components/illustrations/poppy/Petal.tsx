type Props = {
  className?: string
  title?: string
}

/**
 * 양귀비 꽃잎 한 장 — 떨어진 후의 모습
 * 사용처: section divider, Apply CTA 장식, fallen-petal 강조
 */
export function Petal({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      stroke="currentColor"
      fill="none"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-hidden={!title}
    >
      {title && <title>{title}</title>}
      <g transform="translate(50 52) rotate(28)">
        <path d="M0,-26 C14,-24 25,-12 26,3 C24,18 12,26 -2,25 C-16,22 -26,10 -26,-5 C-22,-20 -10,-27 0,-26 Z" />
        <path d="M-6,-18 C-2,-8 3,2 8,15" strokeWidth={0.5} opacity={0.55} />
        <path d="M2,-22 C5,-12 8,-2 12,8" strokeWidth={0.4} opacity={0.4} />
        <circle cx={0} cy={-26} r={0.7} fill="currentColor" stroke="none" />
      </g>
    </svg>
  )
}
