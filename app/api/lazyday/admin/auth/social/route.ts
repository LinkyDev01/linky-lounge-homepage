import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-server"
import { safeNext } from "@/app/api/auth/_next"
import { ADMIN_COOKIE, LEGACY_WHO_COOKIE, adminCookieOptions, signAdminToken } from "@/lib/admin-session"

/**
 * 관리자 로그인 — 소셜 계정 + 허용 이메일 (2026-09-02, 사람별 식별 · R13).
 *
 * 흐름: 로그인 페이지의 '카카오/구글로 로그인' → `/api/auth/signin/<provider>?next=/api/lazyday/admin/auth/social?redirect=…`
 *       → 소셜 콜백이 세션 쿠키를 심고 여기로 → 세션의 이메일이 **ADMIN_EMAILS** 에 있으면 관리자 쿠키 발급.
 *
 * 왜 이렇게: 종전 관리자 로그인은 두 사람이 **비밀번호 하나**를 나눠 썼고 쿠키만으로는 누가 봤는지
 * 구분할 수 없었다(R13 미이행, DECISIONS 2026-09-01). 이제 관리자 = "허용 목록에 있는 이메일로
 * 소셜 로그인한 사람"이고, 누구인지는 **서명 토큰 안의 who**(lib/admin-session, 2026-09-02)로 라우트가 안다.
 *   (같은 날 앞선 버전은 `lazyday_admin_who` 별도 쿠키에 실었는데 서명이 없어 바꿔 끼울 수 있었다 — 폐지.)
 * ⚠ `ADMIN_EMAILS` (Vercel env, Secret): 쉼표로 구분한 이메일. 비어 있으면 소셜 로그인은 항상 거절 —
 *   비밀번호 경로(`ADMIN_PASSWORD` 가 있는 동안만)로 들어갈 수 있다.
 * ⚠ 이 라우트는 관리 호스트(admin.lazy-club.com)에서 돈다 — Supabase Redirect URLs 에
 *   `https://admin.lazy-club.com/api/auth/callback` 이 있어야 콜백이 이 호스트로 돌아온다.
 */

const SECRET = process.env.ADMIN_SECRET?.trim()
const ALLOW = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)

export async function GET(req: NextRequest) {
  const redirect = safeNext(req.nextUrl.searchParams.get("redirect") || "/admin")
  const to = (path: string) => NextResponse.redirect(new URL(path, req.nextUrl.origin), 302)
  // reason = 콜백·시작 라우트가 단 실패 사유 코드(lib/auth-server.ts) — 화면이 풀어 말한다. 모양 밖의 값은 버린다
  const REASON_RE = /^[a-z0-9:_-]{1,32}$/
  const deny = (why: string, reason?: string | null) =>
    to(`/admin/login?denied=${why}${reason && REASON_RE.test(reason) ? `&reason=${reason}` : ""}&redirect=${encodeURIComponent(redirect)}`)

  if (!SECRET) return deny("unconfigured")
  const user = await getSessionUser()
  if (!user) {
    // ⚠ 세션이 없는 이유는 셋인데 종전에는 전부 'nosession' 한 마디로 뭉개졌다 —
    //   화면만 보고는 어디가 끊겼는지 알 수 없어 진단에 라운드를 쓴다. 갈라서 말한다.
    //   ① exchange — 콜백(또는 시작 라우트)이 실패해 `login=failed&reason=…` 을 달고 왔다
    //      (reason: malformed·missing = 환경변수 / verifier = PKCE 쿠키 없음 / flowstate = 만료·재사용된 code /
    //       network·key = 서버가 Supabase 에 못 붙음 / provider·nocode = 소셜 쪽이 code 없이 돌려보냄)
    //   ② nocookie — 세션 쿠키가 아예 없다 (브라우저가 저장하지 못했거나 호스트가 다르다)
    //   ③ nosession — 쿠키는 있는데 auth 서버가 무효라고 답했다 (만료·위조)
    const exchangeFailed = req.nextUrl.searchParams.get("login") === "failed"
    const reason = exchangeFailed ? req.nextUrl.searchParams.get("reason") : null
    const hasSessionCookie = req.cookies.getAll().some((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name))
    const why = exchangeFailed ? "exchange" : hasSessionCookie ? "nosession" : "nocookie"
    console.warn(`[admin/auth/social] 세션 없음 (${why}${reason ? "/" + reason : ""})`)
    return deny(why, reason)
  }
  const email = (user.email ?? "").toLowerCase()
  if (!email || !ALLOW.includes(email)) {
    // ⚠ 허용 목록이 비어 있는 것과 목록 밖 계정인 것은 원인이 다르다 — 갈라서 말한다
    //   (env 미설정이면 아무리 맞는 계정으로 눌러도 통과할 수 없다)
    console.warn(`[admin/auth/social] 거절 — ALLOW ${ALLOW.length}건, 이메일 ${email ? "있음" : "없음"}`)
    return deny(ALLOW.length === 0 ? "noallowlist" : !email ? "noemail" : "notallowed")
  }

  const res = to(redirect === "/" ? "/admin" : redirect)
  // R13 — 누가 봤는가: who(이메일)가 서명된 토큰 안에 실린다. 관리 라우트는 adminWho() 로 읽는다
  res.cookies.set(ADMIN_COOKIE, await signAdminToken(email), adminCookieOptions())
  res.cookies.set(LEGACY_WHO_COOKIE, "", { maxAge: 0, path: "/" }) // 옛 쿠키 청소
  return res
}
