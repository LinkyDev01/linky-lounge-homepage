/**
 * Supabase API 키 **모양 검사** (2026-09-02) — 런타임 무관(순수 함수, import 없음).
 *
 * 왜 있나: Vercel 의 `SUPABASE_ANON_KEY` 에 대시보드의 **마스킹된 표시값**(`eyJhbGciOiJIUzI•••…`)이
 * 들어간 채 하루 종일 소셜 로그인이 실패했다. `•`(U+2022) 는 HTTP 헤더에 실을 수 없는 문자라
 * fetch 가 `Cannot convert argument to a ByteString` 으로 **요청을 보내기도 전에** 던졌고, auth-js 는
 * 이를 AuthRetryableFetchError 로 감싸 돌려줬다 — Supabase 쪽(auth·edge) 로그엔 아무 흔적이 없고
 * 화면은 "교환 실패" 한 마디였다. 값이 **비어 있으면** 조용히 꺼지는 규율(lib/auth-server.ts)은
 * 그대로 두되, **값이 있는데 키 모양이 아니면** 켜진 척하지 않고 무엇이 틀렸는지 말한다.
 *
 * 받아들이는 모양: 레거시 JWT(`eyJ….….…`) 또는 새 키(`sb_publishable_…` / `sb_secret_…`).
 * 공백·줄바꿈은 키에 있을 수 없으므로 **지워서 고쳐 준다**(복붙 줄바꿈 구제) — 그 밖의 문자는 오류.
 */

export type ApiKeyProblem = "missing" | "malformed" | "wrongrole"
export type ApiKeyKind = "anon" | "service"

const LEGACY_JWT = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const NEW_KEY = /^sb_(publishable|secret)_[A-Za-z0-9_-]+$/

/** 공백·줄바꿈 제거 — 키에는 공백이 없다 */
export function normalizeApiKey(raw: string | undefined | null): string {
  return (raw ?? "").replace(/\s+/g, "")
}

/** 레거시 JWT 의 `role` 클레임 — JWT 가 아니거나 못 읽으면 null */
export function jwtRole(key: string): string | null {
  const m = LEGACY_JWT.exec(key)
  if (!m) return null
  try {
    const payload = key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    const json = JSON.parse(atob(payload)) as { role?: unknown }
    return typeof json.role === "string" ? json.role : null
  } catch {
    return null
  }
}

/** 문제가 없으면 null. kind 는 그 자리에 와야 하는 역할 — anon 자리에 service_role 을 넣으면 "wrongrole" */
export function apiKeyProblem(raw: string | undefined | null, kind: ApiKeyKind): ApiKeyProblem | null {
  const key = normalizeApiKey(raw)
  if (!key) return "missing"
  if (LEGACY_JWT.test(key)) {
    const role = jwtRole(key)
    if (kind === "anon" && role === "service_role") return "wrongrole"
    if (kind === "service" && role === "anon") return "wrongrole"
    return null
  }
  if (NEW_KEY.test(key)) {
    const isSecret = key.startsWith("sb_secret_")
    if (kind === "anon" && isSecret) return "wrongrole"
    if (kind === "service" && !isSecret) return "wrongrole"
    return null
  }
  return "malformed"
}

/** 로그용 한 줄 — 값 자체는 찍지 않는다(길이·첫 이상 문자 위치만). 마스킹 `•` 이면 그렇다고 말한다 */
export function describeApiKey(raw: string | undefined | null): string {
  const key = normalizeApiKey(raw)
  if (!key) return "비어 있음"
  const parts = [`길이 ${key.length}`]
  const bad = [...key].findIndex((ch) => ch.charCodeAt(0) > 0x7e || ch.charCodeAt(0) < 0x21)
  if (bad >= 0) {
    const ch = key[bad]
    const cp = ch.codePointAt(0) ?? 0
    parts.push(`${bad}번째에 헤더 불가 문자 U+${cp.toString(16).toUpperCase().padStart(4, "0")}${cp === 0x2022 ? " (마스킹 •)" : ""}`)
  } else if (key.startsWith("Bearer")) parts.push("'Bearer ' 접두가 섞임")
  else if (!key.startsWith("eyJ") && !key.startsWith("sb_")) parts.push("JWT 도 sb_ 키도 아님")
  return parts.join(", ")
}
