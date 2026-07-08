"use client"

import { useEffect, useState } from "react"
import { SEASON, daysUntilDeadline } from "./season-config"
import styles from "./HeroSummary.module.css"

/**
 * 히어로 포스터 바로 아래의 핵심 요약 (10b 정본 이식, 운영자 확정 2026-07-08).
 * 키커(D-day) + 제목 '오프라인 독서모임'(명조 18px — 세리프 확장 승인) + 종이 낱장 SummaryCard.
 * 제목이 기존 태그라인·서브·메타를 대체. 참가비 행 없음(이번 기수 미표기).
 * 데이터는 season-config 단일 출처. D-day는 마운트 후 계산(빌드 박제 방지).
 * ⚠ 프리뷰 쌍: preview/HeroSummary.tsx — 한쪽 수정 시 동기화 (TSX 쌍 동기화).
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

// "링키라운지 (사당역 도보 3분)" → "링키라운지 · 사당역 도보 3분"
// (낱장 카드용 압축 표기 — season-config location.short 단일 출처)
const locationLine = SEASON.location.short.replace(" (", " · ").replace(")", "")

export function HeroSummary() {
  const [d, setD] = useState<number | null>(null)
  useEffect(() => {
    setD(daysUntilDeadline())
    const t = setInterval(() => setD(daysUntilDeadline()), 60_000)
    return () => clearInterval(t)
  }, [])

  const kicker =
    d === null
      ? `${SEASON.name} 모집 중`
      : d < 0
      ? `${SEASON.name} 모집이 마감되었어요`
      : d === 0
      ? `${SEASON.name} 모집 오늘 마감`
      : `${SEASON.name} 모집 마감 D-${d}`

  return (
    <div className={styles.heroSummary}>
      <p className={styles.heroKicker}>
        <span className={styles.kickerRule} aria-hidden />
        <span className={styles.kickerText}>{kicker}</span>
        <span className={styles.kickerRule} aria-hidden />
      </p>
      <p className={styles.summaryTitle}>오프라인 독서모임</p>

      <div className={styles.summaryCard}>
        <span className={styles.summaryTape} aria-hidden />
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>기간</span>
          <span className={styles.summaryValue}>
            {SEASON.periodLabel} (격주, 5회)
            <span className={styles.summarySubNote}>
              *정규 독서모임 4회 + 자유 독서모임 1회
            </span>
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>일정</span>
          <span className={styles.summaryValue}>
            {dayScheduleLine()}
            <span className={styles.summarySubNote}>
              *회차별 참여 요일 선택, 요일별 소수 정원
            </span>
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>장소</span>
          <span className={styles.summaryValue}>{locationLine}</span>
        </div>
      </div>

      <p className={styles.summaryFoot}>인터뷰 및 결제 후 참여가 확정됩니다</p>
    </div>
  )
}
