import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const GAS_URL      = process.env.INTERVIEW_GAS_URL
const ADMIN_SECRET = process.env.ADMIN_SECRET
const ADMIN_TOKEN  = process.env.ADMIN_SECRET // GAS의 ADMIN_TOKEN과 동일

function isAuthorized(req: NextRequest) {
  const cookie = req.cookies.get("lazyday_admin")?.value
  return ADMIN_SECRET && cookie === ADMIN_SECRET
}

// GET: 이벤트 목록 (ID 포함)
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!GAS_URL) return NextResponse.json({ error: "GAS URL 미설정" }, { status: 500 })

  const res = await fetch(`${GAS_URL}?adminToken=${ADMIN_TOKEN}`, { redirect: "follow" })
  const data = await res.json()
  return NextResponse.json(data)
}

// POST: 차단 시간 추가
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!GAS_URL) return NextResponse.json({ error: "GAS URL 미설정" }, { status: 500 })

  const { start, end, title } = await req.json()
  const res = await fetch(GAS_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "admin_block", adminToken: ADMIN_TOKEN, start, end, title }),
  })
  const data = await res.json()
  return NextResponse.json(data)
}

// DELETE: 이벤트 삭제
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!GAS_URL) return NextResponse.json({ error: "GAS URL 미설정" }, { status: 500 })

  const { id } = await req.json()
  const res = await fetch(GAS_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "admin_delete", adminToken: ADMIN_TOKEN, id }),
  })
  const data = await res.json()
  return NextResponse.json(data)
}
