/**
 * 유입 출처(traffic source) 캡처 — 프로필 경유 vs 광고 직행 (운영자 2026-08-26).
 *
 * 목적: 결제 시작 → 서면 인터뷰 제출 전환율을 **유입 경로별로** 갈라 보기 위한 계측.
 * 인스타 프로필 바이오는 `lazyday-bookclub.com/ig` 를 걸고, 미들웨어가 `/?src=profile`
 * 로 302 시킨다. 광고는 대개 `fbclid` 를 달고 랜딩에 직행한다.
 *
 * ⚠ **first-touch 원칙** — 한 번 잡은 출처는 만료 전까지 덮어쓰지 않는다.
 *   손님이 프로필로 들어왔다가 나중에 광고를 다시 눌러 들어와도 최초 경로가 공이다.
 *
 * ⚠ **북클럽 도메인에서만 동작한다.** 이 모듈을 호출하는 MetaPixelTracker 는 전 도메인
 *   (linkylounge.com 포함)에서 렌더되는데, 거기 유입까지 섞이면 지표가 오염된다
 *   — 픽셀이 도메인 게이트를 둔 것과 같은 이유(2026-08-18, 28일 248건 오염).
 *
 * ⚠ 저장 실패(프라이빗 모드 등)는 전부 삼킨다. 계측은 부가 기능이라 화면을 깨면 안 된다.
 *
 * ── 2026-09-01 보완 (실측 5일치로 드러난 결함 두 가지) ──
 * ① **쿠키 병행**: localStorage 가 막힌 환경(프라이빗 모드·인앱 WebView)에서 결제시작의
 *    약 19% 가 출처 없이 기록됐다. 재현 결과 이벤트는 정상 발화하고 값만 비었다.
 *    이제 저장·조회를 **localStorage 와 쿠키 양쪽**으로 한다 — 하나만 살아도 출처가 남고,
 *    쿠키는 서버(`/api/capi`)가 직접 읽을 수 있어 클라이언트가 못 읽어도 건진다.
 * ② **인터뷰 경로 재캡처 금지**: 인앱→외부 브라우저로 넘어간 손님이 인터뷰 페이지에서
 *    새로 캡처돼 `organic` 으로 **오분류**됐다(그 결과 organic 만 CR>Lead 로 퍼널이 뒤집혔다).
 *    그 경로는 신청서보다 아래라 저장값 없이 도달했다면 진짜 출처는 이전 세션에 있다 —
 *    거기서 새로 잡으면 반드시 거짓값이므로, 잡지 않고 비워 둔다(정직한 null).
 */

/** 북클럽 트리 관례 — lazyday_* 스네이크케이스 (lazyclub 트리의 lzc-* 와 구분) */
const KEY = "lazyday_src"

/** 30일. 그 이상 지난 유입은 이번 방문의 출처로 보기 어렵다 */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

/**
 * `?src=` 로 받은 값은 그대로 Meta 의 custom_data 로 나간다 — 쓰레기 값이 지표에
 * 섞이지 않게 좁게 통과시킨다. 벗어나면 출처 미상 취급.
 */
const SRC_RE = /^[a-z0-9_-]{1,32}$/

type Stored = { v: string; t: number }

/**
 * 신규 캡처를 하지 않는 경로 (조회는 정상).
 * 인터뷰는 신청서 **다음** 단계라, 저장된 출처 없이 여기 도달했다면 그 방문자의 진짜
 * 출처는 이전 세션에 있다 — 여기서 잡은 값은 반드시 거짓이다.
 * ⚠ `/apply`(신청서 자체)는 제외하지 않는다 — 알림톡 링크 등으로 여기가 진짜 첫 접점일 수 있다.
 * 북클럽 도메인은 rewrite 전 경로(`/apply/...`)로 보이고, 내부 경로(`/lazyday/apply/...`)도 함께 본다.
 */
function isNoCapturePath(): boolean {
  try {
    const p = window.location.pathname
    return p.startsWith("/apply/interview") || p.startsWith("/lazyday/apply/interview")
  } catch {
    return false
  }
}

/** 쿠키 읽기 — localStorage 가 막힌 환경의 대비책 */
function readCookie(): string | null {
  try {
    for (const part of document.cookie.split(";")) {
      const [k, ...rest] = part.trim().split("=")
      if (k !== KEY) continue
      const v = decodeURIComponent(rest.join("=")).trim().toLowerCase()
      return SRC_RE.test(v) ? v : null
    }
  } catch {
    /* 쿠키 접근 자체가 막힌 환경 */
  }
  return null
}

/**
 * 쿠키 쓰기. 값은 **출처 문자열만** 담는다 — 만료는 max-age 가 관리하므로
 * localStorage 처럼 시각을 함께 넣을 필요가 없고, 서버가 그대로 읽을 수 있다.
 * ⚠ Secure 는 https 에서만 — 로컬 검증(http)에서 쿠키가 통째로 버려지지 않게 한다.
 */
function writeCookie(value: string): void {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie =
      `${KEY}=${encodeURIComponent(value)}; Max-Age=${Math.floor(MAX_AGE_MS / 1000)}; Path=/; SameSite=Lax${secure}`
  } catch {
    /* 저장 불가 환경 무시 */
  }
}

/** 이 도메인에서만 캡처한다 (www 포함, 서브도메인 허용) */
function isBookclubHost(): boolean {
  try {
    return window.location.hostname.endsWith("lazyday-bookclub.com")
  } catch {
    return false
  }
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Stored
    if (!parsed || typeof parsed.v !== "string" || typeof parsed.t !== "number") return null
    if (Date.now() - parsed.t > MAX_AGE_MS) return null // 만료 = 없는 것으로 취급
    return parsed
  } catch {
    return null
  }
}

/** 현재 URL 로 출처를 판정한다: ?src= → fbclid 있으면 광고 직행 → 아니면 자연 유입 */
function classify(): string {
  try {
    const q = new URLSearchParams(window.location.search)
    const src = (q.get("src") ?? "").trim().toLowerCase()
    if (src && SRC_RE.test(src)) return src
    if (q.get("fbclid")) return "ad_direct"
  } catch {
    /* 판정 불가 → 자연 유입 */
  }
  return "organic"
}

/**
 * 첫 방문 시 출처를 잡아 저장한다. 이미 잡힌 값이 있으면 **덮어쓰지 않는다**.
 * 매 페이지 로드에 불려도 안전하다.
 */
export function captureTrafficSrc(): void {
  if (typeof window === "undefined") return
  if (!isBookclubHost()) return
  if (isNoCapturePath()) return // 인터뷰 경로에서 새로 잡으면 거짓값이 된다
  // first-touch — 어느 저장소에든 이미 잡혀 있으면 덮어쓰지 않는다
  if (readStored() || readCookie()) return
  const value = classify()
  // 양쪽에 쓴다. 하나가 던져도 다른 하나는 남는다.
  try {
    const payload: Stored = { v: value, t: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    /* 저장 불가 환경 무시 */
  }
  writeCookie(value)
}

/**
 * 저장된 출처. 없거나 만료됐으면 null.
 * localStorage 우선(만료 판정이 정확하다) → 실패·부재면 쿠키.
 */
export function readTrafficSrc(): string | null {
  if (typeof window === "undefined") return null
  return readStored()?.v ?? readCookie()
}
