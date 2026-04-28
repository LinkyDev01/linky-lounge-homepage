type Props = {
  className?: string
  title?: string
}

/**
 * 양귀비 단독 — 한 그루의 양귀비, 봉오리는 드룹, 꽃잎 두 장이 곁에 떨어져 있음.
 * "혼자 머물러 책에 빠져있는 사람"의 은유.
 * 사용처: VibeSection 카드 2 ("어떤 사람과 함께하나요?")
 */
export function Solo({ className, title }: Props) {
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

      <path d="M140,346 Q132,280 128,200 Q126,140 130,95 Q132,80 122,82" strokeWidth={1.1} />

      <g transform="translate(118 86) rotate(-50)">
        <path d="M0,0 C-9,2 -14,16 -10,28 C-3,36 12,36 16,28 C20,16 14,2 0,0 Z" />
        <path d="M-3,1 C-7,-4 -3,-9 0,-9" strokeWidth={0.6} />
        <path d="M3,1 C7,-4 3,-9 0,-9" strokeWidth={0.6} />
        <path d="M-9,12 L-13,11" strokeWidth={0.4} />
        <path d="M-8,22 L-12,24" strokeWidth={0.4} />
        <path d="M16,12 L20,11" strokeWidth={0.4} />
        <path d="M16,22 L20,24" strokeWidth={0.4} />
      </g>

      <g transform="translate(126 215) rotate(-10)">
        <path d="M0,-3 C-6,-2 -14,-4 -20,-1 C-15,3 -22,7 -28,12 C-22,16 -16,22 -8,22 C-3,20 0,15 0,-3 Z" strokeWidth={0.9} />
        <path d="M-2,-1 L-25,11" strokeWidth={0.4} opacity={0.6} />
        <path d="M-5,2 L-17,-1" strokeWidth={0.3} opacity={0.4} />
      </g>

      <g transform="translate(170 320) rotate(45)">
        <path d="M0,-22 C12,-20 20,-10 22,2 C20,14 12,22 -2,20 C-14,18 -22,8 -22,-4 C-18,-16 -8,-23 0,-22 Z" strokeWidth={0.9} />
        <path d="M-5,-15 C-2,-7 3,3 7,12" strokeWidth={0.4} opacity={0.6} />
        <circle cx={0} cy={-22} r={0.6} fill="currentColor" stroke="none" />
      </g>

      <g transform="translate(80 335) rotate(-30) scale(0.7)">
        <path d="M0,-22 C12,-20 20,-10 22,2 C20,14 12,22 -2,20 C-14,18 -22,8 -22,-4 C-18,-16 -8,-23 0,-22 Z" strokeWidth={0.8} />
        <circle cx={0} cy={-22} r={0.5} fill="currentColor" stroke="none" />
      </g>

      <circle cx={120} cy={350} r={0.6} fill="currentColor" stroke="none" />
      <circle cx={150} cy={355} r={0.5} fill="currentColor" stroke="none" />
      <circle cx={195} cy={350} r={0.4} fill="currentColor" stroke="none" />
      <circle cx={60} cy={350} r={0.4} fill="currentColor" stroke="none" />
      <circle cx={210} cy={335} r={0.4} fill="currentColor" stroke="none" />
    </svg>
  )
}
