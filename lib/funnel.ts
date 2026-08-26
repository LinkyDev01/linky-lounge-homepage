/**
 * 퍼널 계측 — 유입 출처별 (결제 시작 수 / 제출 수) 자체 집계 (운영자 2026-08-26).
 *
 * 종전에는 결제 시작(InitiateCheckout)이 어디에도 저장되지 않아 자체 집계가
 * 불가능했다 — 픽셀·CAPI 는 Meta 로 나가기만 하고, GAS 시트는 제출만 담는다.
 * `/api/capi` 가 어차피 모든 이벤트를 받으므로, 퍼널에 쓰는 것만 골라
 * `funnel_events` 에 한 줄씩 남긴다 (마이그레이션 20260826060000).
 *
 * ⚠ **개인정보 0** — 이름·전화·IP·UA 를 저장하지 않는다. 그래서 보존기간
 *   규칙(R8·R9)의 적용 대상이 아니다. 사람 단위 분석이 필요해지면 별도 설계로.
 * ⚠ **절대 던지지 않는다** — payment/confirm 의 ledger() 와 같은 규율.
 *   계측 실패가 CAPI 응답(나아가 픽셀 미러)을 깨면 본말전도다.
 * ⚠ 멱등 — event_id unique 에 upsert(ignoreDuplicates) 라 sendBeacon 재전송·
 *   재시도에도 한 건은 한 번만 세어진다.
 * ⚠ 환경변수(SUPABASE_URL·SERVICE_ROLE_KEY) 미설정이면 조용히 꺼진다.
 */

import { supabaseAdmin } from "./supabase-server"

/**
 * 퍼널에 세는 이벤트만. 전 이벤트를 넣으면 scroll_depth·PageView 가
 * 테이블을 잡음으로 채운다 — 집계 축은 결제시작 → 신청서 → 인터뷰 확정이다.
 */
const FUNNEL_EVENTS = new Set(["InitiateCheckout", "Lead", "CompleteRegistration"])

export async function recordFunnelEvent(input: {
  eventName: string
  eventId: string
  trafficSrc?: string
  /** 초 단위 Unix (CAPI 라우트가 클램프한 값) */
  eventTimeSec: number
}): Promise<void> {
  try {
    if (!FUNNEL_EVENTS.has(input.eventName)) return
    const db = supabaseAdmin()
    if (!db) return // 미설정 — 조용히 꺼짐

    const { error } = await db.from("funnel_events").upsert(
      {
        event_id: input.eventId,
        event_name: input.eventName,
        // DB check 와 같은 형태만 통과 — 어긋나면 출처 미상(null)으로 남긴다
        traffic_src:
          input.trafficSrc && /^[a-z0-9_-]{1,32}$/.test(input.trafficSrc) ? input.trafficSrc : null,
        occurred_at: new Date(input.eventTimeSec * 1000).toISOString(),
      },
      { onConflict: "event_id", ignoreDuplicates: true },
    )
    if (error) {
      // 이벤트명·코드만 — 계측이라 남길 개인정보도 없지만 규율은 CAPI 라우트와 같게
      console.error(`[funnel] 기록 실패 ${error.code ?? "-"} (${input.eventName})`)
    }
  } catch (err) {
    console.error(`[funnel] 기록 오류 (${input.eventName}):`, err instanceof Error ? err.message : "unknown")
  }
}
