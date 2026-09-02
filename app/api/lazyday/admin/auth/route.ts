import { NextRequest, NextResponse } from "next/server"
import { ADMIN_COOKIE, LEGACY_WHO_COOKIE, adminCookieOptions, signAdminToken } from "@/lib/admin-session"

/**
 * 관리자 로그인 — 비밀번호 경로 (구 경로, `ADMIN_PASSWORD` env 가 있는 동안만 산다).
 * 사람별 식별이 붙는 정식 경로는 `auth/social`(소셜 계정 + `ADMIN_EMAILS`, 2026-09-02).
 *
 * ⚠ **`ADMIN_PASSWORD` 를 지우면 이 경로는 조용히 죽어야 한다(401).** 종전 판정은
 *   `password !== process.env.ADMIN_PASSWORD` 하나였는데, env 를 지우면 오른쪽이 `undefined` 가 되고
 *   본문 없이 `{}` 를 보낸 요청의 `password` 도 `undefined` 라 **비교가 참이 되어 쿠키가 발급됐다**.
 *   즉 "확인 뒤 ADMIN_PASSWORD 삭제"라는 마지막 정리 단계가 그대로 관리 콘솔 전면 공개가 됐다
 *   (2026-09-02 발견, 프로덕션은 env 가 살아 있어 실피해 없음). 아래 세 조건이 그 구멍을 막는다.
 *
 * 쿠키 값은 서명 토큰(lib/admin-session, 2026-09-02) — 시크릿 원문을 더는 브라우저에 주지 않는다.
 * 비밀번호로 들어온 사람은 누구인지 알 수 없어 who = "password".
 */

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  // 앞뒤 공백·줄바꿈 방어 — 서명 시크릿·GAS 전달이 같은 값을 써야 한다 (middleware·blocks 와 동일 규칙, 2026-07-29)
  const secret = process.env.ADMIN_SECRET?.trim()
  // 비밀번호 자체는 trim 하지 않는다 — 운영자가 정한 값을 그대로 비교한다.
  // 다만 env 가 없거나 공백뿐이면 '설정되지 않음'으로 보고 이 경로를 닫는다.
  const expected = process.env.ADMIN_PASSWORD
  const passwordPathEnabled = Boolean(expected && expected.trim())

  if (!secret || !passwordPathEnabled || typeof password !== "string" || password !== expected) {
    return NextResponse.json({ success: false, error: "비밀번호가 틀렸습니다." }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_COOKIE, await signAdminToken("password"), adminCookieOptions())
  // 옛 who 쿠키는 더 쓰지 않는다 — 남아 있으면 청소 (who 는 토큰 안에 있다)
  res.cookies.set(LEGACY_WHO_COOKIE, "", { maxAge: 0, path: "/" })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" })
  res.cookies.set(LEGACY_WHO_COOKIE, "", { maxAge: 0, path: "/" })
  return res
}
