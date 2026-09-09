import { NextResponse } from "next/server"
import { SEASON } from "@/app/(main)/lazyday/season-config"
import { CLASSES_COOKIE, CLASSES_MAX_AGE, checkClassesPassword, classesGateEnabled, signClassesToken } from "@/lib/classes-gate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * 반배정 열람 암호 확인 (2026-09-05). `/classes` 의 **모달**이 fetch 로 부른다 —
 * JSON 을 받고 JSON 을 돌려준다(모달이 그 자리에서 오류를 말해야 하므로 리다이렉트가 아니다).
 *
 * ⚠ 폼 전송(`content-type: application/x-www-form-urlencoded`)도 계속 받는다 — JS 가 죽은 환경의
 *   `<form method="post">` 폴백. 그 경우에만 303 으로 되돌린다.
 * ⚠ 응답에 '왜 틀렸는지'를 나누어 담지 않는다 — 암호가 틀린 것과 기수 행이 없는 것을 구분해 주면
 *   바깥에서 내부 상태를 읽는 창구가 된다. 손님에게는 '맞지 않음' 하나다.
 */
function backTo(req: Request) {
  const host = req.headers.get("host") ?? ""
  return host.endsWith("lazyday-bookclub.com") ? "/classes" : "/lazyday/classes"
}

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") ?? ""
  const isJson = ct.includes("application/json")

  let password: unknown = null
  try {
    if (isJson) password = ((await req.json()) as { password?: unknown } | null)?.password
    else password = (await req.formData()).get("password")
  } catch {
    password = null
  }

  const enabled = classesGateEnabled()
  const ok = enabled && (await checkClassesPassword(SEASON.name, password))

  if (isJson) {
    const res = NextResponse.json(ok ? { ok: true } : { ok: false }, { status: ok ? 200 : 401 })
    // ⚠ 반드시 await — 토큰 서명이 비동기라 기다리지 않으면 쿠키 없는 응답이 나간다(모달이 성공을
    //   받고도 새로고침하면 다시 잠긴다). 0015 에서 이 자리를 then 으로 두었다가 잡았다.
    if (ok) await setCookie(res)
    return res
  }

  const to = new URL(backTo(req), req.url)
  if (!ok) {
    to.searchParams.set(enabled ? "wrong" : "closed", "1")
    return NextResponse.redirect(to, 303)
  }
  const res = NextResponse.redirect(to, 303)
  await setCookie(res)
  return res
}

async function setCookie(res: NextResponse) {
  res.cookies.set(CLASSES_COOKIE, await signClassesToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CLASSES_MAX_AGE,
  })
}
