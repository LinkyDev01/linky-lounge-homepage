/**
 * 반배정 열람 게이트 (2026-09-05) — 고객 공유용 `/classes` 의 문.
 *
 * 운영자 "누구나 무작정 들어가서 볼 순 없으니까" + "누구나 직접 그 자리 모달에서 입력하는 형태".
 * 멤버에게 알려 주는 **열람 암호** 하나로 연다. 관리자 로그인이 아니다 — 통과해도 얻는 건
 * 이 페이지 하나이고, 관리 쿠키(`lazyday_admin`)와 이름·수명·권한이 전부 다르다.
 *
 * ⚠ 암호는 **DB**(`bookclub_class_access`, 0016)에 sha256 으로 있다 — 레포가 public 이라 코드에
 *   못 적고, env 에 두면 운영자가 Vercel 에 넣고 재배포해야 페이지가 열린다(0015 의 실책).
 *   대소문자·앞뒤 공백 무관: 양쪽을 **trim + 대문자**로 맞춘 뒤 해시해 비교한다.
 *   행이 없으면 **닫힌다** — 없는 것과 빈 것을 같다고 보면 안 된다(§5 `undefined === undefined`).
 *
 * 쿠키 값 = base64url(payload) "." base64url(HMAC-SHA256(payload, ADMIN_SECRET)) — admin-session.ts 와
 * 같은 모양(서명 없는 플래그 쿠키는 값을 만들어 끼울 수 있다). payload 는 { v, scope:"classes", exp }.
 */

import { supabaseAdmin } from "./supabase-server"

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

/** 정규화된 암호의 sha256 hex — DB 에 저장된 값과 같은 방식으로 만든다 */
export async function hashPassword(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(normalizePassword(raw)))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** 열람 기능이 켜져 있는가 — 쿠키를 서명할 시크릿과 DB 가 있어야 한다 */
export function classesGateEnabled() {
  return !!process.env.ADMIN_SECRET && !!supabaseAdmin()
}

/**
 * 암호 대조. DB 에 그 기수의 행이 없거나 입력이 비면 **통과하지 않는다**.
 * 실패를 던지지 않는다 — 어떤 사고든 '열리지 않음'으로 끝난다(열려버리는 실패가 최악).
 */
export async function checkClassesPassword(cohort: string, input: unknown): Promise<boolean> {
  if (typeof input !== "string" || !input.trim()) return false
  const sb = supabaseAdmin()
  if (!sb) return false
  try {
    const { data, error } = await sb
      .from("bookclub_class_access")
      .select("password_hash")
      .eq("cohort", cohort)
      .maybeSingle()
    if (error || !data?.password_hash) return false
    const got = await hashPassword(input)
    // 길이가 같을 때만 상수시간 비교 — 해시끼리라 타이밍이 실익은 없지만 습관을 지킨다
    const want = data.password_hash
    if (got.length !== want.length) return false
    let diff = 0
    for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ want.charCodeAt(i)
    return diff === 0
  } catch (e) {
    console.error("[classes-gate]", e instanceof Error ? e.message : "unknown")
    return false
  }
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
