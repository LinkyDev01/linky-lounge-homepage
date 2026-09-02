/**
 * 오늘 할 일 — 고객 레코드에서 파생하는 8종 (2026-09-02, 대시보드 CRM-4 · DECISIONS "오늘 할 일 8종 확정").
 * 레퍼런스: HubSpot Overview 의 upcoming activities + 우리 상태 점검의 '손볼 행'.
 *
 * 전부 **읽기 파생**이다 — 여기서 무엇도 쓰지 않는다. 항목마다 '왜'(why)와 '무엇을'(what)을
 * 붙여 화면이 판단 없이 그대로 보여 준다. 정본이 시트인 값(진행 상태)은 거울(CRM-2)을 읽는다.
 */

import { listCustomersDetailed, type Customer } from "./customers"
import { SEASON, seasonYear } from "@/app/(main)/lazyday/season-config"

export type TodayKind =
  | "interview_today"     // 인터뷰 예정 (오늘·내일)
  | "unpaid"              // 합격 후 미결제
  | "unsubmitted"         // 결제만 하고 신청서 미제출
  | "gas_failed"          // 시트 기록 실패 — DB 만 있음
  | "dup"                 // 중복 접수
  | "result_missing"      // 인터뷰 완료 3일 경과, 결과(진행 상태) 미기록
  | "dminus1"             // 모임 D-1 안내 대상
  | "age_unverified"      // 회원 만 14세 미확인

export const TODAY_LABEL: Record<TodayKind, { why: string; group: string }> = {
  interview_today: { why: "인터뷰", group: "인터뷰 예정" },
  unpaid: { why: "결제 안내", group: "합격 후 미결제" },
  unsubmitted: { why: "재진입 링크", group: "결제만 하고 신청서 미제출" },
  gas_failed: { why: "시트 보정", group: "시트 기록 실패 — DB 만 있음" },
  dup: { why: "분류", group: "중복 접수" },
  result_missing: { why: "결과 기록", group: "인터뷰 끝났는데 결과 미기록 (3일 경과)" },
  dminus1: { why: "D-1 안내", group: "내일 모임 — 안내 대상" },
  age_unverified: { why: "만 14세 확인", group: "회원 만 14세 미확인" },
}

export type TodayItem = { kind: TodayKind; key: string; name: string | null; phone: string | null; what: string; at?: string | null }

const DAY = 86_400_000
const kstDate = (ms: number) => { const d = new Date(ms + 9 * 3600_000); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}` }

/** 내일(KST)이 이번 기수의 회차 날짜인가 — 어느 회차의 어느 요일인지도 돌려준다 */
export function tomorrowSession(now = Date.now()): { label: string; date: string } | null {
  const tomorrow = kstDate(now + DAY)
  for (const s of SEASON.sessions) {
    const i = s.dates.indexOf(tomorrow)
    if (i !== -1) return { label: `${s.label} ${SEASON.days[i]?.label ?? ""}`.trim(), date: `${seasonYear()}/${tomorrow}` }
  }
  const fifth = SEASON.fifth.date.split(" ")[0]
  if (fifth === tomorrow) return { label: SEASON.fifth.label, date: `${seasonYear()}/${tomorrow}` }
  return null
}

export function deriveToday(customers: Customer[], now = Date.now()): TodayItem[] {
  const out: TodayItem[] = []
  const soon = now + 2 * DAY
  const tomorrow = tomorrowSession(now)
  for (const c of customers) {
    if (c.flags.includes("purged")) continue
    const base = { key: c.key, name: c.name, phone: c.phone }
    const cur = c.entries.find((e) => e.cohort === SEASON.name)

    // 1) 인터뷰 예정 — 이틀 안
    for (const a of c.activities ?? []) {
      if (a.upcoming && a.type === "interview" && new Date(a.at).getTime() <= soon) out.push({ ...base, kind: "interview_today", what: a.title, at: a.at })
    }
    // 2) 합격 후 미결제
    if (cur?.stage === "accepted_unpaid") out.push({ ...base, kind: "unpaid", what: `${cur.cohort} 합격 · 시트 '${cur.sheetProgress ?? "미결제"}'` })
    // 3) 결제만 하고 신청서 미제출
    if (c.flags.includes("unsubmitted")) out.push({ ...base, kind: "unsubmitted", what: (c.orders ?? []).filter((o) => !o.applicationSubmitted).map((o) => `${o.items.map((i) => i.name).join(", ")} · ${o.orderNo}`).join(" / ") || "주문 있음" })
    // 4) 시트 기록 실패
    if (c.flags.includes("gas_failed")) out.push({ ...base, kind: "gas_failed", what: (c.applications ?? []).map((a) => a.statusNote).find(Boolean) ?? "GAS 응답 유실" })
    // 5) 중복
    if (c.flags.includes("dup")) out.push({ ...base, kind: "dup", what: `${cur?.cohort ?? ""} 신청 ${c.counts.applications}건 — 분류로 정리` })
    // 6) 인터뷰 끝났는데 결과 미기록 — 3일 경과, 시트 진행 상태 없음
    if (cur?.stage === "interviewed" && !cur.sheetProgress && c.lastInterviewAt && now - new Date(c.lastInterviewAt).getTime() > 3 * DAY) {
      out.push({ ...base, kind: "result_missing", what: `인터뷰 ${kstDate(new Date(c.lastInterviewAt).getTime())} · 시트 '진행 상태' 비어 있음`, at: c.lastInterviewAt })
    }
    // 7) 모임 D-1 — 결제 완료·참가 중
    if (tomorrow && cur && (cur.stage === "paid" || cur.stage === "attending")) out.push({ ...base, kind: "dminus1", what: `${tomorrow.label} · ${tomorrow.date}` })
    // 8) 회원 만 14세 미확인
    if (c.member && c.ageVerified === false) out.push({ ...base, kind: "age_unverified", what: "로그인 계정 있음 · 확인 전" })
  }
  const order: TodayKind[] = ["interview_today", "dminus1", "unpaid", "result_missing", "unsubmitted", "gas_failed", "dup", "age_unverified"]
  return out.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || (a.at ?? "").localeCompare(b.at ?? ""))
}

/** 서버에서 한 번에 — 상세(활동 포함)로 조립한 뒤 파생 */
export async function buildToday(): Promise<{ ok: true; items: TodayItem[]; tomorrow: ReturnType<typeof tomorrowSession> } | { ok: false; error: string }> {
  const r = await listCustomersDetailed()
  if (!r.ok) return r
  return { ok: true, items: deriveToday(r.customers), tomorrow: tomorrowSession() }
}
