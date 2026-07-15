"use client"

import { useEffect, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "../page.module.css"
import { PREVIEW, daysUntilDeadline } from "./preview-config"
import { SEASON } from "../season-config"

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
      ? `${PREVIEW.season} 신청`
      : d < 0
      ? `${PREVIEW.season} 모집 마감`
      : d === 0
      ? `${PREVIEW.season} 신청 (오늘 마감)`
      : `${PREVIEW.season} 신청 (마감일까지 D-${d})`

  // 조기마감 모드 — 실 StickyApplyButton/ApplyButton과 동일 값 (쌍 동기화)
  if (SEASON.status === "closedEarly") {
    return (
      <div className={styles.fixedButtonContainer}>
        <button
          type="button"
          className={`${styles.applyButton} ${styles.applyButtonTwoLine}`}
          onClick={() => window.dispatchEvent(new CustomEvent("lazyday:notify-cta"))}
        >
          {SEASON.next} 오픈 알림 신청
          <span className={styles.applyBtnSub}>
            {SEASON.name} 모집 조기 마감 | {SEASON.next}는 {SEASON.nextStartLabel}에 시작됩니다.
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className={styles.fixedButtonContainer}>
      <LazydayLink href={d !== null && d < 0 ? "/preview" : "/preview/apply"} className={styles.applyButton}>
        {label}
      </LazydayLink>
    </div>
  )
}
