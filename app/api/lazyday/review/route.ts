import { NextRequest, NextResponse } from "next/server"
import { gasPostJson, isGasExecuted } from "@/lib/gas"
import { recordSafe, GAS_FAILED_NOTE } from "@/lib/applications"

/**
 * 후기 접수. ⚠ 다른 접수와 **GAS 프로젝트가 다르다** — `REVIEW_GAS_URL`(gas/review.gs)이고
 * `gas/project.json` 매핑에 없어 **자동 배포 대상이 아니다**. 그래서 P2.5 시트 스윕의
 * 범위 밖이고, 여기 DB 기록이 유일한 이중화다(영구결손 금지가 후기에는 이 라우트로만 성립).
 */
const GAS_URL = process.env.REVIEW_GAS_URL
const IS_DEV  = process.env.NODE_ENV === "development"

export async function POST(req: NextRequest) {
  if (!GAS_URL) {
    if (IS_DEV) {
      const body = await req.json().catch(() => ({}))
      console.log("[lazyday/review] 개발 목업 모드:", body)
      await recordSafe("review", { body, sid: crypto.randomUUID() })
      return NextResponse.json({ success: true })
    }
    return NextResponse.json(
      { success: false, error: "서버 설정 오류 (GAS URL 미설정)" },
      { status: 500 }
    )
  }

  // Record 로 받는다 — 원장 기록(payload 원문 스냅샷)이 객체를 요구한다
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
  }

  const sid = crypto.randomUUID()

  try {
    // ⚠ 종전에는 원시 `fetch(redirect:"follow")` 로 부르고 본문을 **파싱조차 하지 않았다**.
    //   그래서 ① GAS 가 `{success:false}` 로 거절해도 알 수 없었고 ② Apps Script 의
    //   "302 뒤 결과 URL 이 잠깐 404" 함정(2026-08-05)을 실패로 오인할 수밖에 없었다.
    //   실패를 사실대로 알리려면 그 둘을 구분해야 하므로 gasPostJson 으로 옮긴다 —
    //   재전송하지 않고 결과 URL만 다시 조회하므로 중복 접수를 만들지 않는다.
    const data = await gasPostJson(GAS_URL, { ...body, sid })
    await recordSafe("review", { body, sid, gasData: data })
    return NextResponse.json(data)
  } catch (err) {
    if (isGasExecuted(err)) {
      console.warn("[lazyday/review] GAS 실행됨(응답 본문 유실) — 성공 처리")
      await recordSafe("review", { body, sid, gasBodyLost: true })
      return NextResponse.json({ success: true })
    }
    console.error("[lazyday/review] GAS 호출 실패:", err)
    // ⚠ 종전에는 여기서 `{success:true}` 를 돌려줘 후기가 조용히 사라졌다.
    //   기록 먼저(DB 가 유일한 흔적), 응답 나중(사실대로).
    await recordSafe("review", { body, sid, statusNote: GAS_FAILED_NOTE })
    return NextResponse.json(
      { success: false, error: "제출 중 오류가 발생했어요. 다시 시도해 주세요." },
      { status: 502 }
    )
  }
}
