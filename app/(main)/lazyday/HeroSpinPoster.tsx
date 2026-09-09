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
  // data-lz-poster: 진입 홀드 덮개(LandingShell .introMask, z 200) **위**로 올린다 — 4기 포스터와 같은
  // 규약(landing-shell.module.css `[data-lz-poster]{z-index:201}`). 이게 없으면 덮개가 걷히는 ~2초 동안
  // 스프링 성장(0–2.7s)이 덮개 뒤에서 다 끝나 손님은 안착된 포스터만 본다 (2026-09-09 프로덕션 실측:
  // 3초까지 잉크 0px — 운영자 "배포 안 된 것 같네"의 원인).
  return (
    <div className={styles.band} data-lz-poster="">
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
