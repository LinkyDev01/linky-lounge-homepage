import { NextRequest, NextResponse } from "next/server"
import { adminWho } from "@/lib/admin-session"
import { recordActivity, isActivityKind, ACTIVITY_KINDS } from "@/lib/customer-activities"

/**
 * 고객 활동 기록 API (2026-09-02, 대시보드 CRM-5).
 *   POST /api/lazyday/admin/activities   { personKey, kind, body }   기록 남기기
 *
 * **쓰기 라우트인데 왜 지금 열 수 있는가** — 2026-09-01 분류·메모와 같은 경계선이다:
 * *시트에 있는 것은 쓰지 않고, 시트에 없는 것만 쓴다.* 진행 상태(미진행·결제완료·탈락…)의
 * 정본은 시트라 P5 까지 닫아 두지만, "언제 전화했는가"는 시트에 없는 개념이라 부딪힐 상대가 없다.
 *
 * ⚠ **누가 남겼는지는 서명 토큰의 who 에서 읽는다** (lib/admin-session, 2026-09-02).
 *   소셜 로그인은 이메일, 비밀번호 경로는 "password" 라 그 경우 `who` 를 null 로 남긴다 — 거짓 이름을
 *   넣지 않는다. `ADMIN_PASSWORD` 가 사라지면 자연히 전부 채워진다.
 * ⚠ 읽기는 여기가 아니다 — 활동은 고객 상세(`/api/lazyday/admin/customers?key=`)의 타임라인에
 *   합쳐져 나온다. 조회 경로를 둘로 두면 화면이 어느 쪽을 믿을지 갈린다.
 */
const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim()

/** lib/customers.ts 의 키 형태 — 0013 의 check 와 같은 집합 */
const PERSON_KEY = /^[A-Za-z0-9:_-]{1,64}$/

export async function POST(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" }
  const who = await adminWho(req)
  if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })

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
    who: who === "password" ? null : who,
  })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status, headers })
  return NextResponse.json({ ok: true, activity: r.activity }, { headers })
}
