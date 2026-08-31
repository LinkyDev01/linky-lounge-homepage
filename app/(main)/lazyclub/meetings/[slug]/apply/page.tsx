import { notFound } from "next/navigation"
import { WorkroomShell } from "../../../Shell"
import { findMeeting, ONE_DAY_MEETINGS } from "../../../one-day-config"
import { MeetingApplyForm } from "./MeetingApplyForm"
import styles from "../../../home.module.css"

/** 모임 신청 — 구매하기의 착지점 (운영자 2026-08-21 "선신청 → 후결제").
 *  결제 링크(payUrl)가 없는 모임은 신청도 받지 않는다: 접수만 되고 결제로 이어질 곳이
 *  없으면 "신청했는데 아무 일도 안 일어나는" 손님이 생긴다.
 *  ⚠ **모집중(open)이 아니면 폼 자체를 닫는다** — 상세의 구매 버튼은 상태로 가려지지만
 *  이 주소를 직접 열면 마감된 모임에도 접수가 됐다. 종전 checkout 에서 같은 구멍을
 *  겪었다(2026-08-11 "직접 URL 로 종료 모임이 결제되던 구멍"). */
const applicable = (m: { payUrl?: string; status: string }) => Boolean(m.payUrl) && m.status === "open"

export function generateStaticParams() {
  return ONE_DAY_MEETINGS.filter(applicable).map((m) => ({ slug: m.slug }))
}

export default async function MeetingApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = findMeeting(slug)
  if (!m || !applicable(m) || !m.payUrl) notFound()

  return (
    <WorkroomShell>
      <main className={styles.content}>
        <MeetingApplyForm
          meeting={{
          slug: m.slug,
          title: m.title,
          date: m.date,
          place: m.place,
          price: m.price,
          payUrl: m.payUrl,
          sessions: m.sessions,
          // 알림톡 '비고' 칸 — 전달할 게 있는 모임만 one-day-config 에 notice 를 적는다.
          // ⚠ 여기서 안 넘기면 폼이 빈 값을 보내 그 줄이 영영 비어 있는다(조용한 유실).
          notice: m.notice,
        }}
        />
      </main>
    </WorkroomShell>
  )
}
