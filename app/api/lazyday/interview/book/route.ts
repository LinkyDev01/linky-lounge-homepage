import { NextRequest, NextResponse } from "next/server"
import { gasPostJson, isGasExecuted } from "@/lib/gas"

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

  // ⚠ 패스스루가 아니다 — 여기 없는 필드는 GAS 에 닿지 않는다 (새 필드 추가 시 함께 수정)
  const { name, phone, slotStart, slotEnd, trafficSrc } = body as Record<string, string>

  if (!name || !phone || !slotStart || !slotEnd) {
    return NextResponse.json(
      { success: false, error: "필수 항목이 누락되었습니다." },
      { status: 400 }
    )
  }

  try {
    // GAS 간헐 404 대응 — 미실행이 확실할 때만 1회 재시도 (lib/gas.ts)
    const data = await gasPostJson(GAS_URL, { type: "phone_interview", name, phone, slotStart, slotEnd, trafficSrc })
    return NextResponse.json(data)
  } catch (err) {
    // 302 수신 = 캘린더 등록까지 완료 — 본문 유실을 실패로 알리면 중복 예약을 부른다
    if (isGasExecuted(err)) {
      console.warn("[interview/book] GAS 실행됨(응답 본문 유실) — 성공 처리")
      return NextResponse.json({ success: true })
    }
    console.error("[interview/book] GAS 호출 실패:", err)
    return NextResponse.json(
      { success: false, error: "예약 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    )
  }
}
