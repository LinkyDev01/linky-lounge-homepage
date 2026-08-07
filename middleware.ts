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
const LAZYCLUB_COMING_SOON = "/lazyday/preview/lazyclub-4b073000ddec094f/coming-soon"

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
    const to = req.nextUrl.clone()
    if (pathname.startsWith("/preview/lazyclub-4b073000ddec094f")) {
      to.pathname = `/lazyday${pathname}`
    } else if (pathname.startsWith("/lazyday/preview/lazyclub-4b073000ddec094f")) {
      return NextResponse.next()
    } else {
      to.pathname = LAZYCLUB_COMING_SOON
    }
    return NextResponse.rewrite(to)
  }

  const isBookclub = BOOKCLUB_HOSTS.has(host)

  // 0) 프리뷰 트리는 프로덕션(책클럽 도메인)에 공개하지 않는다 — 내부 리뷰는
  //    브랜치 프리뷰(vercel.app)에서만. /preview·/lazyday/preview 모두 홈으로 보낸다.
  //    예외: 난수 슬러그 공유 경로(운영자 2026-08-04 "복잡한 하위페이지명") —
  //    토큰 링크 대신 이 경로만 실도메인에서 열린다 (noindex는 프리뷰 레이아웃이 보장)
  const isSharedPreview =
    pathname.startsWith("/preview/lazyclub-4b073000ddec094f") ||
    pathname.startsWith("/lazyday/preview/lazyclub-4b073000ddec094f")
  if (
    isBookclub &&
    !isSharedPreview &&
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
  if (isBookclub && !pathname.startsWith("/lazyday") && !pathname.startsWith("/api")) {
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
