/**
 * 일회성 모임(원데이 토크·무비토크) 일정·가격 단일 출처 (2026-08-11, 토스 결제위젯 연동).
 * apply 페이지(회차 선택)·checkout(위젯 금액)·/api/lazyday/payment/confirm(서버 금액 검증)이
 * 모두 이 파일을 읽는다 — 회차·가격 변경은 여기 한 곳만 고친다.
 * 서버 라우트에서도 import 하므로 "use client" 금지.
 *
 * 2026-08-11 운영자: 원데이 두 상품 4주 연기(브람스 8/2→8/30, 시지프 8/9→9/6) +
 * 호프 무비토크 상품화(7/26→8/23, 가격 동일 35,000원). 월이 갈리며 회차 식별자는
 * day 단수에서 key(month*100+day)로 전환.
 *
 * 2026-08-18 운영자: 카드뉴스 이미지(브람스·시지프·호프) 기준으로 시간 정정.
 * 브람스·시지프는 저녁(19:00–22:00)이 아니라 **오전(08:00–11:00)**, 시지프는
 * 날짜도 9/6(일)이 아니라 **9/5(토)**. day 가 바뀌어 sessionKey(month*100+day)도
 * 906→905 로 바뀐다 — 배포 직전 원장(orders) 실측으로 진행 중 결제 없음을
 * 확인했다(테스트 결제 1건만 있었고 운영자 확인 후 무시).
 */

export const ONEDAY_PRICE = 35_000 // 회차당 참가비 (원) — 전 회차 동일 (무비토크 포함)

export type OnedaySession = {
  month: number
  day: number
  /** 달력 첨자·일정 행 라벨 ("무비토크" / "1회차" / "2회차") */
  label: string
  kind: "book" | "movie"
  /** 작품명 (『』 없이) */
  work: string
  /** 저자 — 영화는 감독 표기, 없으면 빈 값 */
  author: string
  time: string
  /** 시각과 무관한 수동 마감 */
  closed?: boolean
}

// 일회성 모임 일정 — 4주 연기 반영 (운영자 지시 2026-08-11)
export const ONEDAY = {
  year: 2026,
  sessions: [
    { month: 8, day: 23, label: "무비토크", kind: "movie", work: "호프", author: "나홍진 감독", time: "19:00–22:00" },
    { month: 8, day: 30, label: "1회차", kind: "book", work: "브람스를 좋아하세요...", author: "프랑수아즈 사강", time: "08:00–11:00" },
    { month: 9, day: 5, label: "2회차", kind: "book", work: "시지프 신화", author: "알베르 카뮈", time: "08:00–11:00" },
  ] as OnedaySession[],
  rangeLabel: "8/23 · 8/30 · 9/5",
}

/** 회차 식별 키 — 월이 섞여 day 만으로 유일하지 않다 (8월·9월). 예: 8/23 → 823 */
export function sessionKey(s: Pick<OnedaySession, "month" | "day">) {
  return s.month * 100 + s.day
}

export function findSession(key: number) {
  return ONEDAY.sessions.find((s) => sessionKey(s) === key)
}

/** 이미 지난 회차 판정 — 모임 시작 시각이 지나면 신청 불가 (2026-08-05).
 *  지난 회차가 선택 가능하면 종료된 모임에 결제까지 진행되어 환불 사고가 난다.
 *  ⚠ 2026-08-18: 회차마다 시작 시각이 다르다(무비토크 19:00, 원데이 오전 08:00) —
 *  이전엔 19:00(=10:00 UTC)을 전 회차에 하드코딩했다가, 브람스·시지프가 오전으로
 *  바뀌면서 그 값이 맞지 않게 됐다. s.time 첫 시각에서 직접 KST→UTC(−9h)로 구한다.
 *  Date.UTC 는 시(hour) 언더플로를 자동으로 전날로 정규화한다(08:00 KST → 전날 23:00 UTC). */
export function isPastSession(s: OnedaySession) {
  const [h, m] = s.time.split(/[–-]/)[0].split(":").map(Number)
  return Date.now() > Date.UTC(ONEDAY.year, s.month - 1, s.day, h - 9, m)
}

/** "8/23 (일)" — 캘린더 밑 일정표·체크아웃 요약 라벨 */
export function sessionDateLabel(s: OnedaySession) {
  const wd = ["일", "월", "화", "수", "목", "금", "토"][new Date(ONEDAY.year, s.month - 1, s.day).getDay()]
  return `${s.month}/${s.day} (${wd})`
}

// ── 주문번호 계약 ─────────────────────────────────────────────
// 서버가 주문 DB 없이 금액을 검증할 수 있도록 회차 키를 orderId에 인코딩한다.
// 형식: oneday-d{key}x{key}-{ts36}-{rand}  (토스 허용 문자 [a-zA-Z0-9-_], 6~64자)
// confirm 라우트는 orderId만으로 기대 금액(회차 수 × ONEDAY_PRICE)을 재계산해
// 클라이언트가 보낸 amount와 대조한다 — 금액 변조 차단.

export function buildOrderId(keys: number[]) {
  const d = [...keys].sort((a, b) => a - b).join("x")
  const rand = Math.random().toString(36).slice(2, 8)
  return `oneday-d${d}-${Date.now().toString(36)}-${rand}`
}

/** orderId → 회차 키 배열. 형식이 다르거나 실제 회차와 불일치하면 null */
export function parseOrderKeys(orderId: string): number[] | null {
  const m = /^oneday-d([0-9]+(?:x[0-9]+)*)-[a-z0-9]+-[a-z0-9]+$/.exec(orderId)
  if (!m) return null
  const keys = m[1].split("x").map(Number)
  const valid = new Set(ONEDAY.sessions.map(sessionKey))
  if (keys.length === 0 || keys.length > ONEDAY.sessions.length) return null
  if (new Set(keys).size !== keys.length) return null // 중복 회차로 금액 부풀리기 방지
  return keys.every((k) => valid.has(k)) ? keys : null
}

/** 결제창에 노출되는 주문명 — "원데이 토크 — 『브람스…』" / "무비토크 — 『호프』" / 복수면 "외 1건" */
export function orderNameFor(keys: number[]) {
  const picked = ONEDAY.sessions.filter((s) => keys.includes(sessionKey(s)))
  if (picked.length === 0) return "일회성 모임"
  const first = `${picked[0].kind === "movie" ? "무비토크" : "원데이 토크"} — 『${picked[0].work}』`
  return picked.length === 1 ? first : `${first} 외 ${picked.length - 1}건`
}

/** 토스 문서 공용 테스트 클라이언트 키 — 상점 키(NEXT_PUBLIC_TOSS_CLIENT_KEY) 미설정 시 폴백.
 *  이 키로는 실제 결제가 이루어지지 않는다 (체크아웃 화면에 테스트 환경 안내 노출). */
export const TOSS_DOCS_TEST_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
