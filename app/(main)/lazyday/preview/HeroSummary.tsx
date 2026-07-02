"use client"

import { PREVIEW, daysUntilDeadline } from "./preview-config"
import styles from "./preview.module.css"

/**
 * 히어로 포스터 바로 아래에 붙는 핵심 요약 스트립.
 * 무드를 해치지 않도록 가격은 여기서 생략하고(의도 존중),
 * 무엇을·언제·어디서 + 마감 D-day만 전달한다.
 * 가격은 일정·참가 안내 섹션과 신청 페이지에서 노출.
 */
export function HeroSummary() {
  const d = daysUntilDeadline()
  const closed = d < 0
  return (
    <div className={styles.heroSummary}>
      <span className={`${styles.ddayBadge} ${closed ? styles.ddayBadgeClosed : ""}`}>
        {closed ? `${PREVIEW.season} 모집 마감 · ${PREVIEW.nextSeason} 준비 중` : d === 0 ? "오늘 마감" : `${PREVIEW.season} 모집 마감 D-${d}`}
      </span>
      <p className={styles.heroSummaryLine}>
        <strong>철학과 고전</strong>을 함께 읽는 다섯 번의 만남
        <br />
        정규 독서모임 4회 + 자유모임 1회
      </p>
      <div className={styles.heroSummaryMeta}>
        <span>🗓 {PREVIEW.periodLabel} · 격주</span>
        <span>📍 사당역 링키라운지</span>
        <span>👥 요일별 소수 정원</span>
      </div>
    </div>
  )
}
