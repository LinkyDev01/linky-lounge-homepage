"use client"

import { useEffect, useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { trackApplyCtaClick } from "@/lib/meta-pixel"
import { SEASON, daysUntilDeadline } from "./season-config"
import styles from "./page.module.css"

/** 하단 고정 CTA — [4기 신청하기] 형식 (마감일은 season-config).
 *  className: 가로 2버튼 배열 시 flex 조정용 추가 클래스 (StickyApplyButton)
 *  short: 2버튼 배열일 때 "신청하기" 대신 "신청"으로 축약 (운영자 지시 2026-07-24) */
export function ApplyButton({ className = "", short = false }: { className?: string; short?: boolean }) {
  // 마운트 후 계산 — 정적 프리렌더에 빌드 시점 D-day가 박제되는 것 방지
  const [d, setD] = useState<number | null>(null)
  useEffect(() => {
    setD(daysUntilDeadline())
    const t = setInterval(() => setD(daysUntilDeadline()), 60_000)
    return () => clearInterval(t)
  }, [])

  // 조기마감 모드: 살아있는 주황 버튼 그대로, 액션만 4기 알림으로 전환 (운영자 확정 2026-07-13)
  // 클릭은 커스텀 이벤트 — NextSeasonNotify가 받아 '폼 유효하면 제출 / 아니면 #notify 스크롤' 판단
  if (SEASON.status === "closedEarly") {
    return (
      <button
        type="button"
        className={`${styles.applyButton} ${styles.applyButtonTwoLine} ${className}`}
        onClick={() => window.dispatchEvent(new CustomEvent("lazyday:notify-cta"))}
      >
        {SEASON.next} 오픈 알림 신청
        <span className={styles.applyBtnSub}>
          *{SEASON.next} 진행 일정: 9.7 - 11.1
        </span>
      </button>
    )
  }

  // showDeadline=false: D-day 표기는 숨기고 '신청'만 — 마감일이 지나면 '모집 마감' (자동 종료)
  const label =
    d !== null && d < 0
      ? `${SEASON.name} 모집 마감`
      : !SEASON.showDeadline || d === null
      ? `${SEASON.name} 신청${short ? "" : "하기"}`
      : d === 0
      ? `${SEASON.name} 신청 (오늘 마감)`
      : `${SEASON.name} 신청 (마감일까지 D-${d})`

  return (
    <LazydayLink
      href={d !== null && d < 0 ? "/" : "/apply"}
      className={`${styles.applyButton} ${className}`}
      // 결제 시작 — 종전 이벤트 설정 도구 규칙이 잡던 바로 그 지점 (lib/meta-pixel 주석 참조).
      // 마감 뒤에는 홈으로 가는 버튼이라 쏘지 않는다.
      onClick={() => { if (!(d !== null && d < 0)) trackApplyCtaClick() }}
    >
      {label}
    </LazydayLink>
  )
}
