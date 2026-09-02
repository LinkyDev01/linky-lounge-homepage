import { NextRequest, NextResponse } from "next/server"
import { displayNameOf, supabaseSession } from "@/lib/auth-server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { safeNext, withLoginFlag } from "../_next"

/**
 * 소셜 로그인 복귀 — 공급자 → Supabase → 여기 (계획서 P4a-3).
 *
 * 1. `code` 를 세션으로 교환 (PKCE — signin 이 심은 code_verifier 쿠키와 대조).
 *    성공하면 @supabase/ssr 가 세션 쿠키를 이 응답에 쓴다 (host-only — 도메인마다 따로).
 * 2. **profiles upsert 는 service_role** 로 — RLS 전면 거부라 세션 클라이언트로는
 *    한 줄도 못 쓴다. 표시 이름은 **첫 로그인에만** 채운다(이후 본인이 고친 값을
 *    소셜 프로필로 덮어쓰지 않는다). 이메일은 auth 정본 사본이라 매번 맞춘다.
 *    원장이 꺼져 있으면(service_role 미설정) 로그인은 되고 회원 행만 없다 —
 *    `/api/auth/me` 가 이름 없이 답한다. 로그인을 실패시키지 않는다.
 * 3. `next` 로 302. 실패는 `?login=failed` 를 붙여 같은 곳으로 — 화면이 한 줄 알린다.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const next = safeNext(sp.get("next"))
  const back = (flag?: "failed") =>
    NextResponse.redirect(new URL(flag ? withLoginFlag(next, flag) : next, req.nextUrl.origin), 302)

  const code = sp.get("code")
  if (!code || sp.get("error")) {
    console.warn("[auth/callback] no code", sp.get("error"), sp.get("error_description"))
    return back("failed")
  }
  const sb = await supabaseSession()
  if (!sb) return back("failed")

  const { data, error } = await sb.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    console.error("[auth/callback] exchange failed", error?.message)
    return back("failed")
  }

  const user = data.user
  const admin = supabaseAdmin()
  if (admin) {
    // 첫 로그인: 행 생성 (있으면 건드리지 않음). 이후: 이메일만 auth 와 맞춘다
    const { error: insErr } = await admin
      .from("profiles")
      .upsert(
        { user_id: user.id, email: user.email ?? null, display_name: displayNameOf(user) },
        { onConflict: "user_id", ignoreDuplicates: true },
      )
    if (insErr) console.error("[auth/callback] profiles insert failed", insErr.message)
    else if (user.email) {
      const { error: updErr } = await admin
        .from("profiles")
        .update({ email: user.email })
        .eq("user_id", user.id)
        .neq("email", user.email)
      if (updErr) console.error("[auth/callback] profiles email sync failed", updErr.message)
    }
  } else {
    console.warn("[auth/callback] ledger disabled — profiles row not written", user.id)
  }
  return back()
}
