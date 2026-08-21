import { notFound } from "next/navigation"
import { WorkroomShell } from "../../../Shell"
import { findMeeting, ONE_DAY_MEETINGS } from "../../../one-day-config"
import { MeetingApplyForm } from "./MeetingApplyForm"

/** 모임 신청 — 구매하기의 착지점 (운영자 2026-08-21 "선신청 → 후결제").
 *  결제 링크(payUrl)가 없는 모임은 신청도 받지 않는다: 접수만 되고 결제로 이어질 곳이
 *  없으면 "신청했는데 아무 일도 안 일어나는" 손님이 생긴다. */
export function generateStaticParams() {
  return ONE_DAY_MEETINGS.filter((m) => m.payUrl).map((m) => ({ slug: m.slug }))
}

export default async function MeetingApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = findMeeting(slug)
  if (!m || !m.payUrl) notFound()

  return (
    <WorkroomShell>
      <MeetingApplyForm
        meeting={{
          slug: m.slug,
          title: m.title,
          date: m.date,
          place: m.place,
          price: m.price,
          payUrl: m.payUrl,
          sessions: m.sessions,
        }}
      />
    </WorkroomShell>
  )
}
