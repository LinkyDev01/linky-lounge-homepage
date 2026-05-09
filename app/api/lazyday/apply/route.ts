import { NextRequest, NextResponse } from "next/server"

const GAS_URL = process.env.INTERVIEW_GAS_URL
const IS_DEV  = process.env.NODE_ENV === "development"

export async function POST(req: NextRequest) {
  if (!GAS_URL) {
    if (IS_DEV) {
      const body = await req.json().catch(() => ({}))
      console.log("[lazyday/apply] 개발 목업 모드:", body)
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
    return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
  }

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`GAS ${res.status}`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[lazyday/apply] GAS 호출 실패:", err)
    // UX 우선 — 사용자에게 오류 노출 방지
    return NextResponse.json({ success: true })
  }
}
