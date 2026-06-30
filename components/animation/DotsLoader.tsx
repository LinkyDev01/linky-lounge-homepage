import type { CSSProperties } from "react"

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
 * Flowing Dots Loader — 업로드된 vanilla 커스텀 엘리먼트(dots-loader.js)를 React로 이식.
 * 점들이 오른쪽으로 부드럽게 한 칸씩 흐르고(컨베이어), 오른쪽 끝에서 작아져 사라지며
 * 왼쪽에서 새로 자라난다. sine-warp 클럭으로 멈춤 없이 빨라졌다 느려지는 리듬.
 * prefers-reduced-motion 시 느리게.
 *
 * 키프레임이 size/gap/색상수에 따라 동적으로 계산되어 스코프드 <style>로 주입된다.
 * 서버/클라이언트 동일 출력(결정적) → 하이드레이션 안전.
 */
export function DotsLoader({
  size = 16,
  gap,
  speed = "1.8s",
  colors = ["#95AC9A", "#F59936", "#7D5456"],
  className,
}: Props) {
  const g = gap != null ? gap : Math.round(size * 0.6)
  const n = colors.length
  const unit = parseFloat(speed) || 1.8
  const S = size + g
  const slot = (k: number) => (k - (n - 1) / 2) * S
  const tIn = 1 / n
  const tOut = 1 / n
  const edge = 0.5 // 양 끝 슬롯보다 ½S 더 바깥에서 태어나고 죽음
  const birth = slot(0) - edge * S
  const death = slot(n - 1) + edge * S
  const span = death - birth
  const width = (2 * Math.abs(birth) + size).toFixed(1)
  const A = 0.26 // 속도 펄스 깊이 (속도는 항상 > 0 → 멈추지 않음)
  const K = n // 사이클당 펄스 수

  // birth→death 연속 글라이드 + sine 워프 클럭(빨라졌다 느려짐, 멈춤 없음) + 긴 페이드 인/아웃
  const samples = 48
  const stops: string[] = []
  for (let s = 0; s <= samples; s++) {
    const p = s / samples
    const gw = p - (A / (2 * Math.PI)) * Math.sin(2 * Math.PI * K * p)
    const x = (birth + span * gw).toFixed(2)
    let sc = 1
    if (p < tIn) sc = p / tIn
    else if (p > 1 - tOut) sc = (1 - p) / tOut
    const scl = Math.max(0, Math.min(1, sc)).toFixed(3)
    stops.push(`${(p * 100).toFixed(2)}% { transform: translateX(${x}px) scale(${scl}); }`)
  }
  const keyframes = stops.join(" ")

  // 파라미터별 고유 id → @keyframes 전역 충돌 방지(동일 파라미터는 공유)
  const id = `dl_${size}_${g}_${n}_${String(speed).replace(/[^a-z0-9]/gi, "")}`
  const slow = (unit * 2.5).toFixed(0)

  const wrapStyle: CSSProperties = {
    position: "relative",
    display: "inline-block",
    lineHeight: 0,
    width: `${width}px`,
    height: `${size}px`,
    overflow: "visible",
  }

  return (
    <div className={`${id}${className ? ` ${className}` : ""}`} style={wrapStyle} role="status" aria-label="로딩 중">
      <style>{
        `.${id} > span{position:absolute;top:50%;left:50%;width:${size}px;height:${size}px;` +
        `margin:${-size / 2}px 0 0 ${-size / 2}px;border-radius:50%;display:block;` +
        `animation:${id}_kf ${speed} linear infinite;transform-origin:center;will-change:transform;}` +
        `@keyframes ${id}_kf{${keyframes}}` +
        `@media (prefers-reduced-motion:reduce){.${id} > span{animation-duration:${slow}s;}}`
      }</style>
      {colors.map((c, i) => (
        <span key={i} style={{ background: c, animationDelay: `${(-(i) * unit / n).toFixed(3)}s` }} />
      ))}
    </div>
  )
}
