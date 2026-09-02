import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, isAuthEnabled } from "@/lib/auth-server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { normalizePhone } from "@/lib/orders"

/**
 * 내 동의 상태 바꾸기 — `PATCH /api/lazyday/mypage/consents` (계획서 P4a 후속).
 *
 * 두 가지만 받는다:
 *   · `ageVerified: true`        만 14세 이상 확인 (법 제22조의2)
 *   · `marketingConsent: bool`   마케팅 수신 동의·철회 (R10)
 *
 * **R13 은 여기서 강제된다** — RLS 전면 거부라 정책이 없고, 세션에서 뽑은 user_id 로만 쓴다.
 * `eq("user_id", user.id)` 가 빠지면 전수 갱신이 되므로 **필터를 지우지 말 것**.
 *
 * ⚠ **`ageVerified` 는 true 만 받는다.** "만 14세 이상"은 시간이 지나 뒤집히는 사실이 아니라
 *   되돌릴 개념이 없다. false 를 허용하면 확인 기록만 지워져 CRM 의 '만 14세 미확인' 목록이
 *   흔들린다. 잘못 눌렀다면 운영자에게 문의하는 경로다(화면이 그렇게 안내한다).
 *
 * ⚠ **마케팅 철회는 회원 프로필만 지우면 부족하다.** 같은 사람이 접수할 때 남긴 동의
 *   (`applications.marketing_consent_at`)가 그대로면 철회했는데도 발송 대상에 남는다.
 *   정보주체가 "수신 철회"라고 말했을 때 지워야 하는 것은 **그 목적의 동의 전부**다.
 *   그래서 전화가 있으면 0006 의 `withdraw_marketing_consent(phone)` 도 함께 부른다
 *   (그 함수는 보유기간이 남은 행은 동의만 지우고, 이미 파기된 행은 연락처까지 비운다).
 *   전화가 없으면(자기 신고 값이라 비어 있을 수 있다) 프로필 동의만 지운다 — 그 경우
 *   접수 원장과 이을 열쇠가 없다.
 */
export async function PATCH(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" }
  if (!isAuthEnabled()) return NextResponse.json({ ok: false, error: "auth disabled" }, { status: 503, headers })

  const user = await getSessionUser()
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "본문이 JSON 이 아니에요" }, { status: 400, headers })
  }
  const b = (body ?? {}) as Record<string, unknown>

  const sb = supabaseAdmin()
  if (!sb) return NextResponse.json({ ok: false, error: "ledger disabled" }, { status: 503, headers })

  const patch: Record<string, string | null> = {}
  const now = new Date().toISOString()

  if ("ageVerified" in b) {
    if (b.ageVerified !== true) {
      return NextResponse.json({ ok: false, error: "확인은 되돌릴 수 없어요" }, { status: 400, headers })
    }
    patch.age_verified_at = now
  }
  if ("marketingConsent" in b) {
    if (typeof b.marketingConsent !== "boolean") {
      return NextResponse.json({ ok: false, error: "marketingConsent 는 true/false 예요" }, { status: 400, headers })
    }
    patch.marketing_consent_at = b.marketingConsent ? now : null
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ ok: false, error: "바꿀 항목이 없어요" }, { status: 400, headers })
  }

  // 철회라면 접수 원장 쪽 동의까지 지우기 위해 전화를 먼저 읽는다 (프로필을 고치기 전에)
  let phone: string | null = null
  if (patch.marketing_consent_at === null) {
    const { data } = await sb.from("profiles").select("phone").eq("user_id", user.id).maybeSingle()
    phone = normalizePhone(data?.phone ?? undefined)
  }

  const { error } = await sb.from("profiles").update(patch).eq("user_id", user.id)
  if (error) {
    console.error("[mypage/consents] update failed", error.message)
    return NextResponse.json({ ok: false, error: "저장하지 못했어요" }, { status: 502, headers })
  }

  // 접수 원장의 같은 목적 동의도 함께 철회 (실패해도 프로필 철회는 유지된다 — 로그만)
  let withdrawnRows = 0
  if (patch.marketing_consent_at === null && phone) {
    const { data, error: rpcErr } = await sb.rpc("withdraw_marketing_consent", { target_phone: phone })
    if (rpcErr) console.error("[mypage/consents] withdraw_marketing_consent failed", rpcErr.message)
    else withdrawnRows = typeof data === "number" ? data : 0
  }

  return NextResponse.json({ ok: true, withdrawnRows }, { headers })
}
