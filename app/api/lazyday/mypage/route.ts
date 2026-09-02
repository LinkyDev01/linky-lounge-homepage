import { NextResponse } from "next/server"
import { getSessionUser, isAuthEnabled } from "@/lib/auth-server"
import { supabaseAdmin } from "@/lib/supabase-server"

/**
 * 내 주문·내 신청 — `GET /api/lazyday/mypage` (계획서 P4a-6).
 *
 * **R13 은 여기서 강제된다.** RLS 는 전면 거부라 정책이 없고, 대신 이 라우트가
 * 세션에서 뽑은 user_id 로만 조회한다 — 쿼리에 `eq("user_id", user.id)` 가 빠지면
 * 그대로 전수 조회가 되므로 **필터를 지우지 말 것**.
 *
 * 담는 것: 주문(번호·금액·상태·항목명)과 신청(종류·접수일).
 * ⚠ **신청의 진행 상태(status)는 돌려주지 않는다** — 정본이 구글 시트라 DB 값이
 *   손님에게 보여지면 시트와 어긋난 순간 거짓말이 된다 (계획서 P5 까지 닫아 둔다).
 * ⚠ **파기된 신청은 목록에서 뺀다** — 보유기간이 지나 이름·본문을 비운 행이라
 *   보여 줄 내용이 없다(행 자체는 시트 대조를 위해 남아 있다).
 */
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" }
  if (!isAuthEnabled()) return NextResponse.json({ ok: false, error: "auth disabled" }, { status: 503, headers })

  const user = await getSessionUser()
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers })

  const sb = supabaseAdmin()
  if (!sb) return NextResponse.json({ ok: false, error: "ledger disabled" }, { status: 503, headers })

  const [ordersRes, appsRes] = await Promise.all([
    sb
      .from("orders")
      .select("order_no, amount_total, status, created_at, order_items ( name_snapshot, quantity, note_snapshot )")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    sb
      .from("applications")
      .select("kind, cohort, order_no, submitted_at")
      .eq("user_id", user.id)
      .is("purged_at", null)
      .order("submitted_at", { ascending: false })
      .limit(50),
  ])

  if (ordersRes.error || appsRes.error) {
    console.error("[mypage] 조회 실패", ordersRes.error?.message, appsRes.error?.message)
    return NextResponse.json({ ok: false, error: "query failed" }, { status: 502, headers })
  }

  return NextResponse.json(
    {
      ok: true,
      orders: (ordersRes.data ?? []).map((o) => ({
        orderNo: o.order_no,
        amountTotal: o.amount_total,
        status: o.status,
        createdAt: o.created_at,
        items: (o.order_items ?? []).map((it) => ({
          name: it.name_snapshot,
          quantity: it.quantity,
          note: it.note_snapshot,
        })),
      })),
      applications: (appsRes.data ?? []).map((a) => ({
        kind: a.kind,
        cohort: a.cohort,
        orderNo: a.order_no,
        submittedAt: a.submitted_at,
      })),
    },
    { headers },
  )
}
