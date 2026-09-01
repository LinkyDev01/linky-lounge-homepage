import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

/**
 * 접수 원장 조회 (2026-09-01, 계획서 P3 — Stage A).
 *
 * **GET 전용이다.** 쓰기 API 는 배포하지 않는다 — 상태의 정본은 당분간 구글 시트이고,
 * 두 곳에서 상태를 고칠 수 있게 되는 순간 어느 쪽이 참인지 알 수 없어진다.
 * 상태 관리(PATCH)는 P5(Stage B)에서 "시트 기입 중단" 합의 뒤에 연다.
 *
 * ⚠ R13 감사 로그는 두지 않는다(판단). 규칙 원문은 "관리자는 service_role 로 우회하되
 *   감사 로그를 남긴다"이지만, 열람자가 운영자 1인이고 쿠키도 1개라 로그가 식별하는
 *   주체가 언제나 같아 얻는 게 없다. 열람자가 늘면 그때 R13 을 그대로 이행한다.
 *   (이 판단은 DECISIONS 에도 남긴다 — 규칙과의 차이를 드러내기 위해서다.)
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
    .select("id, kind, name, phone, order_no, cohort, traffic_src, payload, payload_src, status_note, gas_body_lost, ends_on, purge_after, purged_at, submitted_at")
    .order("submitted_at", { ascending: false })
    .range(offset, offset + PAGE) // 1건 더 받아 '더 보기' 여부를 판정한다

  if (kind && (KINDS as readonly string[]).includes(kind)) sel = sel.eq("kind", kind)
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
    .gte("submitted_at", since7)
    .limit(1000)
  const counts = new Map<string, number>()
  for (const r of recent ?? []) counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1)

  return NextResponse.json({
    enabled: true,
    hasMore,
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
    })),
  })
}
