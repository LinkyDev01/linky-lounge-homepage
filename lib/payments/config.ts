/**
 * 결제 설정 — 토스페이먼츠 환경변수의 단일 창구.
 *
 * 이력(2026-08-31~09-01): 포트원 경유 KG이니시스로 이전하려다, 이니시스 표준결제창의
 * UI 문제와 **토스 일반결제 라이브가 이미 가능하다는 사실**이 확인되어 토스로 정착했다.
 * 포트원 병존 코드는 2026-09-01 제거(운영자 "KG 심사 안받고 토스로 쭉 할게").
 * 되살릴 일이 생기면 git 이력에 온전히 남아 있다.
 *
 * 서버·클라이언트가 함께 읽으므로 "use client" 금지.
 * ⚠ 시크릿(TOSS_SECRET_KEY)은 여기서 다루지 않는다 — 서버 모듈에서만 process.env 로 읽는다.
 */

/** 2026-09-01: 토스페이먼츠 **일반결제 라이브 계약이 완료돼 있었다** — 결제위젯을
 *  추가 심사 없이 쓸 수 있었고(`live_gck_` 발급 확인), 운영자 결정으로 라이브 전환했다.
 *  KG이니시스는 폐기 방향이지만 코드는 남긴다: 되돌릴 때 env 한 줄이면 되고,
 *  지우는 순간 그 선택지를 다시 만드는 비용이 생긴다. (DECISIONS 2026-09-01) */
// ── 토스 (공개 값) ──────────────────────────────────────────────
/** 상점 키 미설정 시 토스 문서 공용 테스트 키 — 실결제가 이루어지지 않는다 */
export const TOSS_DOCS_TEST_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || TOSS_DOCS_TEST_CLIENT_KEY
export const TOSS_IS_TEST_KEY =
  !process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY.startsWith("test_")
/** 위젯 내부 색은 코드로 못 바꾼다(토스 iframe) — 어드민 테마의 variantKey 를 env 로 */
export const TOSS_VARIANT_PAYMENT = process.env.NEXT_PUBLIC_TOSS_VARIANT_PAYMENT || "DEFAULT"
export const TOSS_VARIANT_AGREEMENT = process.env.NEXT_PUBLIC_TOSS_VARIANT_AGREEMENT || "AGREEMENT"

/** 모임 결제를 어디로 보낼지 — **우리 결제창 vs 토스 링크페이** (2026-09-01).
 *
 *  왜 스위치가 생겼나 (2026-09-01 하루의 경위): 라이브 키를 넣었는데 결제가
 *  "업체 사정으로 인해 결제를 일시 중지하였습니다"로 거부됐다. 카드가 아니라 **상점**
 *  문제였고, 그동안 링크페이(buy.tosspayments.com)로 되돌려 결제를 살렸다.
 *
 *  **원인은 계약이 아니라 MID 였다.** 토스 상점관리자 '결제 UI 설정'의 이용서비스가
 *  계약 안 된 MID(linkyklyns)로 잡혀 있었다 — 같은 clientKey 라도 variantKey(DEFAULT)가
 *  가리키는 MID 가 결제 가능 여부를 가른다. 계약된 MID(linkykrcbe)로 바꾸자 실결제
 *  성공(코스터 15,000원 실측). ⚠ **결제가 상점 사유로 거부되면 키보다 이 설정을 먼저 볼 것.**
 *
 *  지금은 "widget" — 모임·제품 모두 우리 결제창으로 간다. 링크페이는 비상 경로로
 *  남겨 둔다(payUrl 은 one-day-config 에 보존): 결제가 다시 막히면 이 한 줄만 바꾸면
 *  모임 결제가 즉시 되살아난다. ⚠ 단 **링크페이에는 제품 상품이 없어** 그때도 제품은
 *  못 판다 — 그 상황이 오면 제품은 별도 대응이 필요하다.
 *
 *  env 로 빼지 않은 이유: NEXT_PUBLIC_* 은 Type·빌드캐시 함정이 있어(§5) 한 줄 수정 +
 *  배포가 오히려 확실하다. */
export type MeetingPayRoute = "linkpay" | "widget"
export const MEETING_PAY_ROUTE: MeetingPayRoute = "widget"

/** 결제 결과 화면 경로 (호스트 base 는 호출부가 붙인다) */
export const CHECKOUT_PATH = "/one-day-talk-01/checkout"
export const SUCCESS_PATH = `${CHECKOUT_PATH}/success`
export const FAIL_PATH = `${CHECKOUT_PATH}/fail`
