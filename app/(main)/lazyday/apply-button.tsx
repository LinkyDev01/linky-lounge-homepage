"use client"

import { useEffect, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { SEASON, daysUntilDeadline } from "./season-config"
import styles from "./page.module.css"

/** 하단 고정 CTA — [3기 신청 (마감일까지 D-XX)] 형식 (마감일은 season-config) */
export function ApplyButton() {
  // 마운트 후 계산 — 정적 프리렌더에 빌드 시점 D-day가 박제되는 것 방지
  const [d, setD] = useState<number | null>(null)
  useEffect(() => {
    setD(daysUntilDeadline())
    const t = setInterval(() => setD(daysUntilDeadline()), 60_000)
    return () => clearInterval(t)
  }, [])

  // 조기마감 모드: 살아있는 주황 버튼 그대로, 액션만 4기 알림으로 전환 (운영자 확정 2026-07-13)
  // 클릭은 커스텀 이벤트 — NextSeasonNotify가 받아 '폼 유효하면 제출 / 아니면 #notify 스크롤' 판단
  if (SEASON.status === "closedEarly") {
    return (
      <button
        type="button"
        className={styles.applyButton}
        onClick={() => window.dispatchEvent(new CustomEvent("lazyday:notify-cta"))}
      >
        {SEASON.next} 오픈 알림 신청
      </button>
    )
  }

  const label =
    d === null
      ? `${SEASON.name} 신청`
      : d < 0
      ? `${SEASON.name} 모집 마감`
      : d === 0
      ? `${SEASON.name} 신청 (오늘 마감)`
      : `${SEASON.name} 신청 (마감일까지 D-${d})`

  return (
    <LazydayLink href={d !== null && d < 0 ? "/" : "/apply"} className={styles.applyButton}>
      {label}
    </LazydayLink>
  )
}
