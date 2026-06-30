import type { CSSProperties } from "react"
import styles from "./LazydayLoader.module.css"

type Props = {
  /** 점 지름(px) */
  size?: number
  /** 점 사이 간격(px). 미지정 시 size 기준 자동 */
  gap?: number
  /** 한 사이클 길이 */
  speed?: string
  /** 점 색상 배열 (브랜드 세이지·오렌지·브라운) */
  colors?: string[]
  className?: string
}

/**
 * @deprecated 구버전 웨이브 로더(위아래). 흐르는 점 로더 DotsLoader로 대체됨(SubmitOverlay).
 *   필요 시 참고용으로 남겨둔 올드 코드 — 신규 사용은 DotsLoader 권장.
 *
 * Lazyday Wave Loader — 업로드된 vanilla 웹 컴포넌트를 React로 이식.
 * 3색 점이 파도치듯 위아래로 움직인다. prefers-reduced-motion 시 느리게.
 */
export function LazydayLoader({
  size = 24,
  gap,
  speed = "1.4s",
  colors = ["#95AC9A", "#F59936", "#7D5456"],
  className,
}: Props) {
  const g = gap != null ? gap : Math.round(size * 0.58)
  const down = (size * 0.38).toFixed(1)
  const up = (size * 0.62).toFixed(1)

  const rowStyle = {
    gap: `${g}px`,
    "--ld-size": `${size}px`,
    "--ld-speed": speed,
    "--ld-down": `${down}px`,
    "--ld-up": `${up}px`,
  } as CSSProperties

  return (
    <div
      className={`${styles.row}${className ? ` ${className}` : ""}`}
      style={rowStyle}
      role="status"
      aria-label="로딩 중"
    >
      {colors.map((c, i) => (
        <span
          key={i}
          className={styles.dot}
          style={{ background: c, animationDelay: `${(i * 0.16).toFixed(2)}s` }}
        />
      ))}
    </div>
  )
}
