import { notFound } from "next/navigation"
import { findMeeting, meetingOrderCode } from "../../one-day-config"
import { ProductDetail } from "../../ProductDetail"
// 서버 컴포넌트 — Shell("use client") 경유로 BASE 를 받으면 프록시가 찍힌다 (base-path 직수입)
import { BASE } from "../../base-path"

/** 원데이 토크 상세 — 워크룸 상품 상세 구조 (docs/redesign/09 1순위).
 *  선결제→후신청 (2026-08-11): 구매하기가 신청폼이 아니라 **곧장 결제**로 간다 —
 *  신청서는 결제 승인 직후 checkout/success 가 띄운다 (운영자 확정 여정) */
export default async function MeetingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = findMeeting(slug)
  if (!m) notFound()

  const badge = m.status === "open" ? "모집중" : m.status === "soldout" ? "마감" : "오픈 예정"
  // 일정에 매핑되지 않는 모임(지난 회차 등)은 회차 선택 페이지로 폴백
  const code = meetingOrderCode(m.slug)
  return (
    <ProductDetail
      id={`meeting-${m.slug}`}
      category={m.host} // 카테고리 대신 진행 주체 노출 (운영자 2026-08-18)
      badgeText={badge}
      status={m.status}
      title={m.title}
      sub="One Day Talk" // 운영자 2026-08-18: 작은 글씨는 영어로만
      description={m.description}
      fields={[
        { label: "일시", lines: [m.date] },
        { label: "장소", lines: [m.place] },
        { label: "진행", lines: [m.host] },
        { label: "문의", lines: [m.contact] },
      ]}
      price={m.price}
      buyHref={code ? `/one-day-talk-01/checkout?items=${code}` : "/one-day-talk-01/apply"}
      images={m.images}
      cartItem={{ id: `meeting-${m.slug}`, name: m.title, price: m.price, href: `${BASE}/meetings/${m.slug}`, img: m.thumbnail }}
    />
  )
}
