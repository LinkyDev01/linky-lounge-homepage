"use client"

import Link from "next/link"
import { trackCustom } from "@/lib/meta-pixel"
import styles from "./page.module.css"

export function ApplyButton() {
  return (
    <Link
      href="/book-club/apply"
      className={styles.applyButton}
      onClick={() => trackCustom("ClickCTA", { button: "독서모임_신청하기" })}
    >
      신청하기
    </Link>
  )
}
