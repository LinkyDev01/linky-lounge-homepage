import { NextRequest, NextResponse } from "next/server"
import { authConfigProblem, supabaseSession } from "@/lib/auth-server"
import { safeNext, withLoginFlag, AUTH_NEXT_COOKIE, authNextCookieOptions } from "../../_next"

/**
 * 소셜 로그인 시작 — `GET /api/auth/signin/kakao?next=/lazyclub/all` (계획서 P4a-3).
 *
 * PKCE: 여기서 code_verifier 쿠키를 심고 공급자 동의 화면으로 302, 돌아오는 곳은
 * `/api/auth/callback` (같은 오리진 — 도메인마다 세션이 따로라 오리진을 요청에서 뽑는다).
 * 돌아갈 경로(`next`)도 **쿠키로** 넘긴다 — redirectTo 에 쿼리를 붙이면 Supabase 의
 * Redirect URLs 허용 목록과 어긋나 Site URL 로 튕긴다 (_next.ts 주석).
 * ⚠ 이 redirectTo 는 Supabase 대시보드 Authentication → URL Configuration →
 *   **Redirect URLs** 에 등록돼 있어야 한다. 등록되지 않은 오리진이면 Supabase 가
 *   Site URL 로 돌려보내 로그인이 엉뚱한 도메인에서 끝난다 — 운영자 설정 항목.
 *
 * 링크는 plain `<a>` 로 걸 것 — `LazyclubLink` 는 `/lazyday` 베이스를 붙여
 * 브랜치 프리뷰에서 없는 경로가 된다 (계획서 P4a-4).
 */
const PROVIDERS = new Set(["kakao", "google"])

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params
  if (!PROVIDERS.has(provider)) {
    return NextResponse.json({ ok: false, error: "unknown provider" }, { status: 404 })
  }
  const next = safeNext(req.nextUrl.searchParams.get("next"))
  // 실패는 돌아갈 곳으로 **사유를 달아** 보낸다 (2026-09-02) — 종전의 503 JSON 은 링크를 누른 사람이
  // 날 JSON 을 보는 모양이었고, 미설정과 키 모양 오류(마스킹 •)를 구분하지 못했다.
  const fail = (reason: string) => NextResponse.redirect(new URL(withLoginFlag(next, "failed", reason), req.nextUrl.origin), 302)
  const problem = authConfigProblem()
  if (problem) return fail(problem)
  // ⚠ 쿼리를 붙이지 않는다 — Supabase 의 Redirect URLs 는 쿼리를 포함한 URL 전체를 비교하므로
  //   `?next=` 가 붙으면 등록값과 어긋나 Site URL 로 튕긴다. 돌아갈 곳은 쿠키로 넘긴다(_next.ts).
  const redirectTo = new URL("/api/auth/callback", req.nextUrl.origin)

  const sb = await supabaseSession()
  if (!sb) return fail("disabled")
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: provider as "kakao" | "google",
    options: { redirectTo: redirectTo.toString() },
  })
  if (error || !data.url) {
    console.error("[auth/signin] signInWithOAuth failed", provider, error?.message)
    return fail("start")
  }
  const res = NextResponse.redirect(data.url, 302)
  res.cookies.set(AUTH_NEXT_COOKIE, next, authNextCookieOptions)
  return res
}
