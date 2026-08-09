"use client"

import { ApplyButton } from "./apply-button"
import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "./page.module.css"

/**
 * 하단 고정 CTA — **원데이 토크 병행 2버튼 서식** (좌 원데이 토크 | 우 4기).
 *
 * ⚠️ 현재 **렌더하지 않는 고아 컴포넌트**다. 2026-07-24 운영자 지시로 도입했다가
 * 2026-08-09 "CTA는 4기 신청하기만 남겨놔 / 원데이토크 병행 서식은 따로 빼놓되 일단은
 * 원래 버전으로 복귀"로 내려왔다. 삭제하지 말 것 — 원데이 토크를 다시 열 때 랜딩의
 * `StickyApplyButton` 대신 이걸 import 하면 그대로 되살아난다.
 *
 * 딸린 자산도 함께 보존한다 (지우면 되살릴 때 다시 만들어야 함):
 *   · page.module.css 의 `.ctaRow` · `.ctaHalf` · `.ctaOneday`
 *   · ApplyButton 의 `short` prop (2버튼일 때 "신청하기" → "신청" 축약)
 */
export function StickyApplyButtonDuo() {
  return (
    <div className={styles.fixedButtonContainer}>
      {/* 가로 2버튼: 좌 원데이 토크 | 우 4기 — 2버튼일 땐 "신청"으로 축약 (운영자 지시 2026-07-24) */}
      <div className={styles.ctaRow}>
        <LazydayLink href="/one-day-talk-01/apply" className={`${styles.applyButton} ${styles.ctaHalf} ${styles.ctaOneday}`}>
          원데이 토크 신청
        </LazydayLink>
        <ApplyButton className={styles.ctaHalf} short />
      </div>
    </div>
  )
}
