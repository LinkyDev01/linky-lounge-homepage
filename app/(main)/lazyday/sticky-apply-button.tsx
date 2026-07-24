"use client"

import { ApplyButton } from "./apply-button"
import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "./page.module.css"

/**
 * 페이지 전체에서 항상 하단에 노출되는 신청하기 버튼.
 * (이전에는 closing-section이 viewport에 들어오면 사라졌으나, 동민님 요청으로
 * 어떤 섹션에 있든 일관되게 노출되도록 변경.)
 * 조기마감 모드의 희소성 문구는 버튼 안 둘째 줄로 이동 (운영자 지시 2026-07-13 — 가독성)
 */
export function StickyApplyButton() {
  return (
    <div className={styles.fixedButtonContainer}>
      {/* 가로 2버튼: 4기 정규 신청 | One Day Talk 신청 (운영자 지시 2026-07-24) */}
      <div className={styles.ctaRow}>
        <ApplyButton className={styles.ctaHalf} />
        <LazydayLink href="/oneday" className={`${styles.applyButton} ${styles.ctaHalf} ${styles.ctaOneday}`}>
          One Day Talk 신청하기
        </LazydayLink>
      </div>
    </div>
  )
}
