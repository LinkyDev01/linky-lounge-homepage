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

/**
 * 로그인 뒤 돌아갈 경로를 담는 쿠키 (2026-09-02).
 *
 * **왜 쿼리스트링이 아니라 쿠키인가** — 종전에는 `redirectTo` 에 `?next=…` 를 붙여
 * Supabase 에 넘겼는데, Supabase 의 **Redirect URLs 허용 목록은 쿼리를 포함한 URL 전체를
 * 패턴으로 비교**한다. 목록에 `https://…/api/auth/callback` 을 정확히 등록해도 실제 값은
 * `…/api/auth/callback?next=%2F` 라 완전 일치가 깨지고, 그러면 Supabase 가 **Site URL 로
 * 돌려보내** 로그인이 엉뚱한 도메인(기본값 localhost)에서 끝난다.
 * 쿠키로 옮기면 `redirectTo` 가 **쿼리 없는 깔끔한 URL** 이 되어 등록값과 그대로 맞는다 —
 * 운영자가 목록에 와일드카드를 쓰지 않아도 되고, 어느 호스트가 열려 있는지 목록만 봐도 안다.
 *
 * ⚠ host-only·`SameSite=Lax` — 소셜에서 돌아오는 것은 top-level GET 이라 Lax 로 실려 온다
 *   (PKCE `code_verifier` 쿠키가 이미 같은 조건에서 동작한다).
 * ⚠ 10분이면 충분하다 — 동의 화면에 머무는 시간. 오래 두면 어제 누른 로그인이 오늘 이동을
 *   가로챈다.
 */
export const AUTH_NEXT_COOKIE = "lz_auth_next"

export const authNextCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 600,
}
