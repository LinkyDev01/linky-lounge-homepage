import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

/**
 * 접수 원장 조회 (2026-09-01, 계획서 P3 — Stage A).
 *
 * **진행 상태는 여전히 쓰지 않는다.** 그 정본은 구글 시트이고(미진행·미결제·결제완료·
 * 환불·탈락) 두 곳에서 고칠 수 있게 되는 순간 어느 쪽이 참인지 알 수 없어진다.
 * 상태 관리(PATCH status)는 P5(Stage B)에서 "시트 기입 중단" 합의 뒤에 연다.
 *
 * **다만 분류(triage)는 쓴다** (운영자 2026-09-01). 테스트·오기·더미·중복신청·기결제자는
 * **시트에 없는 개념**이라 정본 충돌이 없다 — "내가 훑다가 어떻게 봤는가"의 기록이다.
 * 파기가 아니라 열람 표시다. ⚠ **그중 목록에서 빠지는 건 앞의 넷뿐**이다 —
 * 기결제자는 허수가 아니라 가장 진짜인 접수라 표시만 하고 기본 목록에 그대로 남는다
 * (운영자 "기결제자는 물론 기본제외대상이 아니지").
 *
 * ⚠ R13 감사 로그는 아직 두지 않는다 — **다만 근거를 정정한다(2026-09-01).**
 *   처음엔 "열람자가 1인이라 로그가 무의미"라고 적었는데 **사실이 아니다: 열람자는 2명**
 *   (운영자 확인). 그럼에도 지금 로그를 남기면 "관리자가 봤다"까지만 남는다 —
 *   `ADMIN_SECRET` 이 **두 사람이 공유하는 단일 값**이라(GAS ADMIN_TOKEN 대조까지 겸한다)
 *   쿠키만으로는 누가 열람했는지 구분할 방법이 없기 때문이다.
 *   즉 R13 의 목적(누가 봤는가)을 채우려면 **사람별 식별이 선행**이어야 한다.
 *   → P4 에서 소셜 로그인·profiles 가 붙으면 그것으로 이행한다. 그 전에 필요하면
 *     사람별 admin 시크릿을 나누는 별건 작업이 먼저다. (DECISIONS 에 함께 기록)
 */

const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim()

function isAuthorized(req: NextRequest) {
  const cookie = req.cookies.get("lazyday_admin")?.value
  return Boolean(ADMIN_SECRET) && cookie === ADMIN_SECRET
}

/** 화면이 거를 수 있는 종류 — lib/applications 의 ApplicationKind 와 같은 집합 */
const KINDS = [
  "bookclub", "oneday", "coffeebar", "notify", "interview_phone", "interview_written", "review",
] as const

/** 분류 값 집합. 여기서 강제한다 — DB 는 형태만 본다(0008).
 *  늘리려면 이 배열에 한 줄 추가하면 되고 마이그레이션은 필요 없다. */
export const TRIAGE = ["test", "typo", "dummy", "duplicate", "paid"] as const

/** 그중 **기본 목록에서 빼는** 값. `paid`(기결제자)는 여기 없다 —
 *  운영자 2026-09-01 "기결제자는 물론 기본제외대상이 아니지".
 *  기결제자는 허수가 아니라 **가장 진짜인 접수**라 빼면 안 된다. 표시만 하고 목록엔 남긴다.
 *  즉 분류에는 두 종류가 있다: **빼는 표시**(test·typo·dummy·duplicate)와 **그냥 표시**(paid). */
export const HIDDEN = ["test", "typo", "dummy", "duplicate"] as const

/** 기본 목록의 조건: 분류가 없거나, 있어도 '빼는 표시'가 아닌 행.
 *  ⚠ `not.in` 만으로는 **null 행이 통째로 빠진다**(SQL 에서 null not in (...) 은 null) —
 *     그래서 `is.null` 을 or 로 함께 걸어야 한다. */
const VISIBLE_OR = `triage.is.null,triage.not.in.(${HIDDEN.join(",")})`

