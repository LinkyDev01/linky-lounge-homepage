/**
 * 접수 원장 기록 (2026-09-01 신설).
 *
 * **왜 생겼나.** 접수 데이터가 구글 시트(GAS)에만 남았다. DB 에 흔적이 남는 접수는
 * 선결제 원데이 하나뿐이었고(`orders.application_submitted_at` 플래그), 그나마도
 * 주문이 있어야 남았다. 주문 없는 신청 — 북클럽·다음 기수 알림·커피앤바 — 은
 * 시트가 **유일본**이라 시트 사고 한 번이 접수 전량 소실이었다.
 * 여기서는 같은 접수를 DB 에도 나란히 남긴다.
 *
 * **원칙 1 — 시트가 1차 정본이고, 기록이 접수를 깨뜨리지 않는다.**
 * `lib/orders.ts` 의 LedgerResult 규율을 그대로 따른다: 던지지 않고 결과를 돌려주며,
 * Supabase 미설정이면 `{ok:true, skipped:"disabled"}` 로 조용히 꺼진다. 접수 응답은
 * GAS 결과로만 판정한다 — 손님은 이미 폼을 냈고, 원장은 부가 기능이다.
 *
 * **원칙 2 — GAS 성공 판정은 HTTP 가 아니다.** GAS 는 실패도 **200 + `{success:false}`**
 * 로 돌려준다(화이트리스트 밖 type / 필수항목 누락 / 슬롯 중복). 그래서 호출부는
 * `data?.success !== false` 일 때만 기록해야 한다. 안 지키면 시트에 없는 **유령 행**이
 * 쌓여 P2.5 대조가 통째로 무의미해진다. 이 판정은 `recordSafe()` 가 강제한다.
 *
 * 스키마: supabase/migrations/20260901093000_applications.sql
 * 실행 계획: docs/plans/2026-09-01-applications-ledger-and-members.md (P1)
 * 규칙 원문(R6·R9·R11): /lazyday/preview/commerce-journey
 */

import { supabaseAdmin, isLedgerEnabled } from "./supabase-server"
import { isGasRejected } from "./gas"
import { normalizePhone, meetingEndsOn, purgeAfter, type LedgerResult } from "./orders"
import { parseOrderCodes } from "./order-catalog"
import { meetingOrderCode } from "@/app/(main)/lazyclub/one-day-config"
import { SEASON, seasonEndsOn } from "@/app/(main)/lazyday/season-config"

/** 이 라우트(=패스스루 /api/lazyday/apply)가 받는 접수 종류. P2 에서 3종이 더 붙는다. */
export type ApplicationKind =
  | "bookclub"
  | "notify"
  | "coffeebar"
  | "oneday"
  | "interview_phone"
  | "interview_written"
  | "review"

type Body = Record<string, unknown> | null | undefined

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")

/**
 * body.type → kind. **화이트리스트 밖은 null 이고, null 이면 기록도 sid 발급도 하지 않는다.**
 *
 * ⚠ `apply_draft`(1단계 임시저장)는 `SAVE_DRAFT=false` 로 꺼져 있는 죽은 경로이고 GAS 도
 *   화이트리스트에서 거절한다. 여기서 기록하면 **시트에 없는 행**이 생겨 P2.5 스윕이
 *   영원히 보정하지 못하는 미아가 된다 — 그래서 sid 조차 발급하지 않는다.
 * ⚠ `admin_*` 는 접수가 아니라 운영 조작이다.
 *
 * GAS 계약(gas/linkyincdev-main.gs 의 doPost 분기)과 값 집합을 맞춰 둔다:
 *   "" | "apply" → handleApply / notify → handleNotify /
 *   coffeebar → handleCoffeeBar / oneday → handleOnedayApply
 */
export function classifyApply(body: Body): ApplicationKind | null {
  const type = str(body?.type)
  if (type === "" || type === "apply") return "bookclub"
  if (type === "notify") return "notify"
  if (type === "coffeebar") return "coffeebar"
  if (type === "oneday") return "oneday"
  return null
}

/** kind 별 이름·전화 추출. 라우트마다 필드명이 달라 한곳에 모은다.
 *  ⚠ review 는 **전화번호를 아예 받지 않는다** — 전화 기반 매칭·회원 사후연결에서
 *    영구히 제외된다는 뜻이다 (P2 에서 이 표에 합류할 때 그대로 유지). */
