/**
 * 회원 세션 — **서버 전용** 헬퍼 (2026-09-02, 계획서 P4a).
 *
 * `@supabase/ssr` 의 createServerClient 를 **anon 키 + 요청 쿠키**로 만든다.
 * anon 키는 브라우저에 실어도 되는 키지만 여기서는 일부러 `NEXT_PUBLIC_` 을 붙이지
 * 않았다 — 브라우저용 supabase-js 클라이언트를 **만들지 않는다**는 결정(설계 결정 5,
 * lib/supabase-server.ts)을 환경변수 이름으로도 드러내기 위해서다. 세션이 필요한
 * 화면은 `/api/auth/me` 를 fetch 한다 (Shell·checkout 이 "use client" 라 prop 으로
 * 못 내린다 — 계획서 P4a-3).
 *
 * **profiles 는 여기서 읽지 않는다.** RLS 전면 거부라 anon/authenticated 로는 어떤
 * 표도 못 읽는다 — 회원 행은 세션으로 user_id 를 확인한 뒤 service_role
 * (`supabaseAdmin()`)로 읽는다. "본인은 자기 행만"(R13)은 정책이 아니라 라우트의
 * user_id 필터다.
 *
 * **미설정 시 조용히 꺼진다** (원장과 같은 규율): `SUPABASE_ANON_KEY` 가 없으면
 * `isAuthEnabled()` 가 false 고 `getSessionUser()` 는 null — 로그인 버튼이 없는
 * 사이트처럼 동작한다. 결제·신청은 비회원 경로가 기본이라(R11) 영향이 없다.
 *
 * ⚠ **setAll 은 try/catch** — Server Component 렌더 중 `cookies().set()` 은 Next 가
 *   금지해 throw 한다. 라우트 핸들러에서는 정상 동작하고, 토큰 갱신도 거기서 쿠키에
 *   써진다(`/api/auth/me` 가 그 자리). 미들웨어에 세션 갱신을 두지 않는 이유:
 *   페이지는 세션을 읽지 않고, 읽는 곳은 전부 라우트 핸들러라서다.
 *
 * 필요한 환경변수 (Vercel · Production/Preview 모두 · **Type=Secret**, 서버 런타임에
 * 읽으므로 재배포만으로 반영):
 *   SUPABASE_URL          (원장과 공유)
 *   SUPABASE_ANON_KEY     Project Settings → API → anon (public)
 */

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { apiKeyProblem, describeApiKey, normalizeApiKey, type ApiKeyProblem } from "./supabase-key"

const URL = process.env.SUPABASE_URL?.trim()
// ⚠ 값이 있어도 **키 모양이 아니면 꺼진 것으로** 본다 (2026-09-02, lib/supabase-key.ts 머리말):
//   대시보드의 마스킹 표시값(`eyJhbGciOiJIUzI•••…`)이 들어가면 헤더에 못 실려 요청이 나가지도 않는데,
//   `Boolean(ANON_KEY)` 만 보던 종전 판정은 이를 "켜짐"으로 읽어 하루 종일 원인을 못 찾았다.
const RAW_ANON = process.env.SUPABASE_ANON_KEY
const ANON_PROBLEM: ApiKeyProblem | null = apiKeyProblem(RAW_ANON, "anon")
const ANON_KEY = ANON_PROBLEM ? null : normalizeApiKey(RAW_ANON)
if (RAW_ANON && ANON_PROBLEM) {
  // 콜드 스타트마다 한 줄 — Vercel 런타임 로그에서 바로 보이게. 값은 찍지 않는다
  console.error(`[auth] SUPABASE_ANON_KEY 가 키 모양이 아니라 소셜 로그인을 끕니다 (${ANON_PROBLEM}: ${describeApiKey(RAW_ANON)})`)
}

/** 설정이 어디서 막혔나 — null 이면 정상.
 *  "missing" = URL 또는 키가 비어 있음 · "malformed" = 키에 헤더 불가 문자(마스킹 •·따옴표…) ·
 *  "wrongrole" = anon 자리에 service_role 키. 로그인 시작·콜백이 이 코드를 `reason` 으로 돌려보낸다 */
export function authConfigProblem(): ApiKeyProblem | null {
  if (!URL) return "missing"
  return ANON_PROBLEM
}

/** 소셜 로그인이 켜져 있는가 (URL·키가 있고 키가 키 모양인가) */
export function isAuthEnabled() {
  return authConfigProblem() === null
}

