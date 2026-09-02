import { NextRequest, NextResponse } from "next/server"
import { adminWho } from "@/lib/admin-session"
import { cookies } from "next/headers"
import { gasGetJson, gasPostJson } from "@/lib/gas"

const GAS_URL      = process.env.INTERVIEW_GAS_URL
// 환경변수 붙여넣기 시 섞이는 앞뒤 공백·줄바꿈 방어 (2026-07-29)
const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim()
const ADMIN_TOKEN  = ADMIN_SECRET // GAS 스크립트 속성 ADMIN_TOKEN과 같은 값이어야 함

/** 관리자 게이트 — 서명 토큰 검증 (lib/admin-session). 옛 시크릿-원문 쿠키는 통과하지 못한다 */
const isAuthorized = (req: NextRequest) => adminWho(req).then(Boolean)

/** GAS GET URL 생성 — 토큰을 쿼리로 안전하게 실어 보낸다 (2026-07-29).
 *  구현: 문자열 접합(`?adminToken=`)은 ① 토큰에 &·#·+·공백 등이 있으면 값이 잘리고
 *  ② GAS_URL에 이미 쿼리가 있으면 '?'가 두 번 붙어 깨진다. URL API로 둘 다 해결. */
function gasGetUrl(base: string, token: string) {
  const url = new URL(base)
  url.searchParams.set("adminToken", token)
  return url.toString()
}

// GET: 이벤트 목록 (ID 포함)
export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!GAS_URL) return NextResponse.json({ error: "GAS URL 미설정" }, { status: 500 })

  // GAS가 간헐적으로 HTML 오류 페이지를 주므로 재시도 + 원인 노출 (lib/gas.ts)
  try {
    const data = await gasGetJson(gasGetUrl(GAS_URL, ADMIN_TOKEN!))
    return NextResponse.json(data)
  } catch (err) {
    console.error("[admin/blocks] GAS 조회 실패:", err)
    return NextResponse.json(
      { success: false, error: `GAS 조회 실패: ${err instanceof Error ? err.message : "알 수 없음"}` },
      { status: 502 },
    )
  }
}

// POST: 차단 시간 추가
export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!GAS_URL) return NextResponse.json({ error: "GAS URL 미설정" }, { status: 500 })

  const { start, end, title } = await req.json()
  try {
    const data = await gasPostJson(GAS_URL, { type: "admin_block", adminToken: ADMIN_TOKEN, start, end, title })
    return NextResponse.json(data)
  } catch (err) {
    console.error("[admin/blocks] 차단 추가 실패:", err)
    return NextResponse.json(
      { success: false, error: `GAS 오류: ${err instanceof Error ? err.message : "알 수 없음"}` },
      { status: 502 },
    )
  }
}

// DELETE: 이벤트 삭제
export async function DELETE(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!GAS_URL) return NextResponse.json({ error: "GAS URL 미설정" }, { status: 500 })

  const { id } = await req.json()
  try {
    const data = await gasPostJson(GAS_URL, { type: "admin_delete", adminToken: ADMIN_TOKEN, id })
    return NextResponse.json(data)
  } catch (err) {
    console.error("[admin/blocks] 차단 삭제 실패:", err)
    return NextResponse.json(
      { success: false, error: `GAS 오류: ${err instanceof Error ? err.message : "알 수 없음"}` },
      { status: 502 },
    )
  }
}
