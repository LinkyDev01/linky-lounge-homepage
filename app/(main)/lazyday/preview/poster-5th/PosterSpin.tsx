"use client"

import styles from "./PosterSpin.module.css"

/**
 * 5기 포스터 두 장이 같은 원점에서 서로 반대로 도는 프리뷰 (운영자 2026-09-08
 * "두 포스터가 엇갈리게 맞물리는 거야 … 각각 시계,반시계로").
 * 원본은 4050×4050 PNG 두 장 — 전송량 때문에 1800px WebP 로 축소해 커밋했다(§5).
 *
 * 겹침 순서는 **작은 쪽(반시계)이 앞** — 시계 레이어를 먼저 깔고 반시계를 위에.
 * 속도는 A안 3구간 프로파일(운영자 "a로 갈게") — 값과 근거는 CSS 머리말에.
 *
 * ⚠ 요소가 **두 겹**인 이유: 인트로는 40초 동안 1578°(4.38바퀴)를 도는데 그
 *   자리에서 되감으면 138° 가 튄다. 바깥(.spin)이 인트로를 forwards 로 끝 각도에
 *   세워 두고, 안쪽(.steady)이 40초 뒤부터 6초 1바퀴 정속을 돌린다 — 정속은
 *   360° 단위라 이음매가 없다. 중첩 transform 이라 두 회전이 곱해진다.
 */
export function PosterSpin() {
  return (
    <div className={styles.page}>
      <div className={styles.stage} id="poster-stage">
        <div className={`${styles.spin} ${styles.spinCw}`}>
          <div className={`${styles.steady} ${styles.steadyCw}`}>
            <img src="/assets/lazyday/season05/poster-spin-cw.webp" alt="레이지데이 북클럽 5기 포스터 (시계방향)" className={styles.layer} />
          </div>
        </div>
        <div className={`${styles.spin} ${styles.spinCcw}`}>
          <div className={`${styles.steady} ${styles.steadyCcw}`}>
            <img src="/assets/lazyday/season05/poster-spin-ccw.webp" alt="레이지데이 북클럽 5기 포스터 (반시계방향)" className={styles.layer} />
          </div>
        </div>
      </div>
      <p className={styles.caption}>
        읽기 6초(1바퀴 30초) → 24초까지 가속 → 상한 1바퀴 6초 · 배경 #eeeeee
      </p>
    </div>
  )
}
