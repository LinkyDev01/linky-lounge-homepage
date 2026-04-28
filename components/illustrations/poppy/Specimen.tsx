type Props = {
  className?: string
  title?: string
}

/**
 * 양귀비 표본 — 한 그루에 꽃·잎·봉오리·씨앗꼬투리가 모두 달려있는 식물도감 스타일.
 * 비대칭 composition (꽃이 왼쪽 위, 곁가지가 오른쪽).
 * 사용처: AboutSection 인용구 옆 (showcase piece)
 */
export function Specimen({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 240 360"
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

      <path d="M132,348 Q124,280 118,220 Q112,160 106,100" strokeWidth={1.2} />

      <g transform="translate(100 75)">
        <path d="M0,-2 C-20,-8 -28,-26 -8,-38 C0,-40 12,-36 16,-26 C18,-12 12,-5 0,-2 Z" />
        <path d="M-2,0 C-8,-20 -26,-28 -38,-8 C-40,0 -36,12 -26,16 C-12,18 -5,12 -2,0 Z" />
        <path d="M0,2 C20,8 28,26 8,38 C0,40 -12,36 -16,26 C-18,12 -12,5 0,2 Z" />
        <path d="M2,0 C8,20 26,28 38,8 C40,0 36,-12 26,-16 C12,-18 5,-12 2,0 Z" />
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

      <g transform="translate(118 220)">
        <path d="M0,-3 C-6,-2 -14,-4 -20,-1 C-15,3 -22,7 -28,12 C-22,16 -16,22 -8,22 C-3,20 0,15 0,-3 Z" />
        <path d="M-2,-1 L-25,11" strokeWidth={0.4} opacity={0.6} />
        <path d="M-5,2 L-17,-1" strokeWidth={0.3} opacity={0.4} />
        <path d="M-8,8 L-22,8" strokeWidth={0.3} opacity={0.4} />
      </g>

      <g>
        <path d="M122,265 Q140,260 158,250 Q168,245 172,242" strokeWidth={0.9} />
        <g transform="translate(174 240)">
          <path d="M0,0 C-7,2 -10,12 -7,20 C-2,26 8,26 11,20 C14,12 11,2 0,0 Z" />
          <path d="M-3,1 C-6,-3 -3,-6 0,-6" strokeWidth={0.5} />
          <path d="M3,1 C6,-3 3,-6 0,-6" strokeWidth={0.5} />
          <path d="M-7,12 L-10,11" strokeWidth={0.4} />
          <path d="M11,12 L14,11" strokeWidth={0.4} />
        </g>
      </g>

      <g>
        <path d="M130,310 Q150,305 168,300 Q175,298 180,295" strokeWidth={0.9} />
        <g transform="translate(184 293)">
          <ellipse cx={0} cy={0} rx={6} ry={8} strokeWidth={0.9} />
          <path d="M-5,-7 L5,-7" strokeWidth={0.7} />
          <path d="M-3,-9 L-2,-13" strokeWidth={0.4} />
          <path d="M0,-9 L0,-14" strokeWidth={0.4} />
          <path d="M3,-9 L2,-13" strokeWidth={0.4} />
        </g>
      </g>

      <circle cx={142} cy={350} r={0.6} fill="currentColor" stroke="none" />
      <circle cx={120} cy={355} r={0.5} fill="currentColor" stroke="none" />
      <circle cx={155} cy={353} r={0.5} fill="currentColor" stroke="none" />
      <circle cx={108} cy={350} r={0.4} fill="currentColor" stroke="none" />
    </svg>
  )
}
