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
