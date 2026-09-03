import { NextRequest, NextResponse } from "next/server"
import { authConfigProblem, avatarUrlOf, displayNameOf, exchangeFailReason, supabaseSession } from "@/lib/auth-server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { safeNext, withLoginFlag, AUTH_NEXT_COOKIE, authNextCookieOptions } from "../_next"

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
  // 돌아갈 경로는 **쿠키**가 정본이다 (2026-09-02) — redirectTo 에 쿼리를 붙이면 Supabase 의
  // Redirect URLs 허용 목록과 어긋나 Site URL 로 튕기기 때문이다(_next.ts 주석).
  // ⚠ `?next=` 도 아직 읽는다: 이 배포 직전에 시작된 로그인이 옛 형식으로 돌아올 수 있다.
  const next = safeNext(req.cookies.get(AUTH_NEXT_COOKIE)?.value ?? sp.get("next"))
  // 실패는 **사유 코드**를 달아 돌려보낸다 (2026-09-02) — 종전엔 `login=failed` 한 마디라 Vercel 로그 없이는
  // 환경변수 오류·PKCE 쿠키 없음·만료된 code 를 구분할 수 없었고, 로그가 막힌 날 하루를 썼다.
  const back = (flag?: "failed", reason?: string) => {
    const res = NextResponse.redirect(new URL(flag ? withLoginFlag(next, flag, reason) : next, req.nextUrl.origin), 302)
    res.cookies.set(AUTH_NEXT_COOKIE, "", { ...authNextCookieOptions, maxAge: 0 }) // 다 썼으면 지운다
    return res
  }

  const code = sp.get("code")
  if (!code || sp.get("error")) {
    // Supabase 가 **공급자 단계**에서 실패하면 code 없이 `error=server_error&error_description=Unable to exchange
    // external code…` 로 돌려보낸다 — 원인(invalid_client 등)은 Supabase auth 로그에만 있다. 손님이 동의 화면에서
    // 취소한 것(access_denied)과 갈라 말해야 운영자가 Supabase 공급자 설정(Client Secret)을 의심할 수 있다
    // (2026-09-03 카카오 — "거절했어요(동의 취소 등)" 한 마디에 "카카오 된다"로 읽혔다).
    const err = sp.get("error")
    const desc = sp.get("error_description") ?? ""
    console.warn("[auth/callback] no code", err, sp.get("error_code"), desc)
    const reason = !err ? "nocode" : err === "access_denied" ? "cancelled" : /exchange external code/i.test(desc) ? "providerconfig" : "provider"
    return back("failed", reason)
  }
  const sb = await supabaseSession()
  if (!sb) return back("failed", authConfigProblem() ?? "disabled")

  const { data, error } = await sb.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    const reason = exchangeFailReason(error)
    console.error("[auth/callback] exchange failed", reason, error?.message)
    return back("failed", reason)
  }

  const user = data.user
  const admin = supabaseAdmin()
  if (admin) {
    // 첫 로그인: 행 생성 (있으면 건드리지 않음).
    // 이후: **정본이 우리 밖에 있는 값만** 맞춘다 — 이메일은 auth, 프로필 사진은 소셜.
    // 표시 이름은 본인이 고칠 수 있는 필드라 재로그인이 소셜 값으로 덮지 않는다.
    const { error: insErr } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          email: user.email ?? null,
          display_name: displayNameOf(user),
          avatar_url: avatarUrlOf(user), // 0014 — URL 만 담는다(파일을 복사하지 않는다)
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      )
    if (insErr) console.error("[auth/callback] profiles insert failed", insErr.message)
    else {
      // ⚠ 값이 같으면 쓰지 않는다 — 매 로그인마다 updated_at 을 흔들지 않기 위해
      //   (CRM-2 의 시트 미러와 같은 규율). 두 컬럼을 따로 neq 로 걸면 AND 가 되어
      //   한쪽만 바뀐 경우를 놓치므로, 한 번 읽어 비교하고 달라진 것만 보낸다.
      const { data: row } = await admin.from("profiles").select("email, avatar_url").eq("user_id", user.id).maybeSingle()
      const email = user.email ?? null
      const avatar = avatarUrlOf(user)
      const patch: Record<string, string | null> = {}
      if (row && row.email !== email) patch.email = email
      // 동의를 철회해 사진이 없어지면 우리 쪽에서도 지운다(null 로 맞춘다)
      if (row && row.avatar_url !== avatar) patch.avatar_url = avatar
      if (Object.keys(patch).length) {
        const { error: updErr } = await admin.from("profiles").update(patch).eq("user_id", user.id)
        if (updErr) console.error("[auth/callback] profiles sync failed", updErr.message)
      }
    }
  } else {
    console.warn("[auth/callback] ledger disabled — profiles row not written", user.id)
  }
  return back()
}
