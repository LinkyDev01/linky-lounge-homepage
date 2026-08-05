import { NextResponse } from "next/server"
import { gasGetJson } from "@/lib/gas"

const GAS_URL = process.env.INTERVIEW_GAS_URL

export async function GET() {
  if (!GAS_URL) {
    // 개발 목업: 특정 슬롯을 예약됨으로 표시해서 UI 확인 가능
    const mockBooked: { start: string; end: string }[] = [
      // 오늘 기준으로 가까운 날짜의 슬롯 하나를 예약됨 처리
      // 실제 배포 시엔 GAS_URL 설정으로 자동 전환됨
    ]
    return NextResponse.json({ success: true, bookedSlots: mockBooked })
  }

  try {
    // 조회는 부작용이 없어 자유롭게 재시도 (GAS 간헐 404·HTML 응답 대응)
    const data = await gasGetJson(GAS_URL, 3, 7_000, 10_000, 60) // 60초 캐시 복원
    return NextResponse.json(data)
  } catch (err) {
    console.error("[interview/slots] GAS 호출 실패:", err)
    // 에러 시에도 빈 슬롯 반환 (페이지가 깨지지 않도록)
    return NextResponse.json({ success: true, bookedSlots: [] })
  }
}
