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

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0]
  const { pathname } = req.nextUrl

  // 컷오버: linkylounge.com/lazyday/* → 새 도메인으로 301 (책클럽만 이관, /lazyday 밖은 그대로)
  if (LINKYLOUNGE_HOSTS.has(host) && (pathname === "/lazyday" || pathname.startsWith("/lazyday/"))) {
    const clean = pathname === "/lazyday" ? "/" : pathname.slice("/lazyday".length)
    return NextResponse.redirect(new URL(clean + req.nextUrl.search, BOOKCLUB_ORIGIN), 301)
  }

  const isBookclub = BOOKCLUB_HOSTS.has(host)

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
    const secret = process.env.ADMIN_SECRET
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
