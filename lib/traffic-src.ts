/**
 * 유입 출처(traffic source) 캡처 — 프로필 경유 vs 광고 직행 (운영자 2026-08-24).
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
  if (readStored()) return // first-touch — 이미 잡혔다
  try {
    const payload: Stored = { v: classify(), t: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    /* 저장 불가 환경 무시 */
  }
}

/** 저장된 출처. 없거나 만료됐으면 null */
export function readTrafficSrc(): string | null {
  if (typeof window === "undefined") return null
  return readStored()?.v ?? null
}
