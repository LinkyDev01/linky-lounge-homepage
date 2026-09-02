/**
 * 고객 레코드 — 세 원장(applications · orders · profiles)을 **전화번호로 묶은** 사람 단위 뷰
 * (2026-09-02, 고객관리 대시보드 CRM-1). 정본 설계·근거: docs/admin-crm/01-references.md.
 *
 * **표가 아니다.** 고객 테이블을 새로 만들지 않는다 — 접수·주문·회원은 각자 정본이 있고, 사람은
 * 그 셋을 잇는 **조회 시점의 파생**이다(HubSpot 의 연락처 ↔ 딜 연관, Attio 의 오브젝트 ↔ 리스트).
 * 묶는 열쇠는 `normalizePhone()` 결과 — 주문 원장의 결정 4("전화는 키가 아니다")와 충돌하지
 * 않는다: 여기서 전화는 DB 키가 아니라 **화면에서 같은 사람으로 보여 주는 기준**일 뿐이고,
 * 회원 연결(user_id)은 종전대로 주문번호+전화 둘 다 일치(R11)로만 붙는다.
 *
 * **단계(stage)의 정본은 구글 시트다** (계획서 P5 게이트). 여기서 계산하는 단계는
 *   ① DB 에 있는 사실(접수 종류·주문·회원)과 ② 스윕이 시트에서 실어 온 '진행 상태'·'인터뷰 상태'
 *   (payload_src='sheet' 행의 payload) 로 **읽어서 파생**한 값이다 — 쓰지 않는다.
 *   시트에서 나중에 바뀐 값은 CRM-2(상태 미러)가 붙기 전까지 여기 반영되지 않는다 —
 *   화면은 이 사실을 밝힌다("정본은 시트").
 *
 * **서버 전용** — service_role 로 읽으므로 라우트 핸들러에서만 부른다. 개인정보를 돌려주므로
 * 부르는 라우트가 관리자 인증을 책임진다.
 */

import { supabaseAdmin } from "./supabase-server"
import { normalizePhone } from "./orders"

export type Stage =
  | "received" | "interview_booked" | "interviewed" | "accepted_unpaid" | "paid" | "attending" | "hold" | "rejected" | "refunded"

export type Activity = {
  at: string
  type: "apply" | "interview" | "order" | "note" | "system"
  title: string
  detail?: string | null
  amount?: number | null
  /** 아직 오지 않은 일정(전화 인터뷰 예약 등) — 타임라인 맨 위 */
  upcoming?: boolean
  /** 원장 행 참조 — 화면이 접수 원장/주문으로 건너뛸 때 */
  ref?: { table: "applications" | "orders"; id: string }
}

export type CohortEntry = {
  cohort: string
  stage: Stage
  /** 시트 '진행 상태' 원문 (있을 때) — 파생 근거를 화면이 보여 줄 수 있게 */
  sheetProgress?: string | null
  interview?: "phone" | "written" | null
  since: string
}

export type Customer = {
  /** 정규화 전화 (= 묶음 키). 전화 없는 접수(후기 등)는 묶이지 않고 이름 단독 행이 된다 */
  key: string
  name: string | null
  phone: string | null
  email: string | null
  member: boolean
  /** 회원의 만 14세 확인 시각 유무 — 비회원은 null (해당 없음) */
  ageVerified: boolean | null
  marketingConsent: boolean
  source: string | null
  /** 가장 최근에 **끝난** 인터뷰(전화 예약 시각 지남·서면 제출) 시각 — 결과 미기록 감지용 */
  lastInterviewAt: string | null
  entries: CohortEntry[]
  flags: ("gas_failed" | "unsubmitted" | "dup" | "purged")[]
  note: string | null
  counts: { applications: number; orders: number }
  lastActivityAt: string | null
  /** 상세에서만 채운다 (목록은 비운다 — 크기) */
  activities?: Activity[]
  orders?: { orderNo: string; at: string; amount: number; status: string; items: { name: string; quantity: number; kind: string }[]; applicationSubmitted: boolean; userLinked: boolean }[]
  applications?: { id: string; kind: string; cohort: string | null; orderNo: string | null; at: string; triage: string | null; note: string | null; statusNote: string | null }[]
}

