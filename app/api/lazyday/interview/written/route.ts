import { NextRequest, NextResponse } from "next/server"
import { gasPostJson, isGasExecuted } from "@/lib/gas"
import { recordSafe, writtenDedupKey, GAS_FAILED_NOTE } from "@/lib/applications"

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
      await recordSafe("interview_written", {
        body,
        sid: crypto.randomUUID(),
        dedupKey: writtenDedupKey(typeof body?.phone === "string" ? body.phone : undefined),
      })
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

  const sid = crypto.randomUUID()
  // 재제출을 같은 행으로 모은다. ⚠ 9자리 미만 번호는 null 이 된다 — 가드가 없으면
  //   "written:null" 로 뭉쳐 비정상 번호 접수가 서로를 덮어쓴다 (lib/applications 주석)
  const dedupKey = writtenDedupKey(phone)

  try {
    // GAS 간헐 404 대응 — 미실행이 확실할 때만 1회 재시도 (lib/gas.ts)
    const data = await gasPostJson(GAS_URL, { type: "written", name, phone, answers, questions, trafficSrc, sid })
    // 거절({success:false})이면 그대로 전달한다 — 폼이 `data.error` 를 재시도 배너에 쓴다.
    // 기록은 recordSafe 가 걸러 유령 행을 막는다.
    await recordSafe("interview_written", { body, sid, dedupKey, gasData: data })
    return NextResponse.json(data)
  } catch (err) {
    if (isGasExecuted(err)) {
      console.warn("[interview/written] GAS 실행됨(응답 본문 유실) — 성공 처리")
      await recordSafe("interview_written", { body, sid, dedupKey, gasBodyLost: true })
      return NextResponse.json({ success: true })
    }
    console.error("[interview/written] GAS 호출 실패:", err)
    // ⚠ 종전에는 여기서 `{success:true}` 를 돌려줬다("UX 우선"). 그런데 이 경로는
    //   **시트에도 DB 에도 아무것도 안 남는 진짜 영구결손**이었다 — 손님은 접수됐다고
    //   믿고 떠나고, 답변은 사라진다. 스윕으로도 복구 불가(시트에 행이 없다).
    //   그래서 순서를 바꾼다: **기록 먼저, 응답 나중.**
    //   ① DB 에 남겨 유일한 흔적을 만들고 ② 사실대로 실패를 알린다.
    //   폼은 답변을 localStorage 에 보존하고 재시도 배너 + 전문 복사를 띄운다.
    await recordSafe("interview_written", { body, sid, dedupKey, statusNote: GAS_FAILED_NOTE })
    return NextResponse.json(
      { success: false, error: "제출 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    )
  }
}
