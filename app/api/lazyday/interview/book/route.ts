import { NextRequest, NextResponse } from "next/server"

const GAS_URL = process.env.INTERVIEW_GAS_URL
const IS_DEV  = process.env.NODE_ENV === "development"

export async function POST(req: NextRequest) {
  if (!GAS_URL) {
    if (IS_DEV) {
      // 개발 환경: GAS 없이도 성공 응답 반환 (UI 흐름 테스트용)
      console.log("[interview/book] 개발 목업 모드 — GAS 호출 생략")
      const body = await req.json().catch(() => ({}))
      console.log("[interview/book] 예약 데이터:", body)
      return NextResponse.json({ success: true })
    }
    return NextResponse.json(
      { success: false, error: "서버 설정 오류 (GAS URL 미설정)" },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: "잘못된 요청입니다." },
      { status: 400 }
    )
  }

  const { name, phone, slotStart, slotEnd } = body as Record<string, string>

  if (!name || !phone || !slotStart || !slotEnd) {
    return NextResponse.json(
      { success: false, error: "필수 항목이 누락되었습니다." },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, slotStart, slotEnd }),
    })

    if (!res.ok) {
      throw new Error(`GAS responded with ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[interview/book] GAS 호출 실패:", err)
    return NextResponse.json(
      { success: false, error: "예약 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    )
  }
}
