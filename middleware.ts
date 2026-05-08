import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/lazyday/admin")) {
    // 로그인 페이지는 통과
    if (pathname === "/lazyday/admin/login") return NextResponse.next()

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
  matcher: ["/lazyday/admin/:path*"],
}
