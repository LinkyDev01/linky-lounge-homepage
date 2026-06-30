import { DotsLoader } from "./DotsLoader"
import styles from "./SubmitOverlay.module.css"

/**
 * 제출 후 응답 대기 중 표시하는 전체 화면 로딩 오버레이.
 * (GAS 접수가 수 초 걸려 명확한 피드백 + 중복 제출 방지)
 */
export function SubmitOverlay({ label = "제출 중..." }: { label?: string }) {
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <DotsLoader size={20} />
      <p className={styles.label}>{label}</p>
    </div>
  )
}
