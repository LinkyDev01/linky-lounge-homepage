type Props = {
  className?: string
  title?: string
}

/**
 * 양귀비 만개 — 4장의 와이드 페탈과 stamen ring
 * 사용처: How 타임라인 02 (절정), Specimen·Cluster의 메인 꽃
 */
export function Bloom({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 120 100"
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
      <g transform="translate(60 50)">
        <path d="M0,-2 C-22,-8 -30,-26 -8,-38 C0,-40 12,-36 16,-26 C18,-12 12,-5 0,-2 Z" />
        <path d="M-2,0 C-8,-22 -26,-30 -38,-8 C-40,0 -36,12 -26,16 C-12,18 -5,12 -2,0 Z" />
        <path d="M0,2 C22,8 30,26 8,38 C0,40 -12,36 -16,26 C-18,12 -12,5 0,2 Z" />
        <path d="M2,0 C8,22 26,30 38,8 C40,0 36,-12 26,-16 C12,-18 5,-12 2,0 Z" />
        <circle cx={0} cy={0} r={3.5} strokeWidth={1.2} />
        <path d="M-2,-4 L-3,-7" strokeWidth={0.5} />
        <path d="M2,-4 L3,-7" strokeWidth={0.5} />
        <path d="M-4,-2 L-7,-3" strokeWidth={0.5} />
        <path d="M4,-2 L7,-3" strokeWidth={0.5} />
        <path d="M-4,2 L-7,3" strokeWidth={0.5} />
        <path d="M4,2 L7,3" strokeWidth={0.5} />
        <path d="M-2,4 L-3,7" strokeWidth={0.5} />
        <path d="M2,4 L3,7" strokeWidth={0.5} />
        <circle cx={-3} cy={-7} r={0.6} fill="currentColor" stroke="none" />
        <circle cx={3} cy={-7} r={0.6} fill="currentColor" stroke="none" />
        <circle cx={-7} cy={-3} r={0.6} fill="currentColor" stroke="none" />
        <circle cx={7} cy={-3} r={0.6} fill="currentColor" stroke="none" />
        <circle cx={-7} cy={3} r={0.6} fill="currentColor" stroke="none" />
        <circle cx={7} cy={3} r={0.6} fill="currentColor" stroke="none" />
        <circle cx={-3} cy={7} r={0.6} fill="currentColor" stroke="none" />
        <circle cx={3} cy={7} r={0.6} fill="currentColor" stroke="none" />
      </g>
    </svg>
  )
}
