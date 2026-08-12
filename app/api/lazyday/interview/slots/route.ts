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
    // 시그니처: (url, attempts, timeoutMs, revalidateSec, totalBudgetMs) — 캐시 60초 · 예산 10초
    const data = await gasGetJson(GAS_URL, 3, 7_000, 60, 10_000)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[interview/slots] GAS 호출 실패:", err)
    // 실패를 성공(빈 배열)으로 위장하면 마감 슬롯이 전부 빈 것처럼 그려진다
    // — 클라이언트가 재시도/안내로 처리하도록 정직하게 실패를 반환 (2026-08-12)
    return NextResponse.json({ success: false, bookedSlots: [] }, { status: 502 })
  }
}
