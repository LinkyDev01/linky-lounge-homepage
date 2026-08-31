import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { recordFunnelEvent } from "@/lib/funnel"

/**
 * Meta 전환 API(CAPI) 서버 미러 (운영자 지시 2026-08-24).
 *
 * 브라우저 픽셀을 **교체하는 게 아니라 보완**한다. 이벤트 관리자 진단 실측으로
 * 최근 7일 서버 전송이 픽셀보다 1,078건 적었다 — 차단기가 `fbevents.js`(외부 요청)를
 * 막아도 인라인 스니펫이 만든 fbq 스텁은 살아 있어 `lib/meta-pixel.ts` 의 래퍼는
 * 정상 발화하고, 그 미러는 **같은 오리진**인 이 엔드포인트로 들어온다. 그렇게 회수한다.
 *
 * ⚠ 중복 제거의 유일한 근거는 `event_id` — 브라우저 fbq 의 `eventID` 와 **같은 값**이
 *   와야 Meta 가 한 건으로 합친다. 래퍼가 한 번 만든 값을 양쪽에 쓰므로 그 구조를 깨지 말 것.
 *   (이벤트 관리자에 출처 불명의 "전환 API · Web-only" 소스가 이미 있는데, 그쪽과의
 *   충돌도 event_id 대조로 흡수된다)
 *
 * ⚠ 이 라우트는 **부가 기능**이다 — payment/confirm 의 ledger() 와 같은 규율로,
 *   Meta 전송이 실패해도 절대 던지지 않고 200 을 돌려준다. 클라이언트도
 *   fire-and-forget 이라 응답을 보지 않는다.
 *
 * ⚠ 개인정보: 전화번호 원문은 **이 파일 안에서 즉시 해싱**되고 어떤 경로로도 로그에
 *   남기지 않는다. 로그에 남기는 건 상태코드·fbtrace_id·이벤트명뿐.
 */

// crypto 해싱이 필요해 Node 런타임 고정 (엣지에는 node:crypto 가 없다)
export const runtime = "nodejs"

// ⚠ app/layout.tsx L11 의 META_PIXEL_ID 와 **같은 값**이어야 한다.
//    layout 의 상수는 export 되지 않고, 거기서 import 하면 폰트·메타데이터 의존이
//    이 라우트에 딸려온다 — 그래서 값을 복제하고 동기화는 이 주석으로 강제한다.
//    픽셀을 교체할 일이 생기면 **두 곳을 같이** 고칠 것.
const PIXEL_ID = "1691559202269440"

// 서버 전용 시크릿 — NEXT_PUBLIC_ 을 붙이면 빌드 타임에 클라이언트 번들로 인라인된다.
// 붙여넣기 과정에서 섞이는 앞뒤 공백·줄바꿈 방어로 trim (admin/blocks 관례).
// 미설정이면 이 기능은 **조용히 꺼진다** (lib/supabase-server 의 규약과 같다).
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN?.trim()

// 테스트 이벤트 코드 — 이벤트 관리자 '테스트 이벤트' 탭에서 발급한다.
// ⚠ 프로덕션에 설정하면 그 이벤트는 **실제 집계에서 빠진다**. Preview/로컬 전용.
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE?.trim()

