import styles from "./preview.module.css"

const STEPS = [
  { n: 1, label: "신청서 작성" },
  { n: 2, label: "인터뷰" },
  { n: 3, label: "합류 확정" },
  { n: 4, label: "참가비 결제" },
]

/**
 * 신청 여정 스텝퍼 — 신청 이후 어떤 일이 일어나는지 미리 보여준다.
 * current: 현재 단계 (1-based)
 */
export function JourneyStepper({ current, caption }: { current: number; caption?: string }) {
  return (
    <div>
      <div className={styles.stepper} aria-label="신청 진행 단계">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className={`${styles.stepItem} ${s.n === current ? styles.stepActive : ""} ${s.n < current ? styles.stepDone : ""}`}
            aria-current={s.n === current ? "step" : undefined}
          >
            <span className={styles.stepDotNum}>{s.n < current ? "✓" : s.n}</span>
            <span className={styles.stepLabel}>{s.label}</span>
          </div>
        ))}
      </div>
      {caption && <p className={styles.stepCaption}>{caption}</p>}
    </div>
  )
}
