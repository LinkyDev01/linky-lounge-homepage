/**
 * 반배정 열람 게이트 (2026-09-05) — 고객 공유용 `/classes` 의 문.
 *
 * 운영자 "누구나 무작정 들어가서 볼 순 없으니까" — 멤버에게 알려 주는 **열람 암호** 하나로 연다.
 * 관리자 로그인이 아니다: 통과해도 얻는 건 이 페이지 하나이고, 관리 쿠키와 이름·경로가 다르다.
 *
 * ⚠ 암호는 env `BOOKCLUB_CLASSES_PASSWORD` — 레포가 public 이라 코드에 적지 않는다(2026-09-05 확인).
 *   대소문자 무관(운영자 "대문자/소문자 모두 가능하게"): 양쪽을 trim + 대문자로 맞춰 비교한다.
 *   env 가 없으면 **닫힌다**(빈 문자열끼리 같다고 열리면 안 된다 — CLAUDE.md §5 `undefined === undefined`).
 *
 * 쿠키 값 = base64url(payload) "." base64url(HMAC-SHA256(payload, ADMIN_SECRET)) — admin-session.ts 와
 * 같은 모양(서명 없는 플래그 쿠키는 값을 만들어 끼울 수 있다). payload 는 { v, scope:"classes", exp }.
 */

export const CLASSES_COOKIE = "lazyday_classes"
/** 열람 유지 30일 — 기수 중에 몇 번이고 다시 볼 자리라 넉넉히 */
export const CLASSES_MAX_AGE = 60 * 60 * 24 * 30

const enc = new TextEncoder()
const dec = new TextDecoder()

const b64u = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
const unb64u = (s: string) => {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4))
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}
const hmacKey = (secret: string) =>
  crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])

/** 운영자 입력·손님 입력을 같은 규칙으로 정규화 — 앞뒤 공백 제거 + 대문자 */
export const normalizePassword = (s: string) => s.trim().toUpperCase()

/** 열람 기능이 켜져 있는가 — env 가 비어 있으면 페이지는 '준비 중' 을 낸다 */
export function classesGateEnabled() {
  return !!process.env.BOOKCLUB_CLASSES_PASSWORD?.trim() && !!process.env.ADMIN_SECRET
}

/** 암호 대조. env 미설정이면 어떤 입력도 통과하지 않는다 */
export function checkClassesPassword(input: unknown): boolean {
  const expected = process.env.BOOKCLUB_CLASSES_PASSWORD
  if (typeof expected !== "string" || !expected.trim()) return false
  if (typeof input !== "string" || !input.trim()) return false
  return normalizePassword(input) === normalizePassword(expected)
}

type Claims = { v: 1; scope: "classes"; iat: number; exp: number }

export async function signClassesToken(now = Date.now()): Promise<string> {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error("ADMIN_SECRET missing")
  const claims: Claims = { v: 1, scope: "classes", iat: now, exp: now + CLASSES_MAX_AGE * 1000 }
  const p = b64u(enc.encode(JSON.stringify(claims)))
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(p)))
  return `${p}.${b64u(sig)}`
}

export async function verifyClassesToken(token: string | undefined | null, now = Date.now()): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET
  if (!secret || !token) return false
  const parts = token.split(".")
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false
  let ok = false
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), unb64u(parts[1]), enc.encode(parts[0]))
  } catch {
    return false
  }
  if (!ok) return false
  let c: Claims
  try {
    c = JSON.parse(dec.decode(unb64u(parts[0]))) as Claims
  } catch {
    return false
  }
  return c?.v === 1 && c.scope === "classes" && typeof c.exp === "number" && c.exp > now
}