export type AppRow = {
  id: string; kind: string; name: string | null; phone: string | null; order_no: string | null; cohort: string | null
  traffic_src: string | null; payload: Record<string, unknown>; payload_src: string; status: string; status_note: string | null
  gas_body_lost: boolean; purged_at: string | null; submitted_at: string; triage: string | null; triage_note: string | null
  marketing_consent_at: string | null; user_id: string | null
  /** 0012 시트 거울 — 없으면(스윕 전) payload 의 시트 원문으로 폴백 */
  sheet_progress?: string | null; sheet_interview_status?: string | null; sheet_interview_type?: string | null; sheet_synced_at?: string | null
}
export type OrderRow = {
  id: string; order_no: string; amount_total: number; status: string; orderer_name: string; orderer_phone: string | null
  approved_at: string | null; created_at: string; application_submitted_at: string | null; user_id: string | null
  order_items: { name_snapshot: string; quantity: number; kind: string }[] | null
}
export type ProfileRow = { user_id: string; display_name: string | null; email: string | null; phone: string | null; marketing_consent_at: string | null; age_verified_at?: string | null }

const KIND_LABEL: Record<string, string> = {
  bookclub: "북클럽 신청", oneday: "원데이 토크 신청", coffeebar: "커피앤바 신청", notify: "다음 기수 알림 신청",
  interview_phone: "전화 인터뷰 예약", interview_written: "서면 인터뷰 제출", review: "후기",
}

/** 시트 '진행 상태' → 단계. 시트 값 집합은 GAS PROGRESS_OPTIONS 와 같다 (미진행·미결제·결제완료·환불·탈락) */
function stageFromProgress(v: string | null | undefined): Stage | null {
  switch ((v || "").trim()) {
    case "미결제": return "accepted_unpaid"
    case "결제완료": return "paid"
    case "환불": return "refunded"
    case "탈락": return "rejected"
    case "미진행": return "received"
    default: return null
  }
}
/** DB status(P5 전엔 대부분 'received') → 단계 */
function stageFromDbStatus(s: string): Stage | null {
  switch (s) {
    case "unpaid": return "accepted_unpaid"
    case "paid": return "paid"
    case "refunded": return "refunded"
    case "rejected": return "rejected"
    case "done": return "attending"
    default: return null
  }
}
const STAGE_RANK: Record<Stage, number> = {
  received: 0, interview_booked: 1, interviewed: 2, accepted_unpaid: 3, paid: 4, attending: 5, hold: 2.5, rejected: 9, refunded: 8,
}

function str(v: unknown): string | null { return typeof v === "string" && v.trim() ? v.trim() : null }

/** 한 사람의 접수 묶음에서 기수 엔트리(단계)를 파생한다 */
function deriveEntries(apps: AppRow[], orders: OrderRow[]): CohortEntry[] {
  const byCohort = new Map<string, AppRow[]>()
  for (const a of apps) {
    if (a.kind !== "bookclub") continue
    const c = a.cohort || str(a.payload["기수"]) || "기수 미상"
    byCohort.set(c, [...(byCohort.get(c) ?? []), a])
  }
  const interviews = apps.filter((a) => a.kind === "interview_phone" || a.kind === "interview_written")
  const out: CohortEntry[] = []
  for (const [cohort, rows] of byCohort) {
    const first = [...rows].sort((x, y) => x.submitted_at.localeCompare(y.submitted_at))[0]
    let stage: Stage = "received"
    let sheetProgress: string | null = null
    let interview: "phone" | "written" | null = null
    for (const r of rows) {
      // 거울 컬럼(CRM-2, 매시 갱신) > 스윕이 처음 실어 온 payload 원문 > DB status
      const p = str(r.sheet_progress) ?? str(r.payload["진행 상태"])
      const s = stageFromProgress(p) ?? stageFromDbStatus(r.status)
      if (p) sheetProgress = p
      if (s && STAGE_RANK[s] > STAGE_RANK[stage]) stage = s
      const t = str(r.sheet_interview_type) ?? str(r.payload["interviewType"]) ?? str(r.payload["인터뷰 방식"])
      if (t) interview = /전화|phone/i.test(t) ? "phone" : /서면|written/i.test(t) ? "written" : interview
    }
    // 인터뷰 접수 행 — 예약(전화)·제출(서면). 시트 상태가 더 앞서 있으면 그쪽이 이긴다
    if (STAGE_RANK[stage] < STAGE_RANK.interviewed) {
      const phoneIv = interviews.find((i) => i.kind === "interview_phone")
      const writtenIv = interviews.find((i) => i.kind === "interview_written")
      if (writtenIv) { stage = "interviewed"; interview = interview ?? "written" }
      else if (phoneIv) {
        const end = str(phoneIv.payload["slotEnd"])
        stage = end && new Date(end).getTime() < Date.now() ? "interviewed" : "interview_booked"
        interview = interview ?? "phone"
      }
      // 시트 '인터뷰 상태' O = 완료
      for (const r of rows) if ((str(r.sheet_interview_status) ?? str(r.payload["인터뷰 상태"])) === "O" && STAGE_RANK[stage] < STAGE_RANK.interviewed) stage = "interviewed"
    }
    // 결제 사실은 주문 원장이 가장 확실하다 — 북클럽 항목이 있으면 최소 paid
    if (orders.some((o) => o.status === "paid" && (o.order_items ?? []).some((it) => it.kind === "meeting" && /북클럽/.test(it.name_snapshot)))) {
      if (STAGE_RANK[stage] < STAGE_RANK.paid) stage = "paid"
    }
    out.push({ cohort, stage, sheetProgress, interview, since: first.submitted_at })
  }
  return out.sort((a, b) => b.cohort.localeCompare(a.cohort))
}

