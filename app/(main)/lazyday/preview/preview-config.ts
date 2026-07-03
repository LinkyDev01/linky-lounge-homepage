// ─────────────────────────────────────────────────────────────
// 프리뷰 전용 예시 데이터 — 기수명·일정·가격·마감일은 season-config에서 파생.
// 프리뷰에서 실험 중인 값만 여기서 관리합니다.
// ─────────────────────────────────────────────────────────────

import { SEASON, daysUntilDeadline } from "../season-config"

export const PREVIEW = {
  season: SEASON.name,
  nextSeason: SEASON.next,
  /** 신청 마감일 — season-config 단일 출처 (D-day는 daysUntilDeadline으로 계산) */
  deadline: SEASON.deadline,
  periodLabel: SEASON.periodLabel,
  priceNow: SEASON.price,
  priceWas: SEASON.priceWas,
  /** 요일별 정원/잔여석 — 예시값 */
  capacity: [
    { day: "수요일", total: 6, left: 2 },
    { day: "목요일", total: 6, left: 4 },
    { day: "일요일", total: 6, left: 1 },
  ],
}

/** season-config의 헬퍼 재노출 — 기존 프리뷰 코드 호환용 */
export { daysUntilDeadline }
