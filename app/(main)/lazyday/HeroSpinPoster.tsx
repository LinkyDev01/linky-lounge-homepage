"use client"

import styles from "./HeroSpinPoster.module.css"

/**
 * 히어로 — 5기 포스터 두 장이 같은 원점에서 서로 반대로 도는 모션
 * (운영자 2026-09-09 "북클럽 랜딩페이지를 4기 모집 애니메이션과 대체하여 배포해").
 *
 * **원본은 프리뷰 `preview/poster-5th`** — 속도·크기·겹침·잘림 계산 전부 그대로 이식했다
 * (철칙 1: 이식본은 픽셀 동일, 이식하며 "개선" 금지). 근거는 CSS 머리말에.
 *
 * ⚠ 4기 히어로(`HeroBreathingPoster` — 한붓 그리기 모션)는 **삭제하지 않는다**.
 *   렌더만 빠진 고아로 보존하고, `preview/hero-check` 가 그대로 검수대 겸 백업 창구다
 *   (운영자 "4기 애니메이션은 따로 백업해두고").
 *
 * ⚠ 겹이 셋인 이유: 크기(등감소)·인트로 회전(누적)·정속 회전을 각각 다른 요소에 걸어
 *   중첩 transform 으로 곱한다. 한 요소에 여러 애니메이션이 같은 transform 을 쓰면
 *   마지막 것만 남는다.
 */
export function HeroSpinPoster() {
  return (
    <div className={styles.band}>
      <div className={styles.stage}>
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
    </div>
  )
}
