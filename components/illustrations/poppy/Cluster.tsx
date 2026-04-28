type Props = {
  className?: string
  title?: string
}

/**
 * 양귀비 클러스터 — 세 줄기가 한 뿌리에서 자라며 각각 다른 단계 (봉오리·만개·씨앗꼬투리).
 * "여러 결의 사람이 같은 자리에 모여있다"는 은유.
 * 사용처: VibeSection 카드 1 ("어떤 대화가 오가나요?")
 */
export function Cluster({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 320 280"
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

      <path d="M158,250 Q140,180 118,80" strokeWidth={1.1} />
      <path d="M162,250 Q165,170 178,80" strokeWidth={1.1} />
      <path d="M166,252 Q190,200 230,150" strokeWidth={1} />

      <g transform="translate(118 75) rotate(-15)">
        <path d="M0,0 C-8,2 -12,15 -8,24 C-3,30 8,30 12,24 C16,15 12,2 0,0 Z" />
        <path d="M-3,1 C-7,-3 -3,-8 0,-8" strokeWidth={0.6} />
        <path d="M3,1 C7,-3 3,-8 0,-8" strokeWidth={0.6} />
        <path d="M-8,12 L-11,11" strokeWidth={0.4} />
        <path d="M-8,20 L-11,22" strokeWidth={0.4} />
        <path d="M12,12 L15,11" strokeWidth={0.4} />
        <path d="M12,20 L15,22" strokeWidth={0.4} />
      </g>

      <g transform="translate(178 75)">
        <path d="M0,-2 C-18,-8 -25,-22 -8,-32 C0,-34 10,-30 14,-22 C16,-10 10,-5 0,-2 Z" />
        <path d="M-2,0 C-8,-18 -22,-25 -32,-8 C-34,0 -30,10 -22,14 C-10,16 -5,10 -2,0 Z" />
        <path d="M0,2 C18,8 25,22 8,32 C0,34 -10,30 -14,22 C-16,10 -10,5 0,2 Z" />
        <path d="M2,0 C8,18 22,25 32,8 C34,0 30,-10 22,-14 C10,-16 5,-10 2,0 Z" />
        <circle cx={0} cy={0} r={3} strokeWidth={1.1} />
        <circle cx={-3} cy={-6} r={0.5} fill="currentColor" stroke="none" />
        <circle cx={3} cy={-6} r={0.5} fill="currentColor" stroke="none" />
        <circle cx={-6} cy={-3} r={0.5} fill="currentColor" stroke="none" />
        <circle cx={6} cy={-3} r={0.5} fill="currentColor" stroke="none" />
        <circle cx={-6} cy={3} r={0.5} fill="currentColor" stroke="none" />
        <circle cx={6} cy={3} r={0.5} fill="currentColor" stroke="none" />
        <circle cx={-3} cy={6} r={0.5} fill="currentColor" stroke="none" />
        <circle cx={3} cy={6} r={0.5} fill="currentColor" stroke="none" />
      </g>

      <g transform="translate(232 142)">
        <ellipse cx={0} cy={0} rx={8} ry={10} strokeWidth={1} />
        <path d="M-7,-9 L7,-9" strokeWidth={0.8} />
        <path d="M-5,-11 L-4,-15" strokeWidth={0.5} />
        <path d="M-1,-12 L-1,-16" strokeWidth={0.5} />
        <path d="M3,-12 L4,-16" strokeWidth={0.5} />
        <path d="M-3,2 C-2,8 0,12 2,14" strokeWidth={0.4} opacity={0.5} />
      </g>

      <g transform="translate(150 245)">
        <path d="M0,0 C-12,-2 -25,-5 -32,2 C-25,10 -12,12 0,8 Z" strokeWidth={0.9} />
        <path d="M-2,3 L-30,4" strokeWidth={0.4} opacity={0.5} />
      </g>
      <g transform="translate(170 248)">
        <path d="M0,0 C12,-2 25,-5 32,2 C25,10 12,12 0,8 Z" strokeWidth={0.9} />
        <path d="M2,3 L30,4" strokeWidth={0.4} opacity={0.5} />
      </g>

      <circle cx={200} cy={258} r={0.5} fill="currentColor" stroke="none" />
      <circle cx={130} cy={262} r={0.5} fill="currentColor" stroke="none" />
      <circle cx={140} cy={265} r={0.4} fill="currentColor" stroke="none" />
      <circle cx={195} cy={265} r={0.4} fill="currentColor" stroke="none" />
      <circle cx={220} cy={260} r={0.4} fill="currentColor" stroke="none" />
    </svg>
  )
}
