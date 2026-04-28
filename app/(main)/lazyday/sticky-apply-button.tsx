"use client"

import { ApplyButton } from "./apply-button"
import styles from "./page.module.css"

/**
 * 페이지 전체에서 항상 하단에 노출되는 신청하기 버튼.
 * (이전에는 closing-section이 viewport에 들어오면 사라졌으나, 동민님 요청으로
 * 어떤 섹션에 있든 일관되게 노출되도록 변경.)
 */
export function StickyApplyButton() {
  return (
    <div className={styles.fixedButtonContainer}>
      <ApplyButton />
    </div>
  )
}
