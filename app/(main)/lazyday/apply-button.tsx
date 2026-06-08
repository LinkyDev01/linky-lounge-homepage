"use client"

import Link from "next/link"
import styles from "./page.module.css"

export function ApplyButton() {
  return (
    <Link href="/lazyday/apply" className={styles.applyButton}>
      신청하기
    </Link>
  )
}
