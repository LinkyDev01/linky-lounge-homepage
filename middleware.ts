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
// 책클럽 정본 오리진·관리 호스트는 lib/site.ts 가 단일 출처 (2026-09-02)
import { BOOKCLUB_ORIGIN, ADMIN_HOST, ADMIN_ORIGIN } from "@/lib/site"

/** 관리 경로 → 관리 트리 내부의 나머지 경로. `/admin/x` · `/lazyday/admin/x` → `/x`,
 *  인덱스(`/admin`)는 `""`. 관리 경로가 아니면 null (2026-09-02 관리 호스트 분리) */
function adminRest(p: string): string | null {
  for (const prefix of ["/lazyday/admin", "/admin"]) {
    if (p === prefix) return ""
    if (p.startsWith(prefix + "/")) return p.slice(prefix.length)
  }
  return null
}

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
// ⚠ 아래 두 표는 **301 원장**이다 — append-only, 청소 금지 (정본: docs/url-policy.md).
// 지우는 순간 그 주소를 저장해 둔 사람이 404 를 본다. 개명 절차도 그 문서를 따를 것.
const LAZYCLUB_RENAMED: Record<string, string> = {
  shop: "products",
  calendar: "schedule",
  archive: "records",
}
/** 사람 슬러그 개명 — **지난 표기를 전부** 새 핸들로 301 (2026-08-22).
 *  경위: 이름(andongmin·gorden) → 순번(00000001·00000002, 같은 날 오전) → **핸들**(확정).
 *  중간 단계였던 순번도 짧게나마 프로덕션에 나갔으므로 함께 살려 둔다.
 *  ⚠ 인스타 링크인바이오가 `/people/andongmin` 을 가리키고 있다. 끊으면 그 유입이 죽는다 */
