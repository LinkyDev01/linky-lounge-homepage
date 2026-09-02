import { NextRequest, NextResponse } from "next/server"
import { recordActivity, isActivityKind, ACTIVITY_KINDS } from "@/lib/customer-activities"

/**
 * 고객 활동 기록 API (2026-09-02, 대시보드 CRM-5).
 *   POST /api/lazyday/admin/activities   { personKey, kind, body }   기록 남기기
 *
 * **쓰기 라우트인데 왜 지금 열 수 있는가** — 2026-09-01 분류·메모와 같은 경계선이다:
 * *시트에 있는 것은 쓰지 않고, 시트에 없는 것만 쓴다.* 진행 상태(미진행·결제완료·탈락…)의
 * 정본은 시트라 P5 까지 닫아 두지만, "언제 전화했는가"는 시트에 없는 개념이라 부딪힐 상대가 없다.
 *
 * ⚠ **누가 남겼는지는 `lazyday_admin_who` 쿠키에서 읽는다** (소셜 로그인이 심는다, 2026-09-02).
 *   비밀번호로 들어온 사람은 그 쿠키가 없어 `who` 가 null 이 된다 — 거짓 이름을 넣지 않는다.
 *   `ADMIN_PASSWORD` 가 사라지면 자연히 전부 채워진다.
 * ⚠ 읽기는 여기가 아니다 — 활동은 고객 상세(`/api/lazyday/admin/customers?key=`)의 타임라인에
 *   합쳐져 나온다. 조회 경로를 둘로 두면 화면이 어느 쪽을 믿을지 갈린다.
 */
const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim()
const isAuthorized = (req: NextRequest) => Boolean(ADMIN_SECRET) && req.cookies.get("lazyday_admin")?.value === ADMIN_SECRET

/** lib/customers.ts 의 키 형태 — 0013 의 check 와 같은 집합 */
const PERSON_KEY = /^[A-Za-z0-9:_-]{1,64}$/

export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" }
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "본문이 JSON 이 아니에요" }, { status: 400, headers })
  }
  const b = (payload ?? {}) as Record<string, unknown>

  const personKey = typeof b.personKey === "string" ? b.personKey : ""
  if (!PERSON_KEY.test(personKey)) return NextResponse.json({ error: "personKey 가 필요해요" }, { status: 400, headers })

  if (!isActivityKind(b.kind)) {
    return NextResponse.json({ error: `kind 는 ${ACTIVITY_KINDS.join("·")} 중 하나예요` }, { status: 400, headers })
  }
  if (typeof b.body !== "string") return NextResponse.json({ error: "내용이 필요해요" }, { status: 400, headers })

  const r = await recordActivity({
    personKey,
    kind: b.kind,
    body: b.body,
    who: req.cookies.get("lazyday_admin_who")?.value || null,
  })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status, headers })
  return NextResponse.json({ ok: true, activity: r.activity }, { headers })
}
