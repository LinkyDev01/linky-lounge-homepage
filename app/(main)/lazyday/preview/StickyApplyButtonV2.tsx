"use client"

import { useEffect, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "../page.module.css"
import { PREVIEW, daysUntilDeadline } from "./preview-config"
import { SEASON, NOTIFY_SEASON, NOTIFY_SCHEDULE } from "../season-config"

/** 개선안: 스티키 CTA에 마감 D-day 자동 표기 (마감일은 preview-config에서 계산) */
export function StickyApplyButtonV2() {
  // 마운트 후 계산 — 정적 프리렌더 박제/hydration mismatch 방지
  const [d, setD] = useState<number | null>(null)
  useEffect(() => {
    setD(daysUntilDeadline())
    const t = setInterval(() => setD(daysUntilDeadline()), 60_000)
    return () => clearInterval(t)
  }, [])

  // showDeadline=false: D-day 표기는 숨기고 '신청'만 — 마감일이 지나면 '모집 마감' (자동 종료)
  const label =
    d !== null && d < 0
      ? `${PREVIEW.season} 모집 마감`
      : !SEASON.showDeadline || d === null
      ? `${PREVIEW.season} 신청하기`
      : d === 0
      ? `${PREVIEW.season} 신청 (오늘 마감)`
      : `${PREVIEW.season} 신청 (마감일까지 D-${d})`

  // 알림 모드 — 실 ApplyButton 과 동일 값 (쌍 동기화)
  // 오픈 전(upcoming): 살아있는 주황 버튼, 액션만 알림 폼으로. 클릭은 커스텀 이벤트 —
  // NextSeasonNotify 가 받아 '폼 유효하면 제출 / 아니면 #notify 스크롤'.
  if (SEASON.status === "upcoming") {
    return (
      <div className={styles.fixedButtonContainer}>
        <button
          type="button"
          className={`${styles.applyButton} ${styles.applyButtonTwoLine}`}
          onClick={() => window.dispatchEvent(new CustomEvent("lazyday:notify-cta"))}
        >
          {NOTIFY_SEASON} 오픈 알림 신청
          <span className={styles.applyBtnSub}>
            *{NOTIFY_SEASON} 진행 일정: {NOTIFY_SCHEDULE}
          </span>
        </button>
      </div>
    )
  }

  // 마감 모드 — 2026-09-08 회색 '모집 마감' 복원

  if (SEASON.status === "closedEarly") {
    return (
      <div className={styles.fixedButtonContainer}>
        <span className={styles.applyButtonClosed} aria-disabled="true">
          {PREVIEW.season} 모집 마감
        </span>
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
