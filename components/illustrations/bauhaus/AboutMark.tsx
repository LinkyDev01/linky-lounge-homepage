type Props = {
  className?: string
  title?: string
}

/**
 * 모임 정체성 — 큰 원(우리), 옆구리에 끼어드는 반원(다른 결),
 * 멀찌감치 있는 노란 삼각형(의외의 시점), 바닥의 가로선(시간의 흐름).
 */
export function AboutMark({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={!title}
    >
      {title && <title>{title}</title>}
      <circle cx="68" cy="72" r="52" fill="#d2691e" />
      <path d="M 122 85 A 26 26 0 0 1 122 137 Z" fill="#2b3a55" />
      <polygon points="22,184 22,134 70,184" fill="#d4a64a" />
      <line x1="85" y1="180" x2="190" y2="180" stroke="#5a8268" strokeWidth="3.5" />
    </svg>
  )
}
