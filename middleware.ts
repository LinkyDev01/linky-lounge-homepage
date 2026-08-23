import { NextRequest, NextResponse } from "next/server"

// 레이지데이 북클럽 전용 도메인 — 루트 매핑(서브도메인 없음).
// 이 호스트로 들어오면 내부 /lazyday/* 로 rewrite 해서, 주소창은 깔끔하게 유지한다.
// 예) lazyday-bookclub.com/apply  →  (내부) /lazyday/apply
const BOOKCLUB_HOSTS = new Set([
  "lazyday-bookclub.com",
  "www.lazyday-bookclub.com",
])

// 컷오버: 기존 linkylounge.com/lazyday/* 를 새 책클럽 도메인으로 영구 이전(301)
const LINKYLOUNGE_HOSTS = new Set([
  "linkylounge.com",
  "www.linkylounge.com",
])
const BOOKCLUB_ORIGIN = "https://www.lazyday-bookclub.com" // 책클럽 정본(현 Vercel primary)

// 레이지 클럽 신규 도메인 (운영자 2026-08-06 구입) — coming soon 단계:
// 모든 페이지 요청을 coming soon 페이지로 rewrite (자산·API는 matcher/분기에서 제외)
const LAZYCLUB_HOSTS = new Set(["lazy-club.com", "www.lazy-club.com"])
/** 레이지클럽 실트리 프리픽스 (2026-08-21 프리뷰 졸업 — base-path.ts BASE 와 같은 값) */
const LAZYCLUB_BASE = "/lazyclub"
/** 구 시안 경로 2종 — 301 로 새 경로에 넘긴다 (공유된 링크·북마크 보호) */
const LAZYCLUB_OLD_PREFIXES = ["/preview/lazyclub-4b073000ddec094f", "/lazyday/preview/lazyclub-4b073000ddec094f"]
/** 전체보기(홈) — 트리 루트가 아니라 이름 있는 라우트 (base-path.ts HOME 과 같은 값).
 *  lazy-club.com 에서 프리픽스를 떼면 트리 루트가 `/`(= 랜딩)와 겹쳐 홈이 갈 곳을 잃는다 */
const LAZYCLUB_HOME = `${LAZYCLUB_BASE}/all`
/** URL 명명 규칙 확정 (2026-08-21): 슬러그 = **내비 라벨의 영문 대응어**.
 *  전체보기=all · 모임=meetings · 제품=products · 사람=people · 일정=schedule · 기록=records.
 *  개명 전 슬러그(shop/calendar/archive)와 구 트리 루트는 여기서 301 로 흡수한다 */
const LAZYCLUB_RENAMED: Record<string, string> = {
  shop: "products",
  calendar: "schedule",
  archive: "records",
}
/** 사람 슬러그 개명 (2026-08-22 운영자: 이름 대신 **순번**) — 구 주소를 301 로 살린다.
 *  ⚠ 인스타 링크인바이오가 `/people/andongmin` 을 가리키고 있다. 끊으면 그 유입이 죽는다 */
const LAZYCLUB_PEOPLE_RENAMED: Record<string, string> = {
  andongmin: "00000001",
  gorden: "00000002",
}

/** `/lazyclub/...`(또는 lazy-club.com 의 루트 상대 경로)에서 구 슬러그를 새 슬러그로.
 *  바꿀 게 없으면 null — 호출부가 리다이렉트 여부를 이걸로 판단한다 */
function renameLazyclubSlug(rest: string): string | null {
  if (rest === "" || rest === "/") return "/all" // 구 트리 루트 → 이름 있는 홈
  const parts = rest.split("/")
  const seg = parts[1]
  const next = LAZYCLUB_RENAMED[seg]
  if (next) return rest.replace(`/${seg}`, `/${next}`)
  // 2단 슬러그: /people/<이름> → /people/<순번>
  if (seg === "people" && parts[2]) {
    const person = LAZYCLUB_PEOPLE_RENAMED[parts[2]]
    if (person) return ["", "people", person, ...parts.slice(3)].join("/")
  }
  return null
}
const LAZYCLUB_COMING_SOON = `${LAZYCLUB_BASE}/coming-soon`
/** lazy-club.com 랜딩 공개 스위치 — false 면 **루트만** coming soon (현행 유지),
 *  하위 경로는 실페이지가 열린다. 도메인을 정식 공개할 때 true 로 (운영자 결정 사항):
 *  true = 루트가 곧 레이지클럽 홈(전체보기). 그 외 동작은 두 값이 동일하다 */
