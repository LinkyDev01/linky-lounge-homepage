type FbqStandard =
  | "PageView"
  | "Lead"
  | "ViewContent"
  | "Contact"
  | "CompleteRegistration"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function trackStandard(
  event: FbqStandard,
  params?: Record<string, string | number>
) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params)
  }
}

export function trackCustom(
  event: string,
  params?: Record<string, string | number>
) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", event, params)
  }
}