const LAZYCLUB_PEOPLE_RENAMED: Record<string, string> = {
  andongmin: "dmahn",
  "00000001": "dmahn",
  gorden: "gdcheon",
  "00000002": "gdcheon",
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
const LAZYCLUB_OPEN_PREFIXES = ["/one-day-talk-01", "/checkout", "/policy", "/privacy", "/terms"]

/** 결제 주소 이전 (2026-09-01): `/one-day-talk-01/checkout` → `/checkout`.
 *  결제 화면은 원데이 토크 1회차의 하위가 아니라 제품·모임이 **전부** 지나는 자리인데
 *  주소만 그 회차에 매달려 있었다 (운영자: "원데이토크랑 붙어있는 게 아니잖아").
 *  ⚠ **301 원장 — 지우지 않는다** (docs/url-policy.md §3). 카톡·문자로 공유된 결제
 *  링크와 검색 색인이 구 주소에 걸려 있다. success·fail 하위까지 함께 받는다.
 *  `/lazyday` 프리픽스 유무 양쪽을 다 처리한다 — 북클럽 도메인은 깔끔한 경로로,
 *  직접 접근은 `/lazyday/...` 로 들어온다 */
function movedCheckout(pathname: string): string | null {
  for (const prefix of ["", "/lazyday"]) {
    const old = `${prefix}/one-day-talk-01/checkout`
    if (pathname === old || pathname.startsWith(`${old}/`)) {
      return `${prefix}/checkout${pathname.slice(old.length)}`
    }
  }
  return null
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0]
  const { pathname } = req.nextUrl

  // ── 관리 호스트 분리 (운영자 2026-09-02 "관리자페이지가 같은 도메인에 슬러그로 있다는 사실이 걸려") ──
  //   관리 화면은 admin.lazy-club.com 에서만 `/admin/*` 로 열린다 (내부 트리는 종전대로 /lazyday/admin/*).
  //   A) 손님 도메인 3종의 `/admin*`·`/lazyday/admin*` 은 관리 호스트로 **307** — 301 이 아닌 이유:
  //      운영자 전용 트래픽이라 SEO 가치가 없고, 되돌릴 때 두 운영자 브라우저에 영구 캐시가 남지 않게.
  //      linkylounge→북클럽→관리 2단 체인도 여기서 1홉으로 끝난다(아래 컷오버 블록보다 앞).
  //   B) 관리 호스트는 관리 트리 말고 아무것도 열지 않는다 — 손님 사이트의 별칭이 되면 안 된다.
  //   ⚠ `/api/*` 는 matcher 밖이라 이 분기와 무관 — 관리 API 는 쿠키/토큰으로 자기 인증하고,
  //     GAS 보정 스윕이 부르는 SITE_URL(북클럽) 도 그대로다.
  //   프리뷰(vercel.app)·localhost 는 어느 집합에도 없어 `/admin/*`·`/lazyday/admin/*` 둘 다 열린다(가드는 동일).
  const adminPath = adminRest(pathname)
  const isCustomerHost = BOOKCLUB_HOSTS.has(host) || LINKYLOUNGE_HOSTS.has(host) || LAZYCLUB_HOSTS.has(host)
  if (isCustomerHost && adminPath !== null) {
    return NextResponse.redirect(new URL(`/admin${adminPath}${req.nextUrl.search}`, ADMIN_ORIGIN), 307)
  }
  if (host === ADMIN_HOST) {
    if (pathname === "/") {
      const to = req.nextUrl.clone()
      to.pathname = "/admin"
      return NextResponse.redirect(to, 307)
    }
    if (adminPath === null) return new NextResponse(null, { status: 404 })
    if (pathname.startsWith("/lazyday/admin")) {
      // 내부 프리픽스를 손으로 친 경우 → 정본 주소로
      const to = req.nextUrl.clone()
      to.pathname = `/admin${adminPath}`
      return NextResponse.redirect(to, 308)
    }
  }

  // 컷오버: linkylounge.com/lazyday/* → 새 도메인으로 301 (책클럽만 이관, /lazyday 밖은 그대로)
  if (LINKYLOUNGE_HOSTS.has(host) && (pathname === "/lazyday" || pathname.startsWith("/lazyday/"))) {
    const clean = pathname === "/lazyday" ? "/" : pathname.slice("/lazyday".length)
    return NextResponse.redirect(new URL(clean + req.nextUrl.search, BOOKCLUB_ORIGIN), 301)
  }

  // 결제 주소 이전 301 (2026-09-01) — 모든 호스트 공통. 링크페이·카톡으로 나간 구
  // 주소가 살아 있어야 하고, rewrite 로 두 주소를 다 살리면 색인이 갈라진다(§4).
  // clone() 이 search 를 들고 가므로 ?items=… 와 utm 이 보존된다.
  const movedPay = movedCheckout(pathname)
  if (movedPay) {
    const to = req.nextUrl.clone()
    to.pathname = movedPay
    return NextResponse.redirect(to, 301)
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

  // 인스타그램 프로필 바이오용 단축 경로 → 랜딩 + 유입 출처 표시 (운영자 2026-08-26).
  //   목적: 프로필 경유 유입과 광고 직행 유입의 전환율을 갈라 보기 위한 계측.
  //   ⚠ 302(임시)인 이유: 목적지가 바뀔 수 있는 마케팅 경로다. 301 은 브라우저가
  //     영구 캐시해서 나중에 목적지를 못 바꾼다 (개명 301 원장과는 성격이 다르다).
  //   ⚠ 여기가 북클럽 rewrite 블록보다 **앞**이어야 한다 — 뒤로 가면 /lazyday/ig 로
  //     바뀌어 없는 페이지가 된다.
  //   clone() 이 search 를 들고 가므로 utm_*·fbclid 가 보존된다.
  if (isBookclub && pathname === "/ig") {
    const to = req.nextUrl.clone()
    to.pathname = "/"
    to.searchParams.set("src", "profile")
    return NextResponse.redirect(to, 302)
  }

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
  } else if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // 관리 호스트·프리뷰·localhost 의 깔끔한 관리 경로 → 내부 트리 (손님 호스트는 위에서 이미 307)
    rewriteUrl = req.nextUrl.clone()
    rewriteUrl.pathname = `/lazyday${pathname}`
    effectivePath = rewriteUrl.pathname
  }

  // 2) 관리자 인증 — 실제 경로(/lazyday/admin) 기준으로 검사
  if (effectivePath.startsWith("/lazyday/admin") && effectivePath !== "/lazyday/admin/login") {
    const cookie = req.cookies.get("lazyday_admin")?.value
    // 앞뒤 공백·줄바꿈 방어 — auth/blocks 라우트와 동일 규칙 (2026-07-29)
    const secret = process.env.ADMIN_SECRET?.trim()
    if (!secret || cookie !== secret) {
      // 로그인 주소는 어느 호스트에서든 깔끔한 `/admin/login` (위 rewrite 가 받는다).
      // redirect 는 주소창 경로 그대로 — 관리 호스트에선 `/admin/...`, 프리뷰에선 `/lazyday/admin/...` 도 유효
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = "/admin/login"
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return rewriteUrl ? NextResponse.rewrite(rewriteUrl) : NextResponse.next()
}

export const config = {
  // 호스트 rewrite를 위해 페이지 요청 전반에서 실행 (api·_next·정적파일은 제외)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
