import styles from "./JourneyStepper.module.css"

/**
 * 신청 여정 스텝퍼 — 신청 이후 어떤 일이 일어나는지 미리 보여준다.
 * current: 현재 단계 (1-based)
 * interview: 인터뷰 방식이 정해진 페이지에서는 해당 방식만 표기
 *   (서면 인터뷰 페이지 → "서면", 전화 인터뷰 페이지 → "전화", 미지정 → "서면/전화")
 */
export function JourneyStepper({
  current,
  interview,
  caption,
}: {
  current: number
  interview?: "서면" | "전화"
  caption?: string
}) {
  const steps: { n: number; lines: [string, string] }[] = [
    { n: 1, lines: ["북클럽", "신청"] },
    { n: 2, lines: [interview ?? "서면/전화", "인터뷰"] },
    { n: 3, lines: ["결과", "안내"] },
    { n: 4, lines: ["결제 및", "참가 확정"] },
  ]

  return (
    <div style={{ width: "100%" }}>
      <div className={styles.stepper} aria-label="신청 진행 단계">
        {steps.map((s) => (
          <div
            key={s.n}
            className={`${styles.stepItem} ${s.n === current ? styles.stepActive : ""} ${s.n < current ? styles.stepDone : ""}`}
            aria-current={s.n === current ? "step" : undefined}
          >
            <span className={styles.stepDotNum}>{s.n < current ? "✓" : s.n}</span>
            <span className={styles.stepLabel}>
              {s.lines[0]}
              <br />
              {s.lines[1]}
            </span>
          </div>
        ))}
      </div>
      {caption && <p className={styles.stepCaption}>{caption}</p>}
    </div>
  )
}