const LAZYCLUB_LIVE = false
// PG(토스 결제위젯) 심사 대비 화이트리스트 (2026-08-11): 심사관이 lazy-club.com에서
// 상품 → 신청 → 결제위젯 → 약관·개인정보처리방침까지 도달할 수 있어야 한다.
// 이 프리픽스만 북클럽 도메인과 같은 방식(내부 /lazyday/*)으로 열고, 나머지는 coming-soon 유지.
const LAZYCLUB_OPEN_PREFIXES = ["/one-day-talk-01", "/policy", "/privacy", "/terms"]

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0]
  const { pathname } = req.nextUrl

  // 컷오버: linkylounge.com/lazyday/* → 새 도메인으로 301 (책클럽만 이관, /lazyday 밖은 그대로)
  if (LINKYLOUNGE_HOSTS.has(host) && (pathname === "/lazyday" || pathname.startsWith("/lazyday/"))) {
    const clean = pathname === "/lazyday" ? "/" : pathname.slice("/lazyday".length)
    return NextResponse.redirect(new URL(clean + req.nextUrl.search, BOOKCLUB_ORIGIN), 301)
  }

  // 레이지 클럽 도메인: 랜딩(인트로) 단계 — 페이지 요청 전부를 랜딩으로 (api 제외).
  // 예외: 레이지클럽 프리뷰 트리(기획안 홈·모임·카트)는 그대로 연다 (라운드 64) —
  // 랜딩의 마크를 누르면 기획안 홈으로 가야 하는데, 전부 rewrite면 제자리로 되돌아온다.
  // 경로는 책클럽 도메인과 같은 깔끔한 형태(/preview/…)를 쓰고 내부 /lazyday/… 로 rewrite.
  if (LAZYCLUB_HOSTS.has(host) && !pathname.startsWith("/api")) {
    // 구 시안 경로 → 깔끔한 새 경로로 301 (2026-08-21 프리뷰 졸업)
    const old = LAZYCLUB_OLD_PREFIXES.find((p) => pathname === p || pathname.startsWith(p + "/"))
    if (old) {
      // 슬러그 개명까지 한 번에 흡수 — 구 경로 + 구 슬러그가 겹쳐도 301 은 한 번만 탄다
      const rest = pathname.slice(old.length)
      const dest = renameLazyclubSlug(rest) ?? (rest || "/all")
      return NextResponse.redirect(new URL(dest + req.nextUrl.search, req.url), 301)
    }
    const to = req.nextUrl.clone()
    if (pathname === LAZYCLUB_BASE || pathname.startsWith(`${LAZYCLUB_BASE}/`)) {
      // 이 도메인에서 `/lazyclub` 프리픽스는 군더더기다(도메인이 이미 레이지클럽) →
      // 프리픽스를 뗀 주소로 301. 홈이 이름(`/all`)을 갖게 되면서 안전해진 처리다 —
      // 종전에는 트리 루트가 `/`(랜딩=coming-soon)와 겹쳐 '전체보기'가 실종됐다.
      const rest = pathname.slice(LAZYCLUB_BASE.length)
      const to2 = req.nextUrl.clone()
      to2.pathname = renameLazyclubSlug(rest) ?? (rest || "/all")
      return NextResponse.redirect(to2, 301)
    }
    // 개명 전 슬러그(/shop·/calendar·/archive) → 새 슬러그 301
    const renamed = renameLazyclubSlug(pathname)
    if (renamed && pathname !== "/") {
      const to3 = req.nextUrl.clone()
      to3.pathname = renamed
      return NextResponse.redirect(to3, 301)
    }
    if (LAZYCLUB_OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      // PG 심사 화이트리스트 — 원데이 신청·결제(checkout/success/fail)·정책 페이지
      to.pathname = `/lazyday${pathname}`
    } else if (!LAZYCLUB_LIVE && pathname === "/") {
      // 랜딩은 아직 coming soon (LAZYCLUB_LIVE 스위치) — 하위 경로는 실페이지.
      // 공개 시 true 로 바꾸면 이 자리가 전체보기 홈이 된다(/all 은 별칭으로 유지)
      to.pathname = LAZYCLUB_COMING_SOON
    } else if (pathname === "/") {
      to.pathname = LAZYCLUB_HOME
    } else {
      // 도메인 루트 = 레이지클럽 트리. /all·/meetings·/products·/people·/schedule·/records
      to.pathname = `${LAZYCLUB_BASE}${pathname}`
    }
    return NextResponse.rewrite(to)
  }

  const isBookclub = BOOKCLUB_HOSTS.has(host)

  // 0) 프리뷰 트리는 프로덕션(책클럽 도메인)에 공개하지 않는다 — 내부 리뷰는
  //    브랜치 프리뷰(vercel.app)에서만. /preview·/lazyday/preview 모두 홈으로 보낸다.
  //    예외: 난수 슬러그 공유 경로(운영자 2026-08-04 "복잡한 하위페이지명") —
  //    토큰 링크 대신 이 경로만 실도메인에서 열린다 (noindex는 프리뷰 레이아웃이 보장)
  // 2026-08-21: 레이지클럽이 프리뷰를 졸업해 /lazyclub 로 옮겼다 — 구 경로는 301.
  // (북클럽 도메인에서도 열어 두는 이유: 운영자 검토 동선. 색인은 레이아웃이 noindex 로 막는다)
  const oldLazyclub = LAZYCLUB_OLD_PREFIXES.find((p) => pathname === p || pathname.startsWith(p + "/"))
  if (isBookclub && oldLazyclub) {
    const rest = pathname.slice(oldLazyclub.length)
    const to = req.nextUrl.clone()
    to.pathname = `${LAZYCLUB_BASE}${renameLazyclubSlug(rest) ?? rest}`
    return NextResponse.redirect(to, 301)
  }
  // 개명 전 슬러그·구 트리 루트로 들어온 요청 → 새 슬러그 301 (북클럽 도메인)
  if (isBookclub && (pathname === LAZYCLUB_BASE || pathname.startsWith(`${LAZYCLUB_BASE}/`))) {
    const renamedRest = renameLazyclubSlug(pathname.slice(LAZYCLUB_BASE.length))
    if (renamedRest) {
      const to = req.nextUrl.clone()
      to.pathname = `${LAZYCLUB_BASE}${renamedRest}`
      return NextResponse.redirect(to, 301)
    }
  }
  if (
    isBookclub &&
    (pathname === "/preview" ||
      pathname.startsWith("/preview/") ||
      pathname === "/lazyday/preview" ||
      pathname.startsWith("/lazyday/preview/"))
  ) {
    return NextResponse.redirect(new URL("/", req.url), 307)
  }

  // 1) 북클럽 도메인: 깔끔한 경로 → 내부 /lazyday/* 로 rewrite
  //    - /api/* 와 이미 /lazyday 로 들어온 요청은 그대로 둔다(자산은 matcher에서 제외).
  let rewriteUrl: URL | null = null
  let effectivePath = pathname
  if (
    isBookclub &&
    !pathname.startsWith("/lazyday") &&
    !pathname.startsWith(LAZYCLUB_BASE) && // 레이지클럽은 /lazyday 밑이 아니다 — 이중 프리픽스 방지
    !pathname.startsWith("/api")
  ) {
    // 인터뷰 인덱스는 일정 선택으로 (next.config의 /lazyday 리다이렉트와 동일 효과, 깔끔한 URL 유지)
    if (pathname === "/apply/interview" || pathname === "/apply/interview/") {
      const to = req.nextUrl.clone()
      to.pathname = "/apply/interview/schedule"
      return NextResponse.redirect(to, 308)
    }
    rewriteUrl = req.nextUrl.clone()
    rewriteUrl.pathname = pathname === "/" ? "/lazyday" : `/lazyday${pathname}`
    effectivePath = rewriteUrl.pathname
  }

  // 2) 관리자 인증 — 실제 경로(/lazyday/admin) 기준으로 검사
  if (effectivePath.startsWith("/lazyday/admin") && effectivePath !== "/lazyday/admin/login") {
    const cookie = req.cookies.get("lazyday_admin")?.value
    // 앞뒤 공백·줄바꿈 방어 — auth/blocks 라우트와 동일 규칙 (2026-07-29)
    const secret = process.env.ADMIN_SECRET?.trim()
    if (!secret || cookie !== secret) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = isBookclub ? "/admin/login" : "/lazyday/admin/login"
      loginUrl.searchParams.set("redirect", isBookclub ? pathname : effectivePath)
      return NextResponse.redirect(loginUrl)
    }
  }

  return rewriteUrl ? NextResponse.rewrite(rewriteUrl) : NextResponse.next()
}

export const config = {
  // 호스트 rewrite를 위해 페이지 요청 전반에서 실행 (api·_next·정적파일은 제외)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
