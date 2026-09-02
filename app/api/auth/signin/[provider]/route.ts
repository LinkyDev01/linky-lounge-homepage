import { NextRequest, NextResponse } from "next/server"
import { isAuthEnabled, supabaseSession } from "@/lib/auth-server"
import { safeNext } from "../../_next"

/**
 * 소셜 로그인 시작 — `GET /api/auth/signin/kakao?next=/lazyclub/all` (계획서 P4a-3).
 *
 * PKCE: 여기서 code_verifier 쿠키를 심고 공급자 동의 화면으로 302, 돌아오는 곳은
 * `/api/auth/callback` (같은 오리진 — 도메인마다 세션이 따로라 오리진을 요청에서 뽑는다).
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
  if (!isAuthEnabled()) {
    return NextResponse.json({ ok: false, error: "auth disabled" }, { status: 503 })
  }
  const next = safeNext(req.nextUrl.searchParams.get("next"))
  const redirectTo = new URL("/api/auth/callback", req.nextUrl.origin)
  redirectTo.searchParams.set("next", next)

  const sb = await supabaseSession()
  if (!sb) return NextResponse.json({ ok: false, error: "auth disabled" }, { status: 503 })
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: provider as "kakao" | "google",
    options: { redirectTo: redirectTo.toString() },
  })
  if (error || !data.url) {
    console.error("[auth/signin] signInWithOAuth failed", provider, error?.message)
    return NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}login=failed`, req.nextUrl.origin), 302)
  }
  return NextResponse.redirect(data.url, 302)
}
