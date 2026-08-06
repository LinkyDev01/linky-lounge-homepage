import { NextRequest, NextResponse } from "next/server"

/**
 * 클라이언트 장애 신고 수신 (2026-08-06).
 * 신청자가 제출/조회 실패를 겪은 순간을 서버 로그에 남겨, 운영자가
 * Vercel 런타임 에러에서 바로 확인할 수 있게 한다.
 * (개인정보는 받지 않는다 — 어디서·무엇이 실패했는지만)
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false }, { status: 400 })
  }
  const where = String(body.where ?? "unknown").slice(0, 40)
  const detail = String(body.detail ?? "").slice(0, 200)
  // console.error로 남겨야 Vercel '런타임 에러'에 집계된다
  console.error(`[client-error] ${where} — ${detail}`)
  return NextResponse.json({ success: true })
}