function buildActivities(apps: AppRow[], orders: OrderRow[]): Activity[] {
  const acts: Activity[] = []
  for (const a of apps) {
    const base: Activity = {
      at: a.submitted_at, type: "apply", title: KIND_LABEL[a.kind] ?? a.kind, ref: { table: "applications", id: a.id },
      detail: [a.cohort, a.traffic_src ? `유입 ${a.traffic_src}` : null, a.gas_body_lost ? "GAS 응답 유실" : null, a.status_note].filter(Boolean).join(" · ") || null,
    }
    if (a.kind === "interview_phone") {
      const start = str(a.payload["slotStart"])
      const upcoming = start ? new Date(start).getTime() > Date.now() : false
      acts.push({ ...base, type: "interview", title: `전화 인터뷰 ${upcoming ? "예정" : "예약"}${start ? ` · ${fmtKst(start)}` : ""}`, at: upcoming && start ? start : a.submitted_at, upcoming })
    } else if (a.kind === "interview_written") {
      acts.push({ ...base, type: "interview", title: "서면 인터뷰 제출" })
    } else {
      acts.push(base)
    }
    if (a.triage_note) acts.push({ at: a.submitted_at, type: "note", title: "운영 메모", detail: a.triage_note, ref: { table: "applications", id: a.id } })
    if (a.purged_at) acts.push({ at: a.purged_at, type: "system", title: "개인정보 파기됨", ref: { table: "applications", id: a.id } })
  }
  for (const o of orders) {
    const items = (o.order_items ?? []).map((it) => it.name_snapshot).join(", ")
    acts.push({
      at: o.approved_at ?? o.created_at, type: "order", ref: { table: "orders", id: o.id },
      title: `${o.status === "paid" ? "결제 완료" : o.status === "refunded" ? "환불" : o.status === "partially_refunded" ? "부분 환불" : "취소"} · ${items || o.order_no}`,
      amount: o.amount_total, detail: o.application_submitted_at ? null : "⚠ 신청서 미제출",
    })
  }
  return acts.sort((a, b) => Number(!!b.upcoming) - Number(!!a.upcoming) || b.at.localeCompare(a.at))
}

function fmtKst(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000)
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

