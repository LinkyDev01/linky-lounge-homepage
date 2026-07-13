"use client"

import { ApplyButton } from "./apply-button"
import { SEASON } from "./season-config"
import styles from "./page.module.css"

/**
 * 페이지 전체에서 항상 하단에 노출되는 신청하기 버튼.
 * (이전에는 closing-section이 viewport에 들어오면 사라졌으나, 동민님 요청으로
 * 어떤 섹션에 있든 일관되게 노출되도록 변경.)
 * 조기마감 모드: 버튼 아래 한 줄 주석(희소성 문구) 추가 (운영자 확정 2026-07-13)
 */
export function StickyApplyButton() {
  return (
    <div className={styles.fixedButtonContainer}>
      <ApplyButton />
      {SEASON.status === "closedEarly" && (
        <p className={styles.applyNote}>
          {SEASON.name} 모집 조기 마감 | {SEASON.next}는 {SEASON.nextStartLabel}에 시작돼요
        </p>
      )}
    </div>
  )
}
