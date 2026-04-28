type Props = {
  className?: string
  title?: string
}

/**
 * 초대 / 열린 문 — 강한 수직 사각형(문) + 손잡이 점 + 옆에 끼어드는
 * 세이지 반원(들어오라는 빛) + 바닥의 검은 선(문턱).
 */
export function ClosingMark({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={!title}
    >
      {title && <title>{title}</title>}
      <rect x="48" y="32" width="78" height="138" fill="#d2691e" />
      <circle cx="116" cy="105" r="5" fill="#f0ebe5" />
      <path d="M 138 92 A 30 30 0 0 1 138 152 Z" fill="#5a8268" />
      <line x1="22" y1="178" x2="178" y2="178" stroke="#f0ebe5" strokeWidth="3" />
    </svg>
  )
}
