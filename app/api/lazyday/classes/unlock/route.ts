import { NextResponse } from "next/server"
import { CLASSES_COOKIE, CLASSES_MAX_AGE, checkClassesPassword, classesGateEnabled, signClassesToken } from "@/lib/classes-gate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * 반배정 열람 암호 확인 (2026-09-05). `/classes` 의 `<form method="post">` 가 여기로 온다 — JS 없이 동작.
 * 맞으면 서명 쿠키를 심고 페이지로 303, 틀리면 `?wrong=1` 을 달아 되돌린다.
 *
 * 돌아갈 주소: 북클럽 도메인은 미들웨어가 `/classes` → `/lazyday/classes` 로 rewrite 하므로
 * 손님이 보는 주소는 `/classes` 다. 그 밖(프리뷰·localhost)은 내부 경로 그대로.
 * ⚠ `/api/*` 는 미들웨어 밖이라 이 라우트 주소는 어느 호스트에서도 `/api/lazyday/classes/unlock` 이다.
 */
function backTo(req: Request) {
  const host = req.headers.get("host") ?? ""
  return host.endsWith("lazyday-bookclub.com") ? "/classes" : "/lazyday/classes"
}

export async function POST(req: Request) {
  const to = new URL(backTo(req), req.url)
  if (!classesGateEnabled()) {
    to.searchParams.set("closed", "1")
    return NextResponse.redirect(to, 303)
  }
  let password: unknown = null
  try {
    const ct = req.headers.get("content-type") ?? ""
    if (ct.includes("application/json")) password = (await req.json())?.password
    else password = (await req.formData()).get("password")
  } catch {
    password = null
  }
  if (!checkClassesPassword(password)) {
    to.searchParams.set("wrong", "1")
    return NextResponse.redirect(to, 303)
  }
  const res = NextResponse.redirect(to, 303)
  res.cookies.set(CLASSES_COOKIE, await signClassesToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CLASSES_MAX_AGE,
  })
  return res
}
