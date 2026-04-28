type Props = {
  className?: string
  title?: string
}

/**
 * 양귀비 봉오리 — 살짝 드룹 (피기 직전, 망설이는 자세)
 * 사용처: How 타임라인 01 (시작), section divider
 */
export function Bud({ className, title }: Props) {
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
      <path d="M52,8 C50,18 47,28 43,38" />
      <path d="M43,38 C28,40 24,55 28,68 C33,80 53,82 58,70 C63,55 58,40 43,38 Z" />
      <path d="M40,40 C35,33 38,28 42,28" strokeWidth={0.7} />
      <path d="M48,40 C54,33 50,28 47,28" strokeWidth={0.7} />
      <path d="M28,52 L24,50" strokeWidth={0.5} />
      <path d="M27,62 L23,63" strokeWidth={0.5} />
      <path d="M62,52 L66,50" strokeWidth={0.5} />
      <path d="M62,62 L66,63" strokeWidth={0.5} />
      <path d="M44,82 L44,86" strokeWidth={0.5} />
    </svg>
  )
}
