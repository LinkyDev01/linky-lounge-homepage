import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-server"
import { safeNext } from "@/app/api/auth/_next"

/**
 * 관리자 로그인 — 소셜 계정 + 허용 이메일 (2026-09-02, 사람별 식별 · R13).
 *
 * 흐름: 로그인 페이지의 '카카오/구글로 로그인' → `/api/auth/signin/<provider>?next=/api/lazyday/admin/auth/social?redirect=…`
 *       → 소셜 콜백이 세션 쿠키를 심고 여기로 → 세션의 이메일이 **ADMIN_EMAILS** 에 있으면 관리자 쿠키 발급.
 *
 * 왜 이렇게: 종전 관리자 로그인은 두 사람이 **비밀번호 하나**를 나눠 썼고 쿠키만으로는 누가 봤는지
 * 구분할 수 없었다(R13 미이행, DECISIONS 2026-09-01). 이제 관리자 = "허용 목록에 있는 이메일로
 * 소셜 로그인한 사람"이고, 누구인지는 `lazyday_admin_who` 쿠키(httpOnly)로 라우트가 안다.
 *
 * ⚠ 관리자 쿠키 값(`lazyday_admin` = ADMIN_SECRET)은 종전과 같다 — 미들웨어·관리 라우트 5곳이 그 값을
 *   비교하므로 이번엔 발급 경로만 바꾼다. 값 자체를 사람별 서명 토큰으로 바꾸는 건 후속.
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
  const deny = (why: string) => to(`/admin/login?denied=${why}&redirect=${encodeURIComponent(redirect)}`)

  if (!SECRET) return deny("unconfigured")
  const user = await getSessionUser()
  if (!user) return deny("nosession")
  const email = (user.email ?? "").toLowerCase()
  if (!email || !ALLOW.includes(email)) {
    console.warn("[admin/auth/social] 허용 목록 밖 이메일 로그인 시도")
    return deny("notallowed")
  }

  const res = to(redirect === "/" ? "/admin" : redirect)
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 7, path: "/" }
  res.cookies.set("lazyday_admin", SECRET, opts)
  res.cookies.set("lazyday_admin_who", email, opts) // R13 — 누가 봤는가. 관리 라우트가 로그에 쓴다
  return res
}
