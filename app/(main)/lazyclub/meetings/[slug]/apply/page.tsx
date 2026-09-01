import { notFound } from "next/navigation"
import { WorkroomShell } from "../../../Shell"
import { findMeeting, ONE_DAY_MEETINGS, meetingOrderCode } from "../../../one-day-config"
import { MEETING_PAY_ROUTE } from "@/lib/payments/config"
import { MeetingApplyForm } from "./MeetingApplyForm"
import styles from "../../../home.module.css"

/** 모임 신청 — 구매하기의 착지점 (운영자 2026-08-21 "선신청 → 후결제").
 *  결제 링크(payUrl)가 없는 모임은 신청도 받지 않는다: 접수만 되고 결제로 이어질 곳이
 *  없으면 "신청했는데 아무 일도 안 일어나는" 손님이 생긴다.
 *  ⚠ **모집중(open)이 아니면 폼 자체를 닫는다** — 상세의 구매 버튼은 상태로 가려지지만
 *  이 주소를 직접 열면 마감된 모임에도 접수가 됐다. 종전 checkout 에서 같은 구멍을
 *  겪었다(2026-08-11 "직접 URL 로 종료 모임이 결제되던 구멍"). */
/** 신청 가능 = 결제로 이어질 곳이 있는 모임만. 링크페이 모드면 payUrl 이,
 *  위젯 모드면 주문코드가 있어야 한다 (접수만 되고 결제가 막히면 안 된다) */
const applicable = (m: { slug: string; status: string; payUrl?: string }) =>
  (MEETING_PAY_ROUTE === "linkpay" ? Boolean(m.payUrl) : Boolean(meetingOrderCode(m.slug))) &&
  m.status === "open"

export function generateStaticParams() {
  return ONE_DAY_MEETINGS.filter(applicable).map((m) => ({ slug: m.slug }))
}

export default async function MeetingApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = findMeeting(slug)
  if (!m || !applicable(m)) notFound()

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
          // 결제 목적지는 MEETING_PAY_ROUTE 가 정한다 (2026-09-01).
          // linkpay = 토스 상품링크(계약 살아 있음 · 실결제 되는 유일한 경로)
          // widget  = 우리 결제창 (토스 계약 완료 후 여기로)
          // ⚠ 여기는 서버 컴포넌트라 호스트별 base 를 모른다 — 우리 결제창 경로는
          //   **주문 코드만** 넘기고 URL 조립을 폼(클라이언트)이 useBasePath 로 한다
          payUrl: MEETING_PAY_ROUTE === "linkpay" ? m.payUrl : undefined,
          orderCode: MEETING_PAY_ROUTE === "linkpay" ? undefined : (meetingOrderCode(m.slug) ?? undefined),
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
