import { readTrafficSrc } from "./traffic-src"

type FbqStandard =
  | "PageView"
  | "Lead"
  | "ViewContent"
  | "Contact"
  | "CompleteRegistration"
  | "InitiateCheckout"

/** 픽셀 파라미터 — status 처럼 불리언을 받는 표준 파라미터가 있어 boolean 을 포함한다 */
export type PixelParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * 이벤트 단위 고유 ID.
 *
 * 지금은 브라우저 픽셀만 쓰지만, 나중에 전환 API(서버 발화)를 붙이면 같은 전환이
 * 브라우저·서버 양쪽에서 들어와 **두 번 집계된다**. Meta 는 `eventID` 가 같은 쌍을
 * 하나로 합쳐서(중복 제거) 처리하므로, 지금부터 모든 호출에 붙여 둔다.
 * 서버 발화를 붙이는 시점에 같은 값을 CAPI 의 `event_id` 로 넘기면 된다.
 *
 * crypto.randomUUID 는 보안 컨텍스트(https·localhost)에서만 있어 폴백을 둔다.
 */
function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    /* 폴백으로 */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 서버 미러(전환 API)로만 보내는 부가 정보.
 * ⚠ fbq 페이로드에는 **절대 섞이지 않는다** — 브라우저 픽셀의 파라미터는 불변이어야 한다.
 */
export type CapiExtra = {
  /** 전화번호 원문. 같은 오리진 HTTPS 로만 가고 서버가 즉시 SHA-256 해싱한다 */
  phone?: string
  /** 내부 식별자(현재는 원데이 토크 orderId) — 서버에서 해싱 */
  externalId?: string
  /**
   * 유입 출처(profile·ad_direct·organic). **서버 custom_data 에만** 얹힌다 —
   * fbq 파라미터에 섞으면 브라우저 픽셀의 기존 시계열이 깨진다.
   */
  trafficSrc?: string
}

/**
 * 전환 API 서버 미러 (2026-08-24).
 *
 * fbq 와 **같은 event_id** 를 같은 페이로드에 실어 `/api/capi` 로 보낸다 — Meta 는 이
 * 값이 같은 브라우저·서버 쌍을 한 건으로 합치므로 이중 집계가 되지 않는다.
 * 차단기가 `fbevents.js` 를 막아 픽셀 요청이 죽어도 이쪽은 같은 오리진이라 살아 나간다.
 *
 * ⚠ fire-and-forget — 절대 await 하지 않는다. 폼 제출이 이것 때문에 지연되면 안 된다.
 * ⚠ sendBeacon 을 먼저 쓰는 이유: 링크 이동으로 문서가 버려져도 전송이 살아남는다
 *   (`<a>` 기본 이동이 픽셀 요청을 취소했던 2026-08-18 사례와 같은 함정).
 *   반환 false 는 브라우저 큐가 찼다는 뜻이라 fetch(keepalive) 로 폴백한다.
 */