// Graph API 버전은 약 2년 뒤 만료된다 — 그때 이 상수만 올리면 된다
const GRAPH_URL = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`

/** 브라우저발 교차 사이트 남용만 막는 가벼운 방어. Origin 없는 요청(curl)은 통과 — 검증 동선 보존 */
const ALLOWED_ORIGIN_HOSTS = [
  "lazyday-bookclub.com",
  "lazy-club.com",
  "linkylounge.com",
  ".vercel.app",
  "localhost",
]

/** 본문 상한 — 정상 이벤트는 1KB 안팎이다 */
const MAX_BODY_BYTES = 16 * 1024

/** Meta 는 7일 지난 이벤트를 거부한다 — 하루 여유를 두고 자른다 */
const MAX_EVENT_AGE_SEC = 6 * 24 * 60 * 60

const EVENT_NAME_RE = /^[\w-]{1,50}$/
const EVENT_ID_RE = /^[\w-]{8,64}$/

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex")

/**
 * 한국 전화번호 → E.164 숫자열 (`010-1234-5678` → `821012345678`).
 * 형식이 불명이면 **null** — 틀린 해시를 보내면 매칭이 되기는커녕 품질 점수만 깎인다.
 */
function normalizePhoneKR(raw: string): string | null {
  const d = raw.replace(/\D/g, "")
  if (d.length < 9 || d.length > 14) return null
  if (d.startsWith("82")) return d
  if (d.startsWith("0")) return "82" + d.slice(1)
  return null
}

/** custom_data 정제 — 픽셀에 보낸 값을 그대로 옮기되 비정상 크기만 자른다 */
function sanitizeCustomData(input: unknown): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  if (!input || typeof input !== "object" || Array.isArray(input)) return out
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= 25) break
    if (typeof v === "number" || typeof v === "boolean") out[k] = v
    else if (typeof v === "string") out[k] = v.slice(0, 300)
  }
  return out
}

/** Origin 이 있는데 우리 도메인이 아니면 조용히 버린다 */
function originAllowed(origin: string | null): boolean {
  if (!origin) return true // curl·sendBeacon 일부 경로 — 통과
  try {
    const host = new URL(origin).hostname
    return ALLOWED_ORIGIN_HOSTS.some((h) =>
      h.startsWith(".") ? host.endsWith(h) : host === h || host.endsWith("." + h),
    )
  } catch {
    return false
  }
}

type Payload = {
  event_name?: unknown
  event_id?: unknown
  event_time?: unknown
  url?: unknown
  custom_data?: unknown
  user?: { phone?: unknown; external_id?: unknown }
}

export async function POST(req: NextRequest) {
  // 본문은 크기를 먼저 재야 해서 text() 로 받는다
  let raw: string
  try {
    raw = await req.text()
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
  }
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ success: true })

  let body: Payload
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
  }

  if (!originAllowed(req.headers.get("origin"))) return NextResponse.json({ success: true })

  const eventName = typeof body.event_name === "string" ? body.event_name : ""
  const eventId = typeof body.event_id === "string" ? body.event_id : ""
  if (!EVENT_NAME_RE.test(eventName) || !EVENT_ID_RE.test(eventId)) {
    return NextResponse.json({ success: true })
  }

  // 클라이언트는 ms 로 보낸다 — 초로 바꾸고, 시계가 틀어진 기기를 감안해 클램프
  const nowSec = Math.floor(Date.now() / 1000)
  const sentMs = typeof body.event_time === "number" ? body.event_time : Date.now()
  let eventTime = Math.floor(sentMs / 1000)
  if (!Number.isFinite(eventTime) || eventTime > nowSec) eventTime = nowSec
  if (nowSec - eventTime > MAX_EVENT_AGE_SEC) return NextResponse.json({ success: true })

  // ── 퍼널 계측 (2026-08-26) — 유입 출처별 결제시작/제출 자체 집계.
  //    Meta 토큰과 **무관하게** 남긴다(그래서 토큰 게이트보다 앞). 개인정보 0,
  //    event_id 멱등, 실패해도 절대 던지지 않는다 (lib/funnel.ts).
  const trafficSrcRaw = (body.custom_data as Record<string, unknown> | undefined)?.traffic_src
  await recordFunnelEvent({
    eventName,
    eventId,
    trafficSrc: typeof trafficSrcRaw === "string" ? trafficSrcRaw : undefined,
    eventTimeSec: eventTime,
  })

  // 토큰 미설정 = Meta 전송 꺼짐. 계측은 위에서 이미 남았다 (사이트 흐름에 영향 0)
  if (!ACCESS_TOKEN) return NextResponse.json({ success: true })

  const sourceUrl = typeof body.url === "string" ? body.url.slice(0, 2000) : ""

  // ── user_data
  // ⚠ em/ph/external_id 만 SHA-256(소문자 hex). fbp·fbc·IP·UA 는 **평문** —
  //   해싱하면 매칭이 깨진다. (이메일은 이 사이트가 아예 수집하지 않아 em 은 항상 부재)
  const userData: Record<string, string | string[]> = {}

  const phoneRaw = typeof body.user?.phone === "string" ? body.user.phone : ""
  if (phoneRaw) {
    const e164 = normalizePhoneKR(phoneRaw)
    if (e164) userData.ph = [sha256(e164)]
    // 정규화 실패 시 조용히 생략 — 원문은 어디에도 남기지 않는다
  }

  const extId = typeof body.user?.external_id === "string" ? body.user.external_id.trim() : ""
  if (extId) userData.external_id = [sha256(extId)]

  const fbp = req.cookies.get("_fbp")?.value
  if (fbp) userData.fbp = fbp

  // fbc 는 쿠키가 정본. 없으면 **광고 클릭 파라미터로 합성**한다 —
  // 광고에서 막 들어와 픽셀이 쿠키를 굽기 전이라도 클릭 귀속이 살아난다.
  const fbc = req.cookies.get("_fbc")?.value
  if (fbc) {
    userData.fbc = fbc
  } else if (sourceUrl) {
    try {
      const fbclid = new URL(sourceUrl).searchParams.get("fbclid")
      if (fbclid) userData.fbc = `fb.1.${Date.now()}.${fbclid}`
    } catch {
      /* URL 파싱 실패는 무시 */
    }
  }

  // Vercel 은 원 클라이언트 IP 를 x-forwarded-for 맨 앞에 둔다
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim()
  if (ip) userData.client_ip_address = ip
  const ua = req.headers.get("user-agent")
  if (ua) userData.client_user_agent = ua

  // ── Meta 전송. 실패해도 절대 던지지 않고 200 을 돌려준다.
  //    클라이언트가 응답을 보지 않으므로 여기서 await 해도 사용자 흐름과 무관하고,
  //    응답 후 백그라운드 작업은 서버리스에서 동결될 수 있어 기다리는 편이 확실하다.
  try {
    const res = await fetch(GRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ⚠ 토큰은 **본문으로만** — 쿼리스트링에 실으면 접근 로그·프록시에 남는다
      body: JSON.stringify({
        data: [
          {
            event_name: eventName,
            event_time: eventTime,
            event_id: eventId,
            ...(sourceUrl ? { event_source_url: sourceUrl } : {}),
            action_source: "website",
            user_data: userData,
            custom_data: sanitizeCustomData(body.custom_data),
          },
        ],
        // ⚠ 미설정이면 키 자체가 없어야 한다 — 빈 문자열을 보내면 집계에서 빠진다
        ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
        access_token: ACCESS_TOKEN,
      }),
      signal: AbortSignal.timeout(5_000),
    })
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      // 남기는 건 상태코드·fbtrace_id·이벤트명뿐 — 본문·user_data·토큰은 절대 금지
      console.error(
        `[capi] Meta 전송 실패 ${res.status} fbtrace_id=${data?.error?.fbtrace_id ?? "-"} (${eventName})`,
      )
    } else if (TEST_EVENT_CODE) {
      // 검증용 — 테스트 코드가 있을 때만. 운영에서는 성공을 로그하지 않는다
      console.log(`[capi] test 전송 ${eventName} events_received=${data?.events_received ?? "-"}`)
    }
  } catch (err) {
    console.error(`[capi] Meta 호출 오류 (${eventName}):`, err instanceof Error ? err.message : "unknown")
  }

  return NextResponse.json({ success: true })
}
