"use client"

import styles from "./PosterSpin.module.css"

/**
 * 5기 포스터 두 장이 같은 원점에서 서로 반대로 도는 프리뷰 (운영자 2026-09-08
 * "두 포스터가 엇갈리게 맞물리는 거야 … 각각 시계,반시계로").
 * 원본은 4050×4050 PNG 두 장 — 전송량 때문에 1800px WebP 로 축소해 커밋했다(§5).
 *
 * 겹침 순서는 **작은 쪽(반시계)이 앞** — 시계 레이어를 먼저 깔고 반시계를 위에.
 * 속도·크기 프로파일과 잘림 0(최소 여백 2.5%) 계산은 CSS 머리말에.
 *
 * ⚠ 겹이 셋인 이유: 크기(등감소) · 인트로 회전(누적) · 정속 회전을 각각 다른
 *   요소에 걸어 **중첩 transform 으로 곱한다**. 한 요소에 여러 애니메이션이
 *   같은 transform 을 쓰면 마지막 것만 남는다.
 */
export function PosterSpin() {
  return (
    <div className={styles.page}>
      <div className={styles.stage} id="poster-stage">
        <div className={`${styles.shrink} ${styles.shrinkBox}`}>
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
      </div>
      <p className={styles.caption}>
        읽기 6초 · 35초까지 가속(1바퀴 4.3초) · 마지막 5초 등속 · 24–35초 크기 등감소 1.00→0.60
      </p>
    </div>
  )
}
