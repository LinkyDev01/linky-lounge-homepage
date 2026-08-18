import { NextRequest, NextResponse } from "next/server"

/**
 * 전환 API(CAPI) 중계 — 브라우저가 쏜 전환을 서버에서 한 번 더 Meta 로 보낸다.
 *
 * 왜 필요한가 (2026-08-18):
 * 차단기·iOS 추적 방지가 있는 브라우저에서는 `fbevents.js` 자체가 로드되지 않아
 * 전환이 **통째로 유실된다**. 서버 전송은 그 구간을 메운다. 같은 전환이 브라우저·
 * 서버 양쪽에서 들어오므로 Meta 가 `event_id` 로 합친다 — 그래서 lib/meta-pixel.ts 가
 * 모든 호출에 eventID 를 붙여 두었고, 여기서 같은 값을 그대로 넘긴다.
 *
 * ⚠ **개인 식별자는 보내지 않는다** (운영자 결정 2026-08-18, B안).
 *   해시된 전화번호·이메일을 실으면 Meta 가 자기네 이용자 매칭에 쓰므로 위탁이 아니라
 *   **제3자 제공**이 되고, 신청 폼에 동의 체크박스가 하나 더 붙어야 한다. 폼 이탈이
 *   늘어나는 대가가 얻는 것보다 크다고 봤다. 대신 쿠키(`_fbp`)와 **광고 클릭 ID**
 *   (`_fbc` / URL 의 `fbclid`) 로 붙인다 — "이 전환이 어느 광고에서 왔나"는 전화번호가
 *   아니라 클릭 ID 가 답하므로, 광고 성과 측정이라는 목적에는 이걸로 충분하다.
 *   → 현행 개인정보처리방침 제7조(쿠키 등 자동 수집 장치)의 범위 안이라 방침 개정도
 *     동의 추가도 필요 없다. 식별자를 얹으려면 제4조·제6조 개정이 **선행**되어야 한다.
 *
 * ⚠ 토큰이 없으면 아무것도 하지 않는다 — 배포해도 무해하다.
 */

export const runtime = "nodejs"
// 매 요청 실행 — 캐시되면 전환이 한 번만 나가고 끝난다
export const dynamic = "force-dynamic"

const PIXEL_ID = "1691559202269440"
const GRAPH_VERSION = "v21.0"

/** 픽셀과 같은 도메인 게이트 — linkylounge.com 유입이 섞이면 안 된다 (2026-08-18) */
const ALLOWED_HOSTS = ["lazyday-bookclub.com", "lazy-club.com"]

/** 중계 대상은 전환 3종뿐. PageView·ViewContent·스크롤은 양만 많고 실익이 없다 */
const ALLOWED_EVENTS = new Set(["Lead", "CompleteRegistration", "InitiateCheckout"])

/** custom_data 로 넘길 파라미터 화이트리스트 — 클라이언트가 보낸 걸 그대로 흘리지 않는다 */
const ALLOWED_PARAMS = new Set([
  "content_name",
  "content_type",
  "content_category",
  "currency",
  "value",
  "num_items",
  "status",
])

function hostAllowed(raw: string | null): boolean {
  if (!raw) return false
  try {
    const host = new URL(raw).hostname
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}

/** Vercel 엣지가 실 클라이언트 IP 를 헤더로 넘긴다. 첫 항목이 원 발신자 */
function clientIp(req: NextRequest): string | undefined {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return first
  }
  return req.headers.get("x-real-ip") ?? undefined
}

export async function POST(req: NextRequest) {
  const token = process.env.META_CAPI_TOKEN
  // 미설정 = 기능 꺼짐. 조용히 성공으로 답한다 (클라이언트가 재시도하지 않게)
  if (!token) return new NextResponse(null, { status: 204 })

  // 우리 사이트에서 온 요청인지 — origin 이 없으면(직접 호출) 거절
  if (!hostAllowed(req.headers.get("origin"))) {
    return new NextResponse(null, { status: 204 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const event = typeof b.event === "string" ? b.event : ""
  const eventID = typeof b.eventID === "string" ? b.eventID : ""
  if (!ALLOWED_EVENTS.has(event) || !eventID) {
    return new NextResponse(null, { status: 204 })
  }

  // 이벤트가 일어난 페이지 — 우리 도메인 것만 인정한다
  const sourceUrl = typeof b.url === "string" && hostAllowed(b.url) ? b.url : undefined

  const custom: Record<string, string | number> = {}
  const rawParams = (b.params ?? {}) as Record<string, unknown>
  for (const [k, v] of Object.entries(rawParams)) {
    if (!ALLOWED_PARAMS.has(k)) continue
    if (typeof v === "string" || typeof v === "number") custom[k] = v
    else if (typeof v === "boolean") custom[k] = v ? 1 : 0
  }

  const userData: Record<string, string> = {}
  const ip = clientIp(req)
  if (ip) userData.client_ip_address = ip
  const ua = req.headers.get("user-agent")
  if (ua) userData.client_user_agent = ua
  if (typeof b.fbp === "string" && b.fbp) userData.fbp = b.fbp
  if (typeof b.fbc === "string" && b.fbc) userData.fbc = b.fbc

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventID,
        action_source: "website",
        ...(sourceUrl ? { event_source_url: sourceUrl } : {}),
        user_data: userData,
        ...(Object.keys(custom).length ? { custom_data: custom } : {}),
      },
    ],
  }
  // 이벤트 테스트 탭으로 흘려보고 싶을 때만 — 평시엔 미설정
  if (process.env.META_CAPI_TEST_CODE) {
    payload.test_event_code = process.env.META_CAPI_TEST_CODE
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    )
    if (!res.ok) {
      // 토큰 만료·권한 회수를 알아채려면 남겨야 한다. 토큰 자체는 절대 로그에 넣지 않는다
      const text = await res.text().catch(() => "")
      console.error(`[meta-capi] ${event} 전송 실패 ${res.status}: ${text.slice(0, 300)}`)
    }
  } catch (e) {
    console.error(`[meta-capi] ${event} 전송 예외:`, e)
  }

  // 결과와 무관하게 204 — 전환 추적 때문에 사용자 화면이 영향받으면 안 된다
  return new NextResponse(null, { status: 204 })
}
