import { NextRequest, NextResponse } from "next/server"
import { adminWho } from "@/lib/admin-session"
import { supabaseAdmin } from "@/lib/supabase-server"

/**
 * 결제만 하고 신청서를 안 낸 주문 목록 (2026-08-18, 주문 원장).
 * /lazyday/admin/status 의 '구제 대상' 절이 부른다 — 운영자가 여기서 재진입
 * 링크를 복사해 카톡/문자로 보내는 것이 구제 루틴이다. 종전에는 토스
 * 상점관리자에서 orderId 를 찾아 손으로 링크를 만들어야 했다.
 *
 * ⚠ '미제출'의 정의: application_submitted_at IS NULL **이고 모임 항목이 있는**
 *   주문. 굿즈만 산 주문은 신청서 단계가 원래 없어서 NULL 이 정상이다 —
 *   전체 NULL 을 세면 굿즈 주문이 영원히 구제 대상으로 잡힌다.
 */


/** 관리자 게이트 — 서명 토큰 검증 (lib/admin-session). 옛 시크릿-원문 쿠키는 통과하지 못한다 */
const isAuthorized = (req: NextRequest) => adminWho(req).then(Boolean)

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = supabaseAdmin()
  if (!sb) return NextResponse.json({ enabled: false, orders: [] })

  // order_items!inner + kind=meeting: 모임 항목이 있는 주문만, 임베드에는 그 모임 항목만 실린다
  const { data, error } = await sb
    .from("orders")
    .select("order_no, orderer_name, orderer_phone, amount_total, approved_at, order_items!inner(kind, name_snapshot)")
    .eq("order_items.kind", "meeting")
    .is("application_submitted_at", null)
    .order("approved_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[admin/orders/unsubmitted]", error.message)
    return NextResponse.json({ enabled: true, orders: [], error: "원장 조회 실패" }, { status: 502 })
  }

  return NextResponse.json({
    enabled: true,
    orders: (data ?? []).map((o) => ({
      orderNo: o.order_no,
      name: o.orderer_name,
      phone: o.orderer_phone,
      amount: o.amount_total,
      approvedAt: o.approved_at,
      meetings: (o.order_items ?? []).map((i: { name_snapshot: string }) => i.name_snapshot),
    })),
  })
}
