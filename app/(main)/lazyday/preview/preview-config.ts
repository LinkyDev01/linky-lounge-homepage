// ─────────────────────────────────────────────────────────────
// 프리뷰 전용 예시 데이터 — 실제 반영 시 이 값만 바꾸면 됩니다.
// ─────────────────────────────────────────────────────────────

export const PREVIEW = {
  season: "3기",
  nextSeason: "4기",
  /** 신청 마감일 (KST, 이 날짜 23:59까지 신청 가능) */
  deadline: "2026-07-13",
  periodLabel: "7/15 – 9/6",
  priceNow: "150,000원",
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
