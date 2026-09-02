import { NextResponse } from "next/server"
import { getSessionUser, isAuthEnabled } from "@/lib/auth-server"
import { supabaseAdmin } from "@/lib/supabase-server"

/**
 * 내 세션 — `GET /api/auth/me` (계획서 P4a-3, **필수**: Shell·checkout 이 "use client").
 *
 * 응답 모양 (전부 non-null 필드 — 화면이 분기만 하게):
 *   { enabled: false, loggedIn: false }                       — 소셜 로그인 미설정 (버튼을 그리지 않는다)
 *   { enabled: true,  loggedIn: false }                       — 비로그인
 *   { enabled: true,  loggedIn: true, displayName, phone,
 *     ageVerified, marketingConsent }                         — 로그인 (profiles 는 service_role 로, 자기 행만)
 *
 * 토큰 갱신이 필요하면 @supabase/ssr 가 이 응답에 새 쿠키를 쓴다 — 페이지가 아니라
 * 이 라우트가 세션 갱신 지점이다 (lib/auth-server.ts 머리말).
 * 개인정보를 돌려주므로 캐시 금지.
 */
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" }
  if (!isAuthEnabled()) {
    return NextResponse.json({ enabled: false, loggedIn: false }, { headers })
  }
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ enabled: true, loggedIn: false }, { headers })

  let displayName: string | null = null
  let phone: string | null = null
  let ageVerified = false
  let marketingConsent = false
  const admin = supabaseAdmin()
  if (admin) {
    const { data, error } = await admin
      .from("profiles")
      .select("display_name, phone, age_verified_at, marketing_consent_at")
      .eq("user_id", user.id)
      .maybeSingle()
    if (error) console.error("[auth/me] profiles read failed", error.message)
    else if (data) {
      displayName = data.display_name ?? null
      phone = data.phone ?? null
      ageVerified = Boolean(data.age_verified_at)
      marketingConsent = Boolean(data.marketing_consent_at)
    }
  }
  return NextResponse.json(
    { enabled: true, loggedIn: true, displayName, phone, ageVerified, marketingConsent },
    { headers },
  )
}
