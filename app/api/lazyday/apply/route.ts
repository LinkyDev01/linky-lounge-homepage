import { NextRequest, NextResponse } from "next/server"
import { gasPostJson, isGasExecuted } from "@/lib/gas"

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
    // GAS 간헐 404 대응 — 미실행이 확실할 때만 1회 재시도 (lib/gas.ts)
    await gasPostJson(GAS_URL, body)
    return NextResponse.json({ success: true })
  } catch (err) {
    // 302를 받았다면 시트 기록·메일은 이미 끝난 상태 — 본문만 못 받은 것이라
    // 사용자에게 실패를 알리면 중복 제출을 유도하게 된다 (2026-08-05)
    if (isGasExecuted(err)) {
      console.warn("[lazyday/apply] GAS 실행됨(응답 본문 유실) — 성공 처리")
      return NextResponse.json({ success: true })
    }
    console.error("[lazyday/apply] GAS 호출 실패:", err)
    // 저장이 안 됐는데 성공으로 응답하면 신청이 유실됨 — 실패를 그대로 알린다
    return NextResponse.json(
      { success: false, error: "신청 접수에 실패했습니다." },
      { status: 502 }
    )
  }
}
