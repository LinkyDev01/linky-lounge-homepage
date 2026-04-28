type Props = {
  className?: string
  title?: string
}

/**
 * 떠오르는 물음 — 큰 머스터드 말풍선 + 안에 짙은 푸른 점(질문의 핵)
 * + 멀리 떨어진 테라코타 점(또 다른 질문). 비대칭 꼬리.
 */
export function FaqMark({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={!title}
    >
      {title && <title>{title}</title>}
      <circle cx="82" cy="92" r="54" fill="#d4a64a" />
      <polygon points="60,135 82,172 96,138" fill="#d4a64a" />
      <circle cx="100" cy="78" r="10" fill="#2b3a55" />
      <circle cx="160" cy="48" r="6" fill="#d2691e" />
    </svg>
  )
}
