/**
 * 결제 설정 — PG 분기 스위치와 환경변수 단일 창구 (2026-08-31).
 *
 * 배경: 토스페이먼츠 → 포트원(KG이니시스) 이전 중. 카드사 심사가 끝날 때까지
 * **두 PG가 병존**한다 (4기 결제가 운영 중이라 토스를 끊을 수 없다).
 * 코드 배포 없이 ACTIVE_PG 환경변수만 바꿔 즉시 전환할 수 있어야 한다.
 *
 * 서버·클라이언트가 함께 읽으므로 "use client" 금지.
 * ⚠ 시크릿(PORTONE_API_SECRET·PORTONE_WEBHOOK_SECRET·TOSS_SECRET_KEY)은 여기서
 *   다루지 않는다 — 서버 모듈에서만 process.env 로 직접 읽는다.
 */

export type PgProvider = "toss" | "portone"

/** 신규 결제를 어느 PG로 보낼지. 미설정 시 toss — 운영 중인 흐름을 기본값으로 둔다.
 *  NEXT_PUBLIC_ 접두 변수는 빌드 시 인라인되므로 클라이언트에서도 같은 값을 본다. */
export function activePg(): PgProvider {
  const v = (process.env.NEXT_PUBLIC_ACTIVE_PG || process.env.ACTIVE_PG || "").trim().toLowerCase()
  return v === "portone" ? "portone" : "toss"
}

// ── 포트원 (공개 값 — 클라이언트 노출 전제) ──────────────────────
export const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || ""
export const PORTONE_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || ""

/** 채널키는 콘솔에서 발급된 값을 env 로만 주입한다 — 코드에 상수로 박거나
 *  테스트/실연동을 조건문으로 가르지 않는다 (실연동 전환 = 값 교체만). */
export function portoneConfigured() {
  return PORTONE_STORE_ID.length > 0 && PORTONE_CHANNEL_KEY.length > 0
}

// ── 토스 (공개 값) ──────────────────────────────────────────────
/** 상점 키 미설정 시 토스 문서 공용 테스트 키 — 실결제가 이루어지지 않는다 */
export const TOSS_DOCS_TEST_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || TOSS_DOCS_TEST_CLIENT_KEY
export const TOSS_IS_TEST_KEY =
  !process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY.startsWith("test_")
/** 위젯 내부 색은 코드로 못 바꾼다(토스 iframe) — 어드민 테마의 variantKey 를 env 로 */
export const TOSS_VARIANT_PAYMENT = process.env.NEXT_PUBLIC_TOSS_VARIANT_PAYMENT || "DEFAULT"
export const TOSS_VARIANT_AGREEMENT = process.env.NEXT_PUBLIC_TOSS_VARIANT_AGREEMENT || "AGREEMENT"

/** 결제 결과 화면 경로 (호스트 base 는 호출부가 붙인다) */
export const CHECKOUT_PATH = "/one-day-talk-01/checkout"
export const SUCCESS_PATH = `${CHECKOUT_PATH}/success`
export const FAIL_PATH = `${CHECKOUT_PATH}/fail`
