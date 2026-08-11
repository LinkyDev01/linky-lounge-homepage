/**
 * 원데이 토크 일정·가격 단일 출처 (2026-08-11, 토스 결제위젯 연동).
 * apply 페이지(회차 선택)·checkout(위젯 금액)·/api/lazyday/payment/confirm(서버 금액 검증)이
 * 모두 이 파일을 읽는다 — 회차·가격 변경은 여기 한 곳만 고친다.
 * 서버 라우트에서도 import 하므로 "use client" 금지.
 */

export const ONEDAY_PRICE = 35_000 // 회차당 참가비 (원)

// 1회성 모임 일정 — 8월, 8/2·8/9 (운영자 지시 2026-07-24)
export const ONEDAY = {
  year: 2026,
  month: 8,
  monthName: "8월",
  monthEng: "AUG. 2026",
  // 회차별 책·시간 (운영자 지시 2026-07-24). day = 8월 날짜
  sessions: [
    { day: 2, label: "1회차", book: "브람스를 좋아하세요...", author: "프랑수아즈 사강", time: "19:00–22:00" },
    // closed: 시각과 무관한 수동 마감 (운영자 지시 2026-08-09 — 시지프 신화 신청 차단)
    { day: 9, label: "2회차", book: "시지프 신화", author: "알베르 카뮈", time: "19:00–22:00", closed: true },
  ] as Array<{ day: number; label: string; book: string; author: string; time: string; closed?: boolean }>,
  rangeLabel: "8/2 · 8/9",
}

/** 이미 지난 회차 판정 — 모임 시작(19:00 KST = 10:00 UTC)이 지나면 신청 불가 (2026-08-05).
 *  지난 회차가 선택 가능하면 종료된 모임에 결제까지 진행되어 환불 사고가 난다. */
export function isPastSession(day: number) {
  return Date.now() > Date.UTC(ONEDAY.year, ONEDAY.month - 1, day, 10, 0)
}

/** "8/2 (일)" — 캘린더 밑 일정표·체크아웃 요약 라벨 */
export function sessionDateLabel(day: number) {
  const wd = ["일", "월", "화", "수", "목", "금", "토"][new Date(ONEDAY.year, ONEDAY.month - 1, day).getDay()]
  return `${ONEDAY.month}/${day} (${wd})`
}

// ── 주문번호 계약 ─────────────────────────────────────────────
// 서버가 주문 DB 없이 금액을 검증할 수 있도록 회차를 orderId에 인코딩한다.
// 형식: oneday-d{day}x{day}-{ts36}-{rand}  (토스 허용 문자 [a-zA-Z0-9-_], 6~64자)
// confirm 라우트는 orderId만으로 기대 금액(회차 수 × ONEDAY_PRICE)을 재계산해
// 클라이언트가 보낸 amount와 대조한다 — 금액 변조 차단.

export function buildOrderId(days: number[]) {
  const d = [...days].sort((a, b) => a - b).join("x")
  const rand = Math.random().toString(36).slice(2, 8)
  return `oneday-d${d}-${Date.now().toString(36)}-${rand}`
}

/** orderId → 회차 day 배열. 형식이 다르거나 실제 회차와 불일치하면 null */
export function parseOrderDays(orderId: string): number[] | null {
  const m = /^oneday-d([0-9]+(?:x[0-9]+)*)-[a-z0-9]+-[a-z0-9]+$/.exec(orderId)
  if (!m) return null
  const days = m[1].split("x").map(Number)
  const valid = new Set(ONEDAY.sessions.map((s) => s.day))
  if (days.length === 0 || days.length > ONEDAY.sessions.length) return null
  if (new Set(days).size !== days.length) return null // 중복 회차로 금액 부풀리기 방지
  return days.every((d) => valid.has(d)) ? days : null
}

/** 결제창에 노출되는 주문명 — "원데이 토크 — 『브람스를 좋아하세요...』" / 복수면 "외 1회차" */
export function orderNameFor(days: number[]) {
  const picked = ONEDAY.sessions.filter((s) => days.includes(s.day))
  if (picked.length === 0) return "원데이 토크"
  const first = `원데이 토크 — 『${picked[0].book}』`
  return picked.length === 1 ? first : `${first} 외 ${picked.length - 1}회차`
}

/** 토스 문서 공용 테스트 클라이언트 키 — 상점 키(NEXT_PUBLIC_TOSS_CLIENT_KEY) 미설정 시 폴백.
 *  이 키로는 실제 결제가 이루어지지 않는다 (체크아웃 화면에 테스트 환경 안내 노출). */
export const TOSS_DOCS_TEST_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
