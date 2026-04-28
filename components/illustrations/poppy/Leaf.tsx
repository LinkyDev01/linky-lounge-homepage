type Props = {
  className?: string
  title?: string
}

/**
 * 양귀비 잎 — 깊게 파인 lobed silhouette
 * 사용처: section divider, Specimen·Cluster·Solo의 보조 요소
 */
export function Leaf({ className, title }: Props) {
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
      <g transform="translate(50 50) rotate(20)">
        <path d="M0,-32 C-5,-26 -12,-24 -16,-18 C-8,-12 -14,-6 -20,0 C-12,5 -18,12 -22,20 C-15,24 -8,28 0,30 C8,28 15,24 22,20 C18,12 12,5 20,0 C14,-6 8,-12 16,-18 C12,-24 5,-26 0,-32 Z" />
        <path d="M0,-30 L0,28" strokeWidth={0.5} opacity={0.6} />
        <path d="M0,-15 L-12,-12" strokeWidth={0.4} opacity={0.4} />
        <path d="M0,-15 L12,-12" strokeWidth={0.4} opacity={0.4} />
        <path d="M0,5 L-15,8" strokeWidth={0.4} opacity={0.4} />
        <path d="M0,5 L15,8" strokeWidth={0.4} opacity={0.4} />
      </g>
    </svg>
  )
}
