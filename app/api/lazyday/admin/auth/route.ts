import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  // 앞뒤 공백·줄바꿈 방어 — 쿠키 발급/검증/GAS 전달 세 곳이 같은 값을 써야 한다
  // (middleware.ts·admin/blocks/route.ts와 동일 규칙, 2026-07-29)
  const secret = process.env.ADMIN_SECRET?.trim()

  if (!secret || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "비밀번호가 틀렸습니다." }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set("lazyday_admin", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set("lazyday_admin", "", { maxAge: 0, path: "/" })
  return res
}
