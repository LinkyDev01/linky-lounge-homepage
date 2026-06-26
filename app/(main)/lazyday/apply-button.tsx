"use client"

import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "./page.module.css"

export function ApplyButton() {
  return (
    <LazydayLink href="/apply" className={styles.applyButton}>
      신청하기
    </LazydayLink>
  )
}
