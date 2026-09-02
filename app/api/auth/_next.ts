/**
 * `?next=` 안전화 — 로그인 뒤 돌아갈 경로는 **같은 오리진의 경로**만 받는다.
 * `//evil.com`·`https://…`·`javascript:` 처럼 오리진을 바꿀 수 있는 값은 전부 `/` 로.
 * (open redirect 차단 — 로그인 링크는 누구나 만들어 보낼 수 있다)
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw) return "/"
  const v = raw.trim()
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return "/"
  if (/[\r\n]/.test(v)) return "/"
  return v.slice(0, 512)
}

/** `next` 에 `?login=…` 표식을 붙인다 (이미 쿼리가 있으면 & 로) */
export function withLoginFlag(next: string, flag: "failed" | "ok"): string {
  return `${next}${next.includes("?") ? "&" : "?"}login=${flag}`
}
