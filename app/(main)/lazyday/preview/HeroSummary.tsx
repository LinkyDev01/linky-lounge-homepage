"use client"

import { useEffect, useState } from "react"
import { PREVIEW, daysUntilDeadline } from "./preview-config"
import styles from "./preview.module.css"

/**
 * 히어로 포스터 바로 아래의 핵심 요약.
 * 배지·이모지 없는 절제된 타이포 구성 — 가는 괘선 + 자간 넓은 캡션.
 * D-day는 preview-config의 마감일(7/16)에서 자동 계산.
 * 가격은 여기 없음 — 상세 조건은 기존처럼 인터뷰 페이지에서 노출.
 */
export function HeroSummary() {
  // 마운트 후 계산 — 정적 프리렌더에 빌드 시점 D-day가 박제되는 것 방지
  const [d, setD] = useState<number | null>(null)
  useEffect(() => {
    setD(daysUntilDeadline())
    const t = setInterval(() => setD(daysUntilDeadline()), 60_000)
    return () => clearInterval(t)
  }, [])

  const kicker =
    d === null
      ? `${PREVIEW.season} 모집 중`
      : d < 0
      ? `${PREVIEW.season} 모집이 마감되었어요`
      : d === 0
      ? `${PREVIEW.season} 모집 오늘 마감`
      : `${PREVIEW.season} 모집 마감 D-${d}`

  return (
    <div className={styles.heroSummary}>
      <p className={styles.heroKicker}>
        <span className={styles.kickerRule} aria-hidden />
        <span className={styles.kickerText}>{kicker}</span>
        <span className={styles.kickerRule} aria-hidden />
      </p>
      <p className={styles.heroSummaryLine}>
        철학과 고전 소설을 함께 읽는
        <br />
        다섯 번의 만남
      </p>
      <p className={styles.heroSummarySub}>정규 독서모임 4회 · 자유모임 1회</p>
      <p className={styles.heroSummaryMeta}>
        {PREVIEW.periodLabel} 격주 · 사당역 링키라운지 · 요일별 소수 정원
      </p>
    </div>
  )
}
