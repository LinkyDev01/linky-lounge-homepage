type Props = {
  className?: string
  title?: string
}

/**
 * 읽힌 페이지의 표시 — 비스듬히 기울어진 머스터드 페이지(읽히는 책),
 * 그 위의 짙은 푸른 점(걸린 한 문장), 페이지 아래 테라코타 밑줄.
 */
export function BookMark({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={!title}
    >
      {title && <title>{title}</title>}
      <g transform="rotate(-4 90 115)">
        <rect x="38" y="50" width="100" height="125" fill="#d4a64a" />
      </g>
      <circle cx="135" cy="80" r="20" fill="#2b3a55" />
      <line x1="20" y1="172" x2="170" y2="172" stroke="#d2691e" strokeWidth="3.5" />
    </svg>
  )
}
