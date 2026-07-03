"use client"

import { useEffect, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "../page.module.css"
import { PREVIEW, daysUntilDeadline } from "./preview-config"

/** 개선안: 스티키 CTA에 마감 D-day 자동 표기 (마감일은 preview-config에서 계산) */
export function StickyApplyButtonV2() {
  // 마운트 후 계산 — 정적 프리렌더 박제/hydration mismatch 방지
  const [d, setD] = useState<number | null>(null)
  useEffect(() => {
    setD(daysUntilDeadline())
    const t = setInterval(() => setD(daysUntilDeadline()), 60_000)
    return () => clearInterval(t)
  }, [])

  const label =
    d === null
      ? `${PREVIEW.season} 신청하기`
      : d < 0
      ? `${PREVIEW.season} 모집 마감`
      : d === 0
      ? `${PREVIEW.season} 신청하기 (오늘 마감)`
      : `${PREVIEW.season} 신청하기 (D-${d})`

  return (
    <div className={styles.fixedButtonContainer}>
      <LazydayLink href={d !== null && d < 0 ? "/preview" : "/preview/apply"} className={styles.applyButton}>
        {label}
      </LazydayLink>
    </div>
  )
}
