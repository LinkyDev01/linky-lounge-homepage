type Props = {
  className?: string
  title?: string
}

/**
 * 대화·결이 다른 만남 — 큰 테라코타 원과 작은 세이지 알약,
 * 둘이 같지 않다. 가는 검은 선이 두 다른 형태를 잇는 대화.
 */
export function VibeMark({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={!title}
    >
      {title && <title>{title}</title>}
      <circle cx="62" cy="62" r="44" fill="#d2691e" />
      <rect x="115" y="118" width="58" height="58" rx="29" fill="#5a8268" />
      <line x1="80" y1="98" x2="120" y2="125" stroke="#1a1208" strokeWidth="2.5" />
    </svg>
  )
}