/** 목록·상세 공통 조립. export 는 **테스트용**(scripts/customers-test.mjs) — 라우트는 list/get 만 부른다 */
export function assemble(apps: AppRow[], orders: OrderRow[], profiles: ProfileRow[], withDetail: boolean): Customer[] {
  const groups = new Map<string, { apps: AppRow[]; orders: OrderRow[]; profile?: ProfileRow }>()
  const g = (key: string) => { let x = groups.get(key); if (!x) { x = { apps: [], orders: [] }; groups.set(key, x) } return x }
  const profileByUser = new Map(profiles.map((p) => [p.user_id, p]))

  for (const a of apps) {
    const key = normalizePhone(a.phone ?? undefined) ?? (a.user_id ? `u:${a.user_id}` : `a:${a.id}`)
    const x = g(key); x.apps.push(a)
    if (a.user_id && profileByUser.has(a.user_id)) x.profile = profileByUser.get(a.user_id)
  }
  for (const o of orders) {
    const key = normalizePhone(o.orderer_phone ?? undefined) ?? (o.user_id ? `u:${o.user_id}` : `o:${o.id}`)
    const x = g(key); x.orders.push(o)
    if (o.user_id && profileByUser.has(o.user_id)) x.profile = profileByUser.get(o.user_id)
  }
  // 접수·주문이 없는 회원도 한 사람이다 (로그인만 한 상태).
  // ⚠ 이미 접수·주문을 통해 어느 묶음에 붙은 회원은 건너뛴다 — 프로필에 전화가 없으면 키가
  //   `u:` 로 달라져 **같은 사람이 둘로 갈라진다** (리허설에서 잡음, 2026-09-02)
  const attached = new Set([...groups.values()].map((x) => x.profile?.user_id).filter(Boolean))
  for (const p of profiles) {
    if (attached.has(p.user_id)) continue
    const key = normalizePhone(p.phone ?? undefined) ?? `u:${p.user_id}`
    const x = g(key); if (!x.profile) x.profile = p
  }

  const out: Customer[] = []
  for (const [key, x] of groups) {
    const live = x.apps.filter((a) => !a.purged_at)
    const name = x.profile?.display_name ?? live.map((a) => a.name).find(Boolean) ?? x.orders.map((o) => o.orderer_name).find(Boolean) ?? null
    const phone = key.startsWith("u:") || key.startsWith("a:") || key.startsWith("o:") ? (x.profile?.phone ?? null) : key
    const flags: Customer["flags"] = []
    if (live.some((a) => a.status_note || a.gas_body_lost)) flags.push("gas_failed")
    if (x.orders.some((o) => o.status === "paid" && !o.application_submitted_at && (o.order_items ?? []).some((it) => it.kind === "meeting"))) flags.push("unsubmitted")
    const bookclubByCohort = new Map<string, number>()
    for (const a of live) if (a.kind === "bookclub" && !a.triage) bookclubByCohort.set(a.cohort ?? "", (bookclubByCohort.get(a.cohort ?? "") ?? 0) + 1)
    if ([...bookclubByCohort.values()].some((n) => n > 1)) flags.push("dup")
    if (x.apps.some((a) => a.purged_at) && !live.length) flags.push("purged")
    const acts = buildActivities(x.apps, x.orders)
    // 파기 이벤트는 '활동'이 아니다 — 최근순 정렬에서 파기된 사람이 맨 위로 튀지 않게
    const last = acts.find((a) => !a.upcoming && !(a.type === "system" && a.title === "개인정보 파기됨"))?.at ?? null
    const c: Customer = {
      key, name, phone,
      email: x.profile?.email ?? null,
      member: Boolean(x.profile),
      ageVerified: x.profile ? Boolean(x.profile.age_verified_at) : null,
      lastInterviewAt: acts.find((a) => a.type === "interview" && !a.upcoming)?.at ?? null,
      marketingConsent: Boolean(x.profile?.marketing_consent_at || live.some((a) => a.marketing_consent_at)),
      source: live.map((a) => a.traffic_src).find(Boolean) ?? null,
      entries: deriveEntries(live, x.orders),
      flags,
      note: live.map((a) => a.triage_note).find(Boolean) ?? null,
      counts: { applications: live.length, orders: x.orders.length },
      lastActivityAt: last,
    }
    if (withDetail) {
      c.activities = acts
      c.orders = x.orders.map((o) => ({
        orderNo: o.order_no, at: o.approved_at ?? o.created_at, amount: o.amount_total, status: o.status,
        items: (o.order_items ?? []).map((it) => ({ name: it.name_snapshot, quantity: it.quantity, kind: it.kind })),
        applicationSubmitted: Boolean(o.application_submitted_at), userLinked: Boolean(o.user_id),
      }))
      c.applications = x.apps.map((a) => ({
        id: a.id, kind: a.kind, cohort: a.cohort, orderNo: a.order_no, at: a.submitted_at, triage: a.triage, note: a.triage_note, statusNote: a.status_note,
      }))
    }
    out.push(c)
  }
  return out.sort((a, b) => (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""))
}

const APP_SELECT = "id, kind, name, phone, order_no, cohort, traffic_src, payload, payload_src, status, status_note, gas_body_lost, purged_at, submitted_at, triage, triage_note, marketing_consent_at, user_id, sheet_progress, sheet_interview_status, sheet_interview_type, sheet_synced_at"
const ORDER_SELECT = "id, order_no, amount_total, status, orderer_name, orderer_phone, approved_at, created_at, application_submitted_at, user_id, order_items ( name_snapshot, quantity, kind )"
const PROFILE_SELECT = "user_id, display_name, email, phone, marketing_consent_at, age_verified_at"

