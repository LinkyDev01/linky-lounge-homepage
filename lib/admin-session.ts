/**
 * 관리자 세션 토큰 (2026-09-02) — `lazyday_admin` 쿠키의 값을 **서명 토큰**으로.
 *
 * 종전 값은 `ADMIN_SECRET` 원문이었다: 두 사람이 같은 값을 들고 있어 누가 봤는지 구분이 안 되고,
 * 만료가 없고, 쿠키 하나가 새면 시크릿이 통째로 새는 것과 같았다. 소셜 로그인(#584)이 `who` 를
 * 별도 쿠키(`lazyday_admin_who`)에 실었지만 그 쿠키엔 서명이 없어 값을 바꿔 끼울 수 있었다.
 *
 * 이제 쿠키 값 = `base64url(payload) "." base64url(HMAC-SHA256(payload, ADMIN_SECRET))`,
 * payload = `{ v:1, who, iat, exp }` (exp = 발급 + 7일). 검증기 하나가 서명·만료를 보고 `who` 를 돌려준다.
 *   · who 가 토큰 안에 있으므로 `lazyday_admin_who` 쿠키는 **더 발급하지 않는다** (읽던 곳은 토큰의 who 로).
 *   · 시크릿은 서버에만 있다 — 토큰을 손에 넣어도 시크릿은 모른다. 7일 뒤 스스로 죽는다.
 *   · 옛 형식(시크릿 원문)은 검증에 실패한다 → 로그인으로 307. 두 운영자 1회 재로그인.
 *   · GAS `ADMIN_TOKEN`(우리 서버 → GAS 한 방향, `ADMIN_SECRET` 값)은 **쿠키가 아니다** — 무변경.
 *
 * ⚠ **런타임 무관해야 한다** — 미들웨어(Edge)와 라우트 핸들러(Node) 둘 다 쓴다. 그래서 `node:crypto` 가
 *   아니라 `crypto.subtle`·`btoa`·`atob` 만 쓴다. 검증은 `crypto.subtle.verify`(상수 시간 비교).
 * ⚠ 시크릿은 호출 시점에 읽는다(모듈 스코프 캐시 금지) — 리허설이 env 를 바꿔 가며 부른다.
 */

import type { NextRequest } from "next/server"

export const ADMIN_COOKIE = "lazyday_admin"
/** 옛 who 쿠키 — 더 발급하지 않지만 로그아웃·재발급 때 청소한다 */
export const LEGACY_WHO_COOKIE = "lazyday_admin_who"
export const ADMIN_MAX_AGE = 60 * 60 * 24 * 7 // 7일 (종전과 같다)

const enc = new TextEncoder()
const dec = new TextDecoder()

function b64url(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
/** base64url → 바이트. ⚠ `new ArrayBuffer` 위에 만든다 — TS 5.7+ 의 `BufferSource` 는 SharedArrayBuffer 를
 *  받지 않아 `Uint8Array.from(...)`(ArrayBufferLike)을 `crypto.subtle.verify` 에 넘기면 타입이 깨진다 */
function fromB64url(s: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) return null
  const t = s.replace(/-/g, "+").replace(/_/g, "/")
  const pad = t.length % 4 ? "=".repeat(4 - (t.length % 4)) : ""
  try {
    const bin = atob(t + pad)
    const out = new Uint8Array(new ArrayBuffer(bin.length))
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } catch {
    return null
  }
}

function secretOf(): string | null {
  const s = process.env.ADMIN_SECRET?.trim()
  return s ? s : null
}
async function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
}

export type AdminClaims = { v: 1; who: string; iat: number; exp: number }

/** 토큰 발급. `who` 는 소셜 로그인의 이메일, 비밀번호 경로는 "password" */
export async function signAdminToken(who: string, opts: { now?: number; maxAgeSec?: number } = {}): Promise<string> {
  const secret = secretOf()
  if (!secret) throw new Error("ADMIN_SECRET 미설정")
  const now = Math.floor((opts.now ?? Date.now()) / 1000)
  const claims: AdminClaims = { v: 1, who, iat: now, exp: now + (opts.maxAgeSec ?? ADMIN_MAX_AGE) }
  const p = b64url(enc.encode(JSON.stringify(claims)))
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(p)))
  return `${p}.${b64url(sig)}`
}

/** 토큰 검증 — 형식·서명·만료. 무엇이든 어긋나면 null (사유를 갈라 주지 않는다: 쿠키 위조자에게 힌트가 된다) */
export async function verifyAdminToken(token: string | undefined | null, now = Date.now()): Promise<AdminClaims | null> {
  const secret = secretOf()
  if (!secret || !token) return null
  const parts = token.split(".")
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const sig = fromB64url(parts[1])
  const payloadBytes = fromB64url(parts[0])
  if (!sig || !payloadBytes) return null
  let ok = false
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), sig, enc.encode(parts[0]))
  } catch {
    return null
  }
  if (!ok) return null
  let claims: unknown
  try {
    claims = JSON.parse(dec.decode(payloadBytes))
  } catch {
    return null
  }
  const c = claims as Partial<AdminClaims>
  if (!c || c.v !== 1 || typeof c.who !== "string" || !c.who || typeof c.iat !== "number" || typeof c.exp !== "number") return null
  if (c.exp * 1000 <= now) return null
  return { v: 1, who: c.who, iat: c.iat, exp: c.exp }
}

/** 라우트 게이트 — 관리자면 who(이메일 또는 "password"), 아니면 null */
export async function adminWho(req: NextRequest): Promise<string | null> {
  const claims = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)
  return claims?.who ?? null
}

/** 발급·청소에 쓰는 쿠키 옵션 — 종전 `auth/route.ts` 와 같은 값 */
export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: ADMIN_MAX_AGE,
    path: "/",
  }
}