const PAGE = 30

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = supabaseAdmin()
  // 원장이 꺼져 있어도 화면은 열려야 한다 — 무엇이 문제인지 화면이 말해준다
  if (!sb) return NextResponse.json({ enabled: false, rows: [], summary: [], hasMore: false })

  const sp = req.nextUrl.searchParams
  const kind = sp.get("kind") || ""
  const q = (sp.get("q") || "").trim()
  const days = Number(sp.get("days") || "0")
  const offset = Math.max(0, Number(sp.get("offset") || "0"))

  let sel = sb
    .from("applications")
    // ⚠ 한 줄 리터럴이어야 한다 — supabase-js 는 select 문자열을 **타입 수준에서 파싱**하므로
    //   `+` 로 이어 붙이면 행 타입을 못 뽑아 필드 접근이 전부 컴파일 에러가 된다
    .select("id, kind, name, phone, order_no, cohort, traffic_src, payload, payload_src, status_note, gas_body_lost, ends_on, purge_after, purged_at, submitted_at, triage, triage_note, triaged_at")
    .order("submitted_at", { ascending: false })
    .range(offset, offset + PAGE) // 1건 더 받아 '더 보기' 여부를 판정한다

  if (kind && (KINDS as readonly string[]).includes(kind)) sel = sel.eq("kind", kind)
  // `?triaged=1` 이면 **빼둔 것만** 따로 본다 — 지우는 게 아니라 빼두는 것이라
  // 언제든 다시 꺼내 볼 수 있어야 한다. 기결제자는 어느 쪽에도 안 걸린다(늘 기본 목록에)
  sel = sp.get("triaged") === "1" ? sel.in("triage", [...HIDDEN]) : sel.or(VISIBLE_OR)
  if (days > 0) {
    const since = new Date(Date.now() - days * 86400_000).toISOString()
    sel = sel.gte("submitted_at", since)
  }
  if (q) {
    // 전화는 숫자만 저장돼 있다 — 입력의 하이픈을 떼야 맞는다
    const digits = q.replace(/[^0-9]/g, "")
    sel = digits.length >= 4
      ? sel.or(`name.ilike.%${q}%,phone.like.%${digits}%`)
      : sel.ilike("name", `%${q}%`)
  }

  const { data, error } = await sel
  if (error) {
    console.error("[admin/applications]", error.message)
    return NextResponse.json({ enabled: true, rows: [], summary: [], hasMore: false, error: "원장 조회 실패" }, { status: 502 })
  }

  const hasMore = (data?.length ?? 0) > PAGE
  const page = (data ?? []).slice(0, PAGE)

  // 최근 7일 kind 별 건수. ⚠ 이건 **DB 값일 뿐**이다 — 시트와 맞는지는 이 숫자만으로
  //   알 수 없다. 화면이 그 사실을 밝힌다(대조는 P2.5 스윕 결과로 닫는다).
  const since7 = new Date(Date.now() - 7 * 86400_000).toISOString()
  const { data: recent } = await sb
    .from("applications")
    .select("kind")
    .or(VISIBLE_OR) // 빼둔 건 세지 않는다 — 세면 요약이 허수를 포함한다. 기결제자는 센다
    .gte("submitted_at", since7)
    .limit(1000)
  // 몇 건을 빼뒀는지는 따로 알려준다 — 숨겼다는 사실 자체가 보여야 한다
  const { count: triagedCount } = await sb
    .from("applications")
    .select("id", { count: "exact", head: true })
    .in("triage", [...HIDDEN])
  const counts = new Map<string, number>()
  for (const r of recent ?? []) counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1)

  return NextResponse.json({
    enabled: true,
    hasMore,
    triagedCount: triagedCount ?? 0,
    summary: [...counts.entries()].map(([k, n]) => ({ kind: k, count: n })).sort((a, b) => b.count - a.count),
    rows: page.map((r) => ({
      id: r.id,
      kind: r.kind,
      name: r.name,
      phone: r.phone,
      orderNo: r.order_no,
      cohort: r.cohort,
      trafficSrc: r.traffic_src,
      payload: r.payload,
      payloadSrc: r.payload_src,
      statusNote: r.status_note,
      gasBodyLost: r.gas_body_lost,
      endsOn: r.ends_on,
      purgeAfter: r.purge_after,
      purgedAt: r.purged_at,
      submittedAt: r.submitted_at,
      triage: r.triage,
      triageNote: r.triage_note,
      triagedAt: r.triaged_at,
    })),
  })
}

/**
 * 분류·메모 쓰기. **이 둘만 쓴다** — 진행 상태(status)는 시트가 정본이라 건드리지 않고,
 * 파기도 하지 않는다(triage 는 열람 필터일 뿐이다).
 */
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = supabaseAdmin()
  if (!sb) return NextResponse.json({ error: "원장이 꺼져 있어요" }, { status: 503 })

  const body = (await req.json().catch(() => null)) as
    { id?: unknown; triage?: unknown; note?: unknown } | null
  const id = typeof body?.id === "string" ? body.id : ""
  if (!id) return NextResponse.json({ error: "id 가 필요합니다" }, { status: 400 })

  // null·"" = 분류 해제(다시 기본 목록으로). 그 밖에는 화이트리스트만 받는다
  const raw = body?.triage
  const triage = raw === null || raw === "" ? null : typeof raw === "string" ? raw : undefined
  if (triage !== null && (triage === undefined || !(TRIAGE as readonly string[]).includes(triage))) {
    return NextResponse.json({ error: "알 수 없는 분류" }, { status: 400 })
  }
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : undefined

  const patch: Record<string, unknown> = {
    triage,
    // 분류를 풀면 시각도 지운다 — 남겨두면 "분류된 적 있다"로 잘못 읽힌다
    triaged_at: triage ? new Date().toISOString() : null,
  }
  if (note !== undefined) patch.triage_note = note || null

  const { error } = await sb.from("applications").update(patch).eq("id", id)
  if (error) {
    console.error("[admin/applications] PATCH", error.message)
    return NextResponse.json({ error: "저장에 실패했어요" }, { status: 502 })
  }
  // ⚠ 응답에 개인정보를 담지 않는다
  return NextResponse.json({ ok: true })
}
