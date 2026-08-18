type FbqStandard =
  | "PageView"
  | "Lead"
  | "ViewContent"
  | "Contact"
  | "CompleteRegistration"
  | "InitiateCheckout"

/** 픽셀 파라미터 — status 처럼 불리언을 받는 표준 파라미터가 있어 boolean 을 포함한다 */
export type PixelParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * 이벤트 단위 고유 ID.
 *
 * 지금은 브라우저 픽셀만 쓰지만, 나중에 전환 API(서버 발화)를 붙이면 같은 전환이
 * 브라우저·서버 양쪽에서 들어와 **두 번 집계된다**. Meta 는 `eventID` 가 같은 쌍을
 * 하나로 합쳐서(중복 제거) 처리하므로, 지금부터 모든 호출에 붙여 둔다.
 * 서버 발화를 붙이는 시점에 같은 값을 CAPI 의 `event_id` 로 넘기면 된다.
 *
 * crypto.randomUUID 는 보안 컨텍스트(https·localhost)에서만 있어 폴백을 둔다.
 */
function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    /* 폴백으로 */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 표준 이벤트. 발화하면 그 이벤트의 eventID 를 돌려준다 —
 * 호출부가 서버로 같이 넘겨야 할 때 쓴다. 픽셀이 없으면(=이 도메인에서 미로드)
 * 아무 일도 하지 않고 null.
 */
export function trackStandard(event: FbqStandard, params?: PixelParams): string | null {
  if (typeof window === "undefined" || !window.fbq) return null
  const eventID = newEventId()
  window.fbq("track", event, params ?? {}, { eventID })
  return eventID
}

/** 커스텀 이벤트 — 표준과 같은 규칙으로 eventID 를 붙인다 */
export function trackCustom(event: string, params?: PixelParams): string | null {
  if (typeof window === "undefined" || !window.fbq) return null
  const eventID = newEventId()
  window.fbq("trackCustom", event, params ?? {}, { eventID })
  return eventID
}

/**
 * 신청 CTA 클릭 — 표준 `InitiateCheckout`.
 *
 * ⚠ 발화 지점이 왜 여기인가 (2026-08-18):
 * 이 이벤트는 원래 코드에 없었고 **메타 이벤트 설정 도구 규칙**(버튼 텍스트
 * "신청하기")이 만들고 있었다. 30일 150건. 그 규칙을 정리하면서 코드로 옮기는데,
 * 광고 세트 B3 가 이 이벤트를 최적화 기준으로 물고 있어 **같은 지점**이어야 한다.
 * 규칙이 잡던 "신청하기" 버튼은 홈 하단 스티키 CTA(`4기 신청하기`)와 상단 내비
 * (`신청하기`)다 — 신청 폼을 다 채운 뒤가 아니라 **신청 페이지로 들어가는 클릭**.
 *
 * 처음엔 완료 화면의 인터뷰 진입 버튼에 달았는데, 그건 퍼널상 Lead 보다도 뒤라
 * 건수가 급감한다. 메타는 광고 세트당 주 50건 안팎을 봐야 학습을 마치므로,
 * 지점을 잘못 옮기면 B3 가 학습 단계를 벗어나지 못한다.
 *
 * ⚠ 한 사람이 여러 번 눌러도 그대로 여러 번 쏜다 — 종전 규칙과 같은 성격이어야
 *   광고 세트가 보던 신호가 유지된다. 세션 단위로 묶으면 건수가 줄어 학습이 흔들린다.
 * ⚠ 의미상 여기서 결제가 일어나지는 않는다(북클럽은 인터뷰 통과 후 사이트 밖 결제).
 *   '결제 시작'은 광고 세트 호환을 위한 이름이고 실제로는 '신청 착수'다.
 */
export function trackApplyCtaClick() {
  return trackStandard("InitiateCheckout", {
    content_name: "lazyday_bookclub_4",
    value: 150000,
    currency: "KRW",
    num_items: 1,
  })
}