/** 콜백의 code 교환 실패를 **화면이 말할 수 있는 짧은 코드**로 (2026-09-02).
 *  Vercel 로그가 막혀 있어도(요금 한도) 로그인 화면이 원인을 말하게 — 하루를 쓴 교훈.
 *  ⚠ 순서가 중요: ByteString 오류는 AuthRetryableFetchError 로 감싸여 오므로 이름보다 메시지를 먼저 본다.
 *  코드 집합은 `[a-z0-9:_-]` 만 — 소비하는 쪽(social 라우트)이 그 밖의 값을 버린다 */
export function exchangeFailReason(
  error: { name?: string; message?: string; status?: number; code?: string } | null | undefined,
): string {
  if (!error) return "nouser"
  const msg = error.message ?? ""
  if (/ByteString|invalid header|Invalid character in header/i.test(msg)) return "key" // 환경변수 값이 헤더에 못 실림
  if (error.name === "AuthPKCECodeVerifierMissingError" || error.code === "bad_code_verifier" || /code verifier/i.test(msg)) return "verifier"
  if (error.name === "AuthRetryableFetchError") return "network"
  if (error.code === "flow_state_not_found" || error.code === "flow_state_expired" || /flow state/i.test(msg)) return "flowstate"
  return error.status ? `api:${error.status}` : "api"
}

/** 요청 쿠키에 묶인 세션 클라이언트. 요청마다 새로 만든다(공유 금지). 미설정·키 모양 오류면 null */
export async function supabaseSession(): Promise<SupabaseClient | null> {
  if (!URL || !ANON_KEY) return null
  const store = await cookies()
  return createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll() {
        return store.getAll()
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) store.set(name, value, options)
        } catch {
          // Server Component 렌더 중에는 쓸 수 없다 — 라우트 핸들러에서 갱신된다
        }
      },
    },
  })
}

/** 현재 로그인 사용자. 비로그인·미설정·토큰 무효 전부 null — 호출부는 분기만 한다.
 *  getSession() 이 아니라 getUser() — 쿠키의 토큰을 auth 서버에 대조해 위조를 거른다 */
export async function getSessionUser(): Promise<User | null> {
  const sb = await supabaseSession()
  if (!sb) return null
  const { data, error } = await sb.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

/** 라우트에서 원장에 user_id 를 찍을 때 쓰는 안전 조회 — **절대 던지지 않는다**.
 *  세션 조회가 느리거나 깨져도 접수·결제 기록이 실패하면 안 된다(비회원이 기본, R11).
 *  ⚠ 요청 스코프 밖(웹훅·배치)에서 부르면 cookies() 가 던지므로 여기서 삼킨다. */
export async function sessionUserIdSafe(): Promise<string | null> {
  try {
    const user = await getSessionUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

/** 소셜 프로필 사진 URL (2026-09-02) — Supabase 가 `avatar_url` 로 표준화하지만
 *  공급자에 따라 `picture` 로만 오는 경우가 있어 둘 다 본다.
 *  ⚠ **URL 만 들고 있는다** — 이미지를 우리 쪽에 복사하지 않는다(0014 결정 1).
 *  ⚠ 값이 없으면 null 이 정상이다: 손님이 '프로필 사진' 선택 동의를 거부해도 로그인은 성립한다. */
export function avatarUrlOf(user: User): string | null {
  const m = (user.user_metadata ?? {}) as Record<string, unknown>
  for (const k of ["avatar_url", "picture"]) {
    const v = m[k]
    // https 만 받는다 — 공급자가 주는 값이라 신뢰하지만, 화면이 그대로 <img src> 에 넣으므로
    // 스킴을 검사해 data:·javascript: 가 흘러들 여지를 없앤다
    if (typeof v === "string" && v.startsWith("https://")) return v.slice(0, 500)
  }
  return null
}

/** 소셜 프로필에서 표시 이름 하나를 고른다 — 카카오는 `name`(닉네임), 구글은 `full_name`.
 *  없으면 이메일 앞부분, 그것도 없으면 null (화면이 '회원'으로 대체) */
export function displayNameOf(user: User): string | null {
  const m = (user.user_metadata ?? {}) as Record<string, unknown>
  for (const k of ["full_name", "name", "preferred_username", "user_name"]) {
    const v = m[k]
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 40)
  }
  const local = user.email?.split("@")[0]
  return local ? local.slice(0, 40) : null
}
