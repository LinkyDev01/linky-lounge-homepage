"use client"

import styles from "./page.module.css"

export function ApplyButton() {
  return (
    <span className={styles.applyButtonClosed} aria-disabled="true">
      2기 모집 마감
    </span>
  )
}
