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
 *  테스트/실연동을 조건문으로 가르지 않는다 (실연동 전환 = 값 교체만).
 *
 *  ⚠ **위 두 값을 Vercel 에 넣은 뒤에는 반드시 캐시 없는 재배포를 해야 한다.**
 *  `NEXT_PUBLIC_*` 은 빌드 시 번들에 리터럴로 박히는데, Vercel 의 Redeploy 는
 *  기본적으로 빌드 캐시를 재사용해서 **번들이 바이트 단위로 그대로 남는다**
 *  (2026-08-31 실측: env 를 넣고 Redeploy 했는데 청크가 600182B 로 동일,
 *   값은 여전히 `process.env.X||""` 참조 상태였다). 새 커밋을 푸시하거나
 *  Redeploy 대화상자에서 'Use existing Build Cache' 를 꺼야 반영된다.
 *  주입 여부 판정은 프로덕션 청크 grep — 설정된 값만 리터럴로 보인다 (§5).
 *
 *  ⚠⚠ **그리고 Vercel 에서 Type 을 `Config` 로 넣어야 한다. `Secret` 이면 안 된다.**
 *  Secret 타입은 빌드 타임에 값이 노출되지 않아 `NEXT_PUBLIC_*` 이 **끝내 안 박힌다**
 *  — 캐시를 꺼도, 새 커밋을 밀어도 소용없다(2026-08-31: 캐시 원인인 줄 알고 재빌드를
 *  두 번 돌렸는데 계속 `||""` 였고, 진짜 원인이 이것이었다. Key 옆 경고 삼각형이
 *  Vercel 이 주는 신호다). 애초에 이 두 값은 **공개값**이다 — 결제창을 띄우려면
 *  모든 방문자 브라우저에 실려 나가야 하므로 감추는 것 자체가 성립하지 않는다.
 *  진짜 비밀은 PORTONE_API_SECRET·PORTONE_WEBHOOK_SECRET 이고 그쪽이 Secret 이다. */
/** 포트원 채널이 **실연동인가**. 기본값은 false — 안전한 쪽이 기본이어야 한다.
 *  테스트 채널도 결제를 '승인'하므로(손님 눈에는 성공, 실제 입금 0원) 실연동
 *  전까지는 결제 화면이 그 사실을 반드시 말해야 한다. 실연동 전환 시
 *  `NEXT_PUBLIC_PORTONE_LIVE=1` (Config 타입) 을 넣으면 안내가 사라진다. */
export const PORTONE_IS_LIVE = (process.env.NEXT_PUBLIC_PORTONE_LIVE || "").trim() === "1"

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
