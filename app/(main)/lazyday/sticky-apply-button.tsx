"use client"

import { ApplyButton } from "./apply-button"
import styles from "./page.module.css"

/**
 * 페이지 전체에서 항상 하단에 노출되는 신청하기 버튼.
 * (이전에는 closing-section이 viewport에 들어오면 사라졌으나, 동민님 요청으로
 * 어떤 섹션에 있든 일관되게 노출되도록 변경.)
 * 조기마감 모드의 희소성 문구는 버튼 안 둘째 줄로 이동 (운영자 지시 2026-07-13 — 가독성)
 *
 * 2026-08-09 (운영자 "CTA는 4기 신청하기만 남겨놔"): 원데이 토크 병행 2버튼 서식을
 * 걷어내고 **이 원래 버전으로 복귀**. 2버튼 서식은 지우지 않고
 * `sticky-apply-button-duo.tsx` 로 분리 보존 — 다시 켤 땐 랜딩에서 그 컴포넌트를 import.
 */
export function StickyApplyButton() {
  return (
    <div className={styles.fixedButtonContainer}>
      <ApplyButton />
    </div>
  )
}