function mirror(event: string, params: PixelParams, eventID: string, extra?: CapiExtra) {
  try {
    const body = JSON.stringify({
      event_name: event,
      event_id: eventID,
      event_time: Date.now(), // ms — 서버가 초로 바꾼다
      url: location.href, // event_source_url + fbclid 파싱 소스
      // ⚠ 서버 전송분에만 traffic_src 를 얹는다. 위 window.fbq 호출은 params 원본
      //   그대로라 브라우저 픽셀 파라미터는 불변이다 (운영자 2026-08-26).
      custom_data: extra?.trafficSrc ? { ...params, traffic_src: extra.trafficSrc } : params,
      ...(extra?.phone || extra?.externalId
        ? { user: { phone: extra.phone, external_id: extra.externalId } }
        : {}),
    })
    if (
      typeof navigator !== "undefined" &&
      navigator.sendBeacon &&
      navigator.sendBeacon("/api/capi", new Blob([body], { type: "application/json" }))
    ) {
      return
    }
    void fetch("/api/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    })
  } catch {
    // 미러 실패는 사용자 흐름·픽셀에 영향을 주지 않는다
  }
}

/**
 * 표준 이벤트. 발화하면 그 이벤트의 eventID 를 돌려준다 —
 * 호출부가 서버로 같이 넘겨야 할 때 쓴다. 픽셀이 없으면(=이 도메인에서 미로드)
 * 아무 일도 하지 않고 null.
 *
 * 세 번째 인자는 서버 미러 전용 부가 정보(선택) — 전화번호를 아는 지점만 넘긴다.
 * ⚠ 미러는 이 함수 안에서만 일어난다. 그래야 호출부의 발화 조건(sim 가드,
 *   재제출 중복 차단 등)을 **그대로 상속**하고 우회가 생기지 않는다.
 */
export function trackStandard(
  event: FbqStandard,
  params?: PixelParams,
  capi?: CapiExtra,
): string | null {
  if (typeof window === "undefined" || !window.fbq) return null
  const eventID = newEventId()
  window.fbq("track", event, params ?? {}, { eventID })
  mirror(event, params ?? {}, eventID, capi)
  return eventID
}

/** 커스텀 이벤트 — 표준과 같은 규칙으로 eventID 를 붙이고 서버로 미러한다 */
export function trackCustom(event: string, params?: PixelParams, capi?: CapiExtra): string | null {
  if (typeof window === "undefined" || !window.fbq) return null
  const eventID = newEventId()
  window.fbq("trackCustom", event, params ?? {}, { eventID })
  mirror(event, params ?? {}, eventID, capi)
  return eventID
}

/**
 * 신청 CTA 클릭 — 표준 `InitiateCheckout`.
 *
 * ⚠ 발화 지점이 왜 여기인가 (2026-08-18):
 * 이 이벤트는 원래 코드에 없었고 **메타 이벤트 설정 도구 규칙**(버튼 텍스트
 * "신청하기")이 만들고 있었다. 30일 150건. 그 규칙을 정리하면서 코드로 옮기는데,
 * 광고 세트 B3 가 이 이벤트를 최적화 기준으로 물고 있어 **같은 지점**이어야 한다.
 * 규칙이 잡던 "신청하기" 버튼은 홈 하단 스티키 CTA(`4기 신청하기`)와 상단 내비
 * (`신청하기`)다 — 신청 폼을 다 채운 뒤가 아니라 **신청 페이지로 들어가는 클릭**.
 *
 * 처음엔 완료 화면의 인터뷰 진입 버튼에 달았는데, 그건 퍼널상 Lead 보다도 뒤라
 * 건수가 급감한다. 메타는 광고 세트당 주 50건 안팎을 봐야 학습을 마치므로,
 * 지점을 잘못 옮기면 B3 가 학습 단계를 벗어나지 못한다.
 *
 * ⚠ 한 사람이 여러 번 눌러도 그대로 여러 번 쏜다 — 종전 규칙과 같은 성격이어야
 *   광고 세트가 보던 신호가 유지된다. 세션 단위로 묶으면 건수가 줄어 학습이 흔들린다.
 * ⚠ 의미상 여기서 결제가 일어나지는 않는다(북클럽은 인터뷰 통과 후 사이트 밖 결제).
 *   '결제 시작'은 광고 세트 호환을 위한 이름이고 실제로는 '신청 착수'다.
 */
export function trackApplyCtaClick() {
  return trackStandard(
    "InitiateCheckout",
    {
      content_name: "lazyday_bookclub_4",
      value: 150000,
      currency: "KRW",
      num_items: 1,
    },
    // 유입 출처는 **서버 전송분에만** (2026-08-26). 프로필 경유 vs 광고 직행의
    // 결제시작→제출 전환율을 갈라 보기 위한 계측이라 이 이벤트 하나에만 붙인다.
    { trafficSrc: readTrafficSrc() ?? undefined },
  )
}
