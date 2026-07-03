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
