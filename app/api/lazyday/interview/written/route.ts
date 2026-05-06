import { NextRequest, NextResponse } from "next/server"

// 서면 인터뷰는 캘린더 예약 GAS와 동일한 엔드포인트를 공유합니다.
// GAS 측에서 { type: "written" } 필드를 보고 분기 처리합니다.
const GAS_URL = process.env.INTERVIEW_GAS_URL
const IS_DEV  = process.env.NODE_ENV === "development"

export async function POST(req: NextRequest) {
  if (!GAS_URL) {
    if (IS_DEV) {
      console.log("[interview/written] 개발 목업 모드 — GAS 호출 생략")
      const body = await req.json().catch(() => ({}))
      console.log("[interview/written] 서면 인터뷰 데이터:", body)
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

  const { name, phone, answers } = body as {
    name: string
    phone: string
    answers: Record<string, string>
  }

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "written", name, phone, answers }),
    })

    if (!res.ok) {
      throw new Error(`GAS responded with ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[interview/written] GAS 호출 실패:", err)
    // 에러 시에도 success: true 반환 (UX 우선 — 사용자에게 오류 노출 방지)
    return NextResponse.json({ success: true })
  }
}
