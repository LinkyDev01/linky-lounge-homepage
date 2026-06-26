import { NextRequest, NextResponse } from "next/server"

// 레이지데이 북클럽 전용 도메인(lazyday-bookclub.com).
// 전략: 인스타 등에 "보여주는 브랜드 링크"로만 노출하고, 실제 콘텐츠·트래킹·신뢰도는
// 이미 검증된 linkylounge.com/lazyday 가 떠안는다(도메인 신뢰도 대행).
// → 이 호스트로 들어오면 linkylounge.com/lazyday/* 로 302(임시) 리다이렉트한다.
//   302를 쓰는 이유: 추후 새 도메인에서 직접 서빙으로 전환해도 브라우저/검색엔진 캐시에 묶이지 않음.
const BOOKCLUB_HOSTS = new Set([
  "lazyday-bookclub.com",
  "www.lazyday-bookclub.com",
])

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0]

  // 북클럽 도메인 → linkylounge.com/lazyday/* 로 임시 리다이렉트 (경로 보존)
  if (BOOKCLUB_HOSTS.has(host)) {
    const p = req.nextUrl.pathname
    const target = p.startsWith("/lazyday") ? p : `/lazyday${p === "/" ? "" : p}`
    const dest = new URL(target + req.nextUrl.search, "https://linkylounge.com")
    return NextResponse.redirect(dest, 302)
  }

  // 관리자 인증 (linkylounge.com 등 기존 동작 유지)
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/lazyday/admin") && pathname !== "/lazyday/admin/login") {
    const cookie = req.cookies.get("lazyday_admin")?.value
    const secret = process.env.ADMIN_SECRET
    if (!secret || cookie !== secret) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = "/lazyday/admin/login"
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
