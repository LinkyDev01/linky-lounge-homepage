"use client"

import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "../page.module.css"
import { PREVIEW, daysUntilDeadline } from "./preview-config"

/** 개선안: 스티키 CTA에 마감 컨텍스트를 함께 표기 */
export function StickyApplyButtonV2() {
  const d = daysUntilDeadline()
  return (
    <div className={styles.fixedButtonContainer}>
      <LazydayLink href="/preview/apply" className={styles.applyButton}>
        {d < 0
          ? `${PREVIEW.nextSeason} 알림 받기`
          : `${PREVIEW.season} 신청하기 · ${d === 0 ? "오늘 마감" : `D-${d}`}`}
      </LazydayLink>
    </div>
  )
}
