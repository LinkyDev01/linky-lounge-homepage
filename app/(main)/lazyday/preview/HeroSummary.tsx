"use client"

import { useEffect, useState } from "react"
import { PREVIEW, daysUntilDeadline } from "./preview-config"
import { SEASON } from "../season-config"
import styles from "./preview.module.css"

/**
 * 히어로 포스터 바로 아래의 핵심 요약 (10b 시안, 운영자 확정 2026-07-07).
 * 키커(D-day) + 핵심 문장(명조 20px — 세리프 확장 승인) + 종이 낱장 SummaryCard.
 * 기존 서브·메타 한 줄은 카드가 흡수. 참가비 행 없음(이번 기수 미표기).
 * 데이터는 season-config 단일 출처. D-day는 마운트 후 계산(빌드 박제 방지).
 */

// 요일을 시간대별로 묶어 "수·목 19:30–22:30 / 일 14:30–17:30" 형태로
function dayScheduleLine() {
  const groups: { labels: string[]; time: string }[] = []
  for (const d of SEASON.days) {
    const last = groups[groups.length - 1]
    if (last && last.time === d.time) last.labels.push(d.label)
    else groups.push({ labels: [d.label], time: d.time })
  }
  return groups
    .map((g) => `${g.labels.map((l) => l.replace("요일", "")).join("·")} ${g.time}`)
    .join(" / ")
}

export function HeroSummary() {
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

      <div className={styles.summaryCard}>
        <span className={styles.summaryTape} aria-hidden />
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>기간</span>
          <span className={styles.summaryValue}>
            {SEASON.periodLabel} 격주 · 정규 4회 + 자유 1회
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>일정</span>
          <span className={styles.summaryValue}>
            {dayScheduleLine()}
            <span className={styles.summarySubNote}>회차별 참여 요일 자율 선택</span>
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>장소</span>
          <span className={styles.summaryValue}>
            {SEASON.location.name} · {SEASON.location.sub}
          </span>
        </div>
      </div>

      <p className={styles.summaryFoot}>요일별 소수 정원 · 인터뷰 후 참여가 확정됩니다</p>
    </div>
  )
}
