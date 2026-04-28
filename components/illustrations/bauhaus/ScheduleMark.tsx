type Props = {
  className?: string
  title?: string
}

/**
 * 약속된 한 날 — 작은 사각형 4개가 일렬로 늘어선 가운데 한 자리만 큰 원
 * (우리가 약속한 그 한 날). 우상단의 작은 머스터드 점은 의외의 행운.
 */
export function ScheduleMark({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={!title}
    >
      {title && <title>{title}</title>}
      <rect x="28" y="92" width="22" height="22" fill="#2b3a55" />
      <rect x="56" y="92" width="22" height="22" fill="#2b3a55" />
      <circle cx="115" cy="103" r="32" fill="#d2691e" />
      <rect x="155" y="92" width="22" height="22" fill="#2b3a55" />
      <circle cx="172" cy="48" r="6" fill="#d4a64a" />
    </svg>
  )
}
