/**
 * 고객 활동 기록 — 메모 · 통화 · 문자 (2026-09-02, 대시보드 CRM-5).
 *
 * 레코드 페이지의 '전화 걸기 · 문자 보내기'는 `tel:`·`sms:` 링크라 **누른 뒤 아무것도 남지 않았다**.
 * 이 표가 "언제 누구에게 무엇을 했는가"를 사람 단위로 남긴다.
 *
 * **자동으로 남기지 않는다** (운영자 2026-09-02): 링크를 누른 것과 실제로 통화한 것은 다르고,
 * 문자는 눌러도 실제 발송 여부를 우리가 알 수 없다. 링크는 기록 **초안**을 띄우기만 하고
 * 저장은 사람이 누를 때 일어난다 — 거짓 기록이 쌓이지 않는 유일한 방법이다.
 *
 * **서버 전용** — service_role 로 쓰므로 라우트 핸들러에서만 부른다.
 */

import { supabaseAdmin } from "./supabase-server"
import { normalizePhone } from "./orders"

/** 값 집합의 정본은 여기다 — DB 는 형태만 본다 (0013 결정 2) */
export const ACTIVITY_KINDS = ["note", "call", "sms"] as const
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]
export const isActivityKind = (v: unknown): v is ActivityKind =>
  typeof v === "string" && (ACTIVITY_KINDS as readonly string[]).includes(v)

export const ACTIVITY_LABEL: Record<ActivityKind, string> = { note: "메모", call: "통화", sms: "문자" }

export type ActivityRow = {
  id: string
  person_key: string
  kind: string
  body: string | null
  who: string | null
  occurred_at: string
  purged_at: string | null
}

/** ⚠ 한 줄 리터럴 — 이어 붙이면 행 타입을 못 뽑아 필드 접근이 전부 컴파일 에러가 된다 (CLAUDE.md §5) */
const ACT_SELECT = "id, person_key, kind, body, who, occurred_at, purged_at"

const MAX_BODY = 2000 // 0013 의 check 와 같은 값

/**
 * 그 사람의 보유기간 — **마지막 접수의 `purge_after`** (운영자 2026-09-02 "그 사람 접수와 같이").
 * 접수가 없는 사람(주문만·회원만)은 산출할 근거가 없으므로 **기록일+1년으로 폴백**한다
 * (0005 의 '접수+1년 폴백'과 같은 정신 — null 을 남기면 그 기록이 영원히 남는다).
 *
 * ⚠ 나중에 그 사람의 접수가 더 생겨 보유기간이 늘어도 이미 적은 기록은 갱신하지 않는다.
 *   기록이 접수보다 **먼저** 지워지는 방향이라 개인정보 보호에서 안전한 쪽의 오차다.
 */
async function purgeAfterFor(personKey: string): Promise<string> {
  const fallback = () => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().slice(0, 10)
  }
  const sb = supabaseAdmin()
  if (!sb) return fallback()

  const phone = personKey.startsWith("u:") ? null : normalizePhone(personKey)
  const userId = personKey.startsWith("u:") ? personKey.slice(2) : null
  if (!phone && !userId) return fallback()

  const q = sb.from("applications").select("purge_after").order("purge_after", { ascending: false }).limit(1)
  const { data, error } = await (phone ? q.eq("phone", phone) : q.eq("user_id", userId!))
  if (error || !data?.length) return fallback()
  return data[0].purge_after ?? fallback()
}

/** 그 사람의 활동 기록 (최근순). 파기된 행도 돌려준다 — 화면이 '(파기됨)'으로 알아볼 수 있게 */
export async function listActivities(personKey: string): Promise<ActivityRow[]> {
  const sb = supabaseAdmin()
  if (!sb) return []
  const { data, error } = await sb
    .from("customer_activities")
    .select(ACT_SELECT)
    .eq("person_key", personKey)
    .order("occurred_at", { ascending: false })
    .limit(200)
  if (error) {
    console.error("[customer-activities] list", error.message)
    return []
  }
  return (data ?? []) as ActivityRow[]
}

export type RecordInput = {
  personKey: string
  kind: ActivityKind
  body: string
  /** 남긴 관리자 — 서명 토큰의 who(이메일). 비밀번호로 들어온 사람은 알 수 없어 null */
  who?: string | null
  /** 나중에 적는 경우 (기본은 지금) */
  occurredAt?: string | null
}

export async function recordActivity(
  input: RecordInput,
): Promise<{ ok: true; activity: ActivityRow } | { ok: false; error: string; status: number }> {
  const sb = supabaseAdmin()
  if (!sb) return { ok: false, error: "원장이 꺼져 있어요", status: 503 }

  const body = input.body.trim()
  if (!body) return { ok: false, error: "내용이 비어 있어요", status: 400 }
  if (body.length > MAX_BODY) return { ok: false, error: `내용이 너무 길어요 (${MAX_BODY}자까지)`, status: 400 }

  const purgeAfter = await purgeAfterFor(input.personKey)
  const { data, error } = await sb
    .from("customer_activities")
    .insert({
      person_key: input.personKey,
      kind: input.kind,
      body,
      who: input.who ?? null,
      occurred_at: input.occurredAt || new Date().toISOString(),
      purge_after: purgeAfter,
    })
    .select(ACT_SELECT)
    .single()

  if (error) {
    console.error("[customer-activities] insert", error.message)
    return { ok: false, error: "기록에 실패했어요", status: 502 }
  }
  return { ok: true, activity: data as ActivityRow }
}
