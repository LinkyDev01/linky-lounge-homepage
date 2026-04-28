type Props = {
  className?: string
  title?: string
}

/**
 * 시간이 흐르는 자세 — 위에 큰 원(시작), 가는 선이 흐르고,
 * 끝에 세이지 알약과 다시 작은 테라코타 점(돌아오는 한 문장).
 */
export function HowToMark({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={!title}
    >
      {title && <title>{title}</title>}
      <circle cx="100" cy="48" r="34" fill="#d2691e" />
      <line x1="100" y1="50" x2="100" y2="160" stroke="#1a1208" strokeWidth="2.5" />
      <rect x="78" y="125" width="44" height="68" rx="22" fill="#5a8268" />
      <circle cx="100" cy="160" r="6" fill="#d2691e" />
    </svg>
  )
}