function extractIdentity(kind: ApplicationKind, body: Body) {
  const name = str(body?.name)
  const phone = kind === "review" ? "" : str(body?.phone)
  return { name: name || null, phone: normalizePhone(phone) }
}

/** 오늘 + 1년 (YYYY-MM-DD, UTC). purge_after 폴백 — 산출 불가일 때만 쓴다 */
function oneYearFromToday(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

/**
 * kind 별 보유기간 (R9) — `{ endsOn, purgeAfter }`.
 *
 * | kind | ends_on | purge_after |
 * |---|---|---|
 * | oneday | 그 모임 종료일 | ends_on + 1년 |
 * | bookclub | 기수 종료일(5회차) | ends_on + 1년 |
 * | 그 밖 | null | 접수 + 1년 |
 *
 * ⚠ **`meetingEndsOn()` 은 dNNN 주문 코드만 받는다 — meetingSlug 가 아니다.**
 *   oneday 는 두 경로 어느 쪽도 dNNN 을 직접 담지 않으므로 반드시 변환을 거친다:
 *   모임 폼은 `meetingSlug` → `meetingOrderCode()`, 결제 후 신청은 `orderId` →
 *   `parseOrderCodes()`. 이걸 빠뜨리면 조용히 null 이 되어 전건이 폴백으로 샌다.
 */
function retention(kind: ApplicationKind, body: Body): { endsOn: string | null; purgeAfter: string } {
  let endsOn: string | null = null

  if (kind === "oneday") {
    const slug = str(body?.meetingSlug)
    const orderId = str(body?.orderId)
    const code =
      (slug ? meetingOrderCode(slug) : null) ??
      (orderId ? (parseOrderCodes(orderId) ?? []).find((c) => /^d[0-9]+$/.test(c)) ?? null : null)
    endsOn = code ? meetingEndsOn(code) : null
  } else if (kind === "bookclub") {
    // 기수 종료일 + 1년 — 방침 제3조("기수 종료 후 1년")와 같은 기준
    endsOn = seasonEndsOn()
  }

  return { endsOn, purgeAfter: purgeAfter(endsOn) ?? oneYearFromToday() }
}

export type RecordApplicationInput = {
  kind: ApplicationKind
  /** 라우트가 받은 body 원문 — payload 스냅샷 겸 이름·전화·보유기간 산출의 근거 */
  body: Body
  /** 제출 ID — 시트와 공유하는 멱등 키. P2.5 스윕이 이 값으로 upsert 한다 */
  sid?: string | null
  /** 재제출을 같은 행으로 모으는 키 (written 전용, P2). null 가드는 호출부가 아니라 여기서 */
  dedupKey?: string | null
  /** GAS 가 실행은 됐는데 302 응답 본문만 유실된 경우 — 시트에는 있다 */
  gasBodyLost?: boolean
  /** route=라우트 원문 / sheet=P2.5 스윕이 시트에서 역구성 */
  payloadSrc?: "route" | "sheet"
  /** 로그인 사용자 (P4). 지금은 항상 undefined — R11 비회원이 기본 */
  userId?: string | null
}

/**
 * 접수 1건을 원장에 남긴다. **멱등** — 같은 sid(또는 dedup_key)로 다시 부르면 덮어쓰지 않는다.
 * 어떤 실패도 던지지 않는다 (원칙 1).
 */
export async function recordApplication(input: RecordApplicationInput): Promise<LedgerResult> {
  const sb = supabaseAdmin()
  if (!sb) return { ok: true, skipped: "disabled" }

  const { kind, body } = input
  try {
    const { name, phone } = extractIdentity(kind, body)
    const { endsOn, purgeAfter: purge } = retention(kind, body)
    const orderNo = str(body?.orderId) || null
    const trafficSrc = str(body?.trafficSrc) || null
    // 마케팅 수신 동의(선택) — 이 값이 있으면 보유기간이 지나도 **이름·전화만** 남는다.
    // 신청서 본문은 그대로 파기된다. 보유 근거가 이 동의라, 철회하면 연락처도 지워진다.
    // ⚠ 필수 동의(consentAt)와 섞지 말 것 — 필수로 묶으면 위법이다(제22조, 0006 주석).
    // 폼은 "동의"/"미동의" 문자열을 보낸다(GAS 시트 표기와 같은 값).
    const marketingConsentAt =
      str(body?.marketingConsent) === "동의" ? str(body?.consentAt) || new Date().toISOString() : null

    const row = {
      sid: input.sid || null,
      kind,
      name,
      phone,
      payload: (body ?? {}) as Record<string, unknown>,
      payload_src: input.payloadSrc ?? "route",
      order_no: orderNo,
      user_id: input.userId ?? null,
      // 기수는 북클럽 접수에만 의미가 있다 (원데이·커피앤바는 기수 개념이 없다)
      cohort: kind === "bookclub" ? SEASON.name : null,
      // ⚠ 덮어쓰지 않고 값이 있을 때만 넣는다 — GAS 는 "최초 유입이 공이다"라
      //   재제출 때 이 칸을 보존한다. 무조건 갱신하면 시트와 값이 갈린다.
      ...(trafficSrc ? { traffic_src: trafficSrc } : {}),
      ends_on: endsOn,
      purge_after: purge,
      gas_body_lost: input.gasBodyLost ?? false,
      dedup_key: input.dedupKey || null,
      marketing_consent_at: marketingConsentAt,
    }

    // 멱등 키가 있으면 upsert(무시), 없으면 그냥 insert.
    // ⚠ onConflict 는 **컬럼 unique** 라서 동작한다 — 부분 유니크 인덱스였다면
    //   PostgREST 가 술어를 못 보내 42P10 으로 조용히 죽는다 (0005 결정 3).
    const conflictKey = input.dedupKey ? "dedup_key" : input.sid ? "sid" : null
    const q = conflictKey
      ? sb.from("applications").upsert(row, { onConflict: conflictKey, ignoreDuplicates: true })
      : sb.from("applications").insert(row)

    // ⚠ abortSignal 은 **쿼리 빌더 인스턴스마다** 걸어야 한다 (postgrest-js 가 빌더에 저장)
    const { error } = await q.abortSignal(AbortSignal.timeout(5_000))

    if (error) {
      if (error.code === "23505") return { ok: true, skipped: "duplicate" }
      return { ok: false, error: `applications: ${error.message}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * 라우트에서 부르는 안전 래퍼 — **삽입 지점이 라우트당 3곳(dev 목업 / GAS 성공 / 302 유실)**
 * 이라 복붙 누락이 나기 쉬워 규율을 한곳에 가둔다.
 *
 *  · GAS 응답이 `{success:false}` 면 **기록하지 않는다** (원칙 2 — 유령 행 방지)
 *  · kind 가 화이트리스트 밖이면 건너뛴다
 *  · 실패는 로그만 남기고 삼킨다 — 접수 응답을 절대 건드리지 않는다
 *
 * ⚠ 로그에 개인정보를 넣지 않는다 — kind·sid·에러 코드까지만.
 */
export async function recordSafe(
  kind: ApplicationKind | null,
  input: Omit<RecordApplicationInput, "kind"> & { gasData?: unknown },
): Promise<void> {
  if (!kind) return
  // GAS 가 200 으로 실패를 알린 경우 — 시트에 행이 없으므로 DB 에도 남기지 않는다.
  // 판정은 lib/gas 의 isGasRejected 하나로 통일한다 — 라우트의 응답 판정과 같은 규칙이라
  // 두 곳에 따로 적어 두면 어긋나는 순간 한쪽만 새어 유령 행이 생긴다.
  if (isGasRejected(input.gasData)) return

  try {
    const r = await recordApplication({ ...input, kind })
    if (!r.ok) console.error(`[apply-ledger] 기록 실패 (${kind}/${input.sid ?? "-"}):`, r.error)
  } catch (err) {
    console.error(`[apply-ledger] 기록 예외 (${kind}/${input.sid ?? "-"}):`, err)
  }
}

/** 서면 인터뷰 재제출을 같은 행으로 모으는 키 (P2 에서 쓴다).
 *  ⚠ `normalizePhone` 은 9자리 미만이면 null 이라 **가드 없이 문자열을 붙이면**
 *    `"written:null"` 이 되어 비정상 번호 접수가 전부 서로를 덮어쓴다(=유실). */
export function writtenDedupKey(phone?: string): string | null {
  const np = normalizePhone(phone)
  return np ? `written:${np}` : null
}

export { isLedgerEnabled }
