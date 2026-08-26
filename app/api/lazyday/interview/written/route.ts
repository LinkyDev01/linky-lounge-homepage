import { NextRequest, NextResponse } from "next/server"
import { gasPostJson, isGasExecuted } from "@/lib/gas"

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

  // ⚠ 이 라우트는 apply 와 달리 **패스스루가 아니다** — 여기 없는 필드는 GAS 에 닿지도 않는다.
  //   새 필드를 프론트에 추가할 때 여기를 같이 고치지 않으면 조용히 유실된다.
  const { name, phone, answers, questions, trafficSrc } = body as {
    name: string
    phone: string
    answers: Record<string, string>
    questions?: Array<{ id: string; label: string; text: string; sub?: string }>
    /** 유입 출처 — 시트 '유입 출처' 열 (2026-08-26) */
    trafficSrc?: string
  }

  try {
    // GAS 간헐 404 대응 — 미실행이 확실할 때만 1회 재시도 (lib/gas.ts)
    const data = await gasPostJson(GAS_URL, { type: "written", name, phone, answers, questions, trafficSrc })
    return NextResponse.json(data)
  } catch (err) {
    if (isGasExecuted(err)) {
      console.warn("[interview/written] GAS 실행됨(응답 본문 유실) — 성공 처리")
      return NextResponse.json({ success: true })
    }
    console.error("[interview/written] GAS 호출 실패:", err)
    // 에러 시에도 success: true 반환 (UX 우선 — 사용자에게 오류 노출 방지)
    return NextResponse.json({ success: true })
  }
}