/** 고객 목록 — 최근 활동순. 분류로 뺀 접수(test·typo·dummy·duplicate)는 사람을 만들지 않는다 */
export async function listCustomers(opts: { q?: string; limit?: number } = {}): Promise<{ ok: true; customers: Customer[] } | { ok: false; error: string }> {
  const sb = supabaseAdmin()
  if (!sb) return { ok: false, error: "ledger disabled" }
  const [a, o, p] = await Promise.all([
    sb.from("applications").select(APP_SELECT).or("triage.is.null,triage.not.in.(test,typo,dummy,duplicate)").order("submitted_at", { ascending: false }).limit(2000),
    sb.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(2000),
    sb.from("profiles").select(PROFILE_SELECT).limit(2000),
  ])
  if (a.error || o.error || p.error) return { ok: false, error: a.error?.message ?? o.error?.message ?? p.error?.message ?? "query failed" }
  let customers = assemble((a.data ?? []) as AppRow[], (o.data ?? []) as OrderRow[], (p.data ?? []) as ProfileRow[], false)
  const q = opts.q?.trim()
  if (q) {
    const digits = q.replace(/\D/g, "")
    customers = customers.filter((c) => (c.name ?? "").includes(q) || (digits.length >= 3 && (c.phone ?? "").includes(digits)))
  }
  if (opts.limit) customers = customers.slice(0, opts.limit)
  return { ok: true, customers }
}

/** 전원 상세(활동·주문·접수 포함) — 오늘 할 일 파생(lib/admin-today)이 쓴다. 서버 안에서만 부른다(응답으로 내보내지 않는다) */
export async function listCustomersDetailed(): Promise<{ ok: true; customers: Customer[] } | { ok: false; error: string }> {
  const sb = supabaseAdmin()
  if (!sb) return { ok: false, error: "ledger disabled" }
  const [a, o, p] = await Promise.all([
    sb.from("applications").select(APP_SELECT).or("triage.is.null,triage.not.in.(test,typo,dummy,duplicate)").order("submitted_at", { ascending: false }).limit(2000),
    sb.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(2000),
    sb.from("profiles").select(PROFILE_SELECT).limit(2000),
  ])
  if (a.error || o.error || p.error) return { ok: false, error: a.error?.message ?? o.error?.message ?? p.error?.message ?? "query failed" }
  return { ok: true, customers: assemble((a.data ?? []) as AppRow[], (o.data ?? []) as OrderRow[], (p.data ?? []) as ProfileRow[], true) }
}

/** 고객 상세 — key 는 정규화 전화 또는 `u:<user_id>` */
export async function getCustomer(key: string): Promise<{ ok: true; customer: Customer | null } | { ok: false; error: string }> {
  const sb = supabaseAdmin()
  if (!sb) return { ok: false, error: "ledger disabled" }
  const phone = key.startsWith("u:") ? null : normalizePhone(key)
  const userId = key.startsWith("u:") ? key.slice(2) : null
  if (!phone && !userId) return { ok: true, customer: null }

  const appQ = sb.from("applications").select(APP_SELECT).order("submitted_at", { ascending: false }).limit(200)
  const ordQ = sb.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(200)
  const [a, o] = await Promise.all([
    phone ? appQ.eq("phone", phone) : appQ.eq("user_id", userId!),
    phone ? ordQ.eq("orderer_phone", phone) : ordQ.eq("user_id", userId!),
  ])
  if (a.error || o.error) return { ok: false, error: a.error?.message ?? o.error?.message ?? "query failed" }
  const apps = (a.data ?? []) as AppRow[]
  const ords = (o.data ?? []) as OrderRow[]
  const userIds = [...new Set([userId, ...apps.map((x) => x.user_id), ...ords.map((x) => x.user_id)].filter(Boolean))] as string[]
  const profQ = sb.from("profiles").select(PROFILE_SELECT)
  const p = userIds.length ? await profQ.in("user_id", userIds) : phone ? await profQ.eq("phone", phone) : { data: [], error: null }
  if (p.error) return { ok: false, error: p.error.message }
  const list = assemble(apps, ords, (p.data ?? []) as ProfileRow[], true)
  return { ok: true, customer: list[0] ?? null }
}
