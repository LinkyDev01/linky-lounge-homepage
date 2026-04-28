type Props = {
  className?: string
  title?: string
}

/**
 * 양귀비 씨앗 꼬투리 — stigma 왕관과 흩어진 씨앗
 * 양귀비의 가장 시그니처한 silhouette
 * 사용처: How 타임라인 03 (마무리), Apply CTA 위치 마커, section divider
 */
export function SeedPod({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 80 100"
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
      <path d="M40,90 C40,82 41,76 40,72" />
      <path d="M40,72 C26,72 22,68 23,55 C24,42 28,35 40,35 C52,35 56,42 57,55 C58,68 54,72 40,72 Z" />
      <path d="M30,35 L50,35" strokeWidth={1.1} />
      <path d="M28,33 C28,30 32,28 40,28 C48,28 52,30 52,33" />
      <path d="M30,29 L26,22" strokeWidth={0.6} />
      <path d="M34,27 L32,18" strokeWidth={0.6} />
      <path d="M40,27 L40,16" strokeWidth={0.7} />
      <path d="M46,27 L48,18" strokeWidth={0.6} />
      <path d="M50,29 L54,22" strokeWidth={0.6} />
      <path d="M27,50 C28,60 30,67 33,70" strokeWidth={0.4} opacity={0.5} />
      <path d="M53,50 C52,60 50,67 47,70" strokeWidth={0.4} opacity={0.5} />
      <circle cx={18} cy={92} r={0.7} fill="currentColor" stroke="none" />
      <circle cx={64} cy={94} r={0.7} fill="currentColor" stroke="none" />
      <circle cx={28} cy={96} r={0.5} fill="currentColor" stroke="none" />
      <circle cx={56} cy={97} r={0.5} fill="currentColor" stroke="none" />
    </svg>
  )
}
