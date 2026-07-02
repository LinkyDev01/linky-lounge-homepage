// ─────────────────────────────────────────────────────────────
// 프리뷰 전용 예시 데이터 — 기수명·일정·가격은 season-config에서 파생.
// 마감일·잔여석 등 프리뷰에서 실험 중인 값만 여기서 관리합니다.
// ─────────────────────────────────────────────────────────────

import { SEASON } from "../season-config"

export const PREVIEW = {
  season: SEASON.name,
  nextSeason: SEASON.next,
  /** 신청 마감일 (KST, 이 날짜 23:59까지 신청 가능) */
  deadline: "2026-07-13",
  periodLabel: SEASON.periodLabel,
  priceNow: SEASON.price,
  /** 취소선 정가 — 실판매 이력 확인 전까지 프리뷰 초안 전용, 정식 반영 금지 */
  priceWas: "200,000원",
  /** 요일별 정원/잔여석 — 예시값 */
  capacity: [
    { day: "수요일", total: 6, left: 2 },
    { day: "목요일", total: 6, left: 4 },
    { day: "일요일", total: 6, left: 1 },
  ],
}

/** 마감까지 남은 일수 (오늘 포함 X, 마감일 당일이면 0 = D-DAY) */
export function daysUntilDeadline(): number {
  const end = new Date(`${PREVIEW.deadline}T23:59:59+09:00`).getTime()
  return Math.floor((end - Date.now()) / 86_400_000)
}
