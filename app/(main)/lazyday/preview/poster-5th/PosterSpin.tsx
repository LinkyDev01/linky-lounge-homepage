"use client"

import styles from "./PosterSpin.module.css"

/**
 * 5기 포스터 두 장이 같은 원점에서 서로 반대로 도는 프리뷰 (운영자 2026-09-08
 * "두 포스터가 엇갈리게 맞물리는 거야. 20초로 한 바퀴로 각각 시계,반시계로").
 * 원본은 4050×4050 PNG 두 장 — 전송량 때문에 1800px WebP 로 축소해 커밋했다(§5).
 * 영상 추출 스크립트가 `#poster-stage` 를 잡아 캡처한다.
 */
export function PosterSpin() {
  return (
    <div className={styles.page}>
      <div className={styles.stage} id="poster-stage">
        <img src="/assets/lazyday/season05/poster-spin-cw.webp" alt="레이지데이 북클럽 5기 포스터 (시계방향)" className={`${styles.layer} ${styles.cw}`} />
        <img src="/assets/lazyday/season05/poster-spin-ccw.webp" alt="레이지데이 북클럽 5기 포스터 (반시계방향)" className={`${styles.layer} ${styles.ccw}`} />
      </div>
      <p className={styles.caption}>
        20초 1회전 · 시계 ↔ 반시계 · 배경 #eeeeee
      </p>
    </div>
  )
}
