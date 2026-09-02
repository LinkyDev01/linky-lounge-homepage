import { NextRequest, NextResponse } from "next/server"
import { gasPostJson, isGasExecuted, isGasRejected, gasRejectReason } from "@/lib/gas"
import { markApplicationSubmitted } from "@/lib/orders"
import { classifyApply, recordSafe } from "@/lib/applications"

const GAS_URL = process.env.INTERVIEW_GAS_URL
const IS_DEV  = process.env.NODE_ENV === "development"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (body === null) {
    return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
  }

  // 제출 ID — 시트와 DB 가 공유하는 멱등 키. **P1 부터 발급해 GAS payload 에 함께 보낸다**
  // (GAS 가 아직 이 값을 무시해도 무해하고, P2.5 스윕이 켜지는 순간 대조가 성립한다).
  // ⚠ 화이트리스트 밖 type(apply_draft·admin_*)에는 kind 가 null 이라 sid 도 발급하지
  //   않는다 — 시트에 남지 않는 접수에 sid 를 주면 영원히 보정 안 되는 미아 행이 된다.
  const kind = classifyApply(body)
  const sid = kind ? crypto.randomUUID() : null

  if (!GAS_URL) {
    if (IS_DEV) {
      // ⚠ 이 로그는 body 전문이라 개인정보가 찍힌다 — 개발 목업 모드에서만 도달한다
      console.log("[lazyday/apply] 개발 목업 모드:", body)
      // 목업에서도 원장은 실제로 기록한다 — dev Supabase 로 P1 검증을 하기 위해서다
      await recordSafe(kind, { body, sid })
      return NextResponse.json({ success: true })
    }
    return NextResponse.json(
      { success: false, error: "서버 설정 오류 (GAS URL 미설정)" },
      { status: 500 }
    )
  }

  try {
    // GAS 간헐 404 대응 — 미실행이 확실할 때만 1회 재시도 (lib/gas.ts)
    const data = await gasPostJson(GAS_URL, sid ? { ...body, sid } : body)

    // ⚠ GAS 는 **실패도 200 + {success:false}** 로 돌려준다 (화이트리스트 밖 type ·
    //   필수항목 누락 · 슬롯 중복). 종전에는 이 값을 보지 않고 무조건 성공을 돌려줘
    //   **시트에 없는 접수에 완료 화면이 떴다** — 손님은 접수됐다고 믿는데 우리 쪽엔
    //   아무 기록이 없다. 운영자 지시(2026-09-01) "이건 절대 안 되지"로 막는다.
    //   폼들은 이미 `!res.ok || !result?.success` 로 판정해 구제 화면(카카오 원문 복사)을
    //   띄우므로, 라우트가 사실대로 알리기만 하면 된다.
    if (isGasRejected(data)) {
      // 사유는 GAS 내부 문구라 로그까지만 — 손님 화면은 폼이 가진 구제 원문이 담당한다
      console.warn(`[lazyday/apply] GAS 거절 (${kind ?? "미분류"}):`, gasRejectReason(data))
      // ⚠ markSubmitted 를 부르지 않는다 — 거절인데 원장에 "신청서 냄"이 찍히면
      //   결제만 하고 신청 안 한 손님을 찾는 구제 쿼리가 그 손님을 놓친다.
      return NextResponse.json({ success: false, error: "신청 접수에 실패했습니다." })
    }

    await recordSafe(kind, { body, sid, gasData: data })
    await markSubmitted(body)
    return NextResponse.json({ success: true })
  } catch (err) {
    // 302를 받았다면 시트 기록·메일은 이미 끝난 상태 — 본문만 못 받은 것이라
    // 사용자에게 실패를 알리면 중복 제출을 유도하게 된다 (2026-08-05)
    if (isGasExecuted(err)) {
      console.warn("[lazyday/apply] GAS 실행됨(응답 본문 유실) — 성공 처리")
      // 실행은 확정이므로 **무조건** 기록한다. 응답 본문이 없어 success 판정을 못 하니
      // gasBodyLost 로 표시해 둔다 — P2.5 대조에서 이 행의 성격을 알아볼 수 있어야 한다.
      await recordSafe(kind, { body, sid, gasBodyLost: true })
      await markSubmitted(body)
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

/**
 * 선결제 주문의 신청서 제출 표시 (2026-08-18, 주문 원장).
 * 이 값이 NULL 로 남은 주문이 곧 "결제만 하고 신청서를 안 낸 손님" — 운영 구제 대상이다.
 * 참가자 이름·연락처도 신청서 값으로 맞춘다 (대리 결제면 결제자와 갈린다 · R3).
 * ⚠ 실패해도 신청 접수 응답을 깨뜨리지 않는다 — 시트 기록은 이미 끝난 뒤다.
 * ⚠ 접수 원장(applications) 기록과 **한 덩어리로 묶지 않는다** — 이건 orders 쪽 로직이고
 *   실패 조건도 다르다. 로그 접두어도 [lazyday/apply] vs [apply-ledger] 로 분리한다.
 */
async function markSubmitted(body: unknown) {
  const b = body as { orderId?: unknown; name?: unknown; phone?: unknown } | null
  const orderId = typeof b?.orderId === "string" ? b.orderId : ""
  if (!orderId) return
  try {
    const r = await markApplicationSubmitted(orderId, {
      name: typeof b?.name === "string" ? b.name : undefined,
      phone: typeof b?.phone === "string" ? b.phone : undefined,
    })
    if (!r.ok) console.error(`[lazyday/apply] 원장 제출표시 실패 (${orderId}):`, r.error)
  } catch (err) {
    console.error(`[lazyday/apply] 원장 제출표시 예외 (${orderId}):`, err)
  }
}
