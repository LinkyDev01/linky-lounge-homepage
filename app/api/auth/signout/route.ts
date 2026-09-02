import { NextResponse } from "next/server"
import { supabaseSession } from "@/lib/auth-server"

/**
 * 로그아웃 — `POST /api/auth/signout` (계획서 P4a-3). GET 은 받지 않는다:
 * 링크 하나로 남을 로그아웃시킬 수 있는 모양(CSRF)을 두지 않기 위해. 화면은
 * fetch(POST) 뒤 새로고침한다.
 * scope "local" — 이 브라우저(이 도메인)의 세션만. 도메인마다 세션이 따로라
 * 다른 도메인 로그인은 그대로다 — 전부 끊고 싶으면 "global".
 */
export async function POST() {
  const sb = await supabaseSession()
  if (sb) {
    const { error } = await sb.auth.signOut({ scope: "local" })
    if (error) console.warn("[auth/signout]", error.message)
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } })
}
