import { notFound } from "next/navigation"
import { findMeeting } from "../../one-day-config"
import { ProductDetail } from "../../ProductDetail"

/** 원데이 토크 상세 — 워크룸 상품 상세 구조 (docs/redesign/09 1순위) */
export default async function MeetingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = findMeeting(slug)
  if (!m) notFound()

  const badge = m.status === "open" ? "모집중" : m.status === "soldout" ? "마감" : "오픈 예정"
  return (
    <ProductDetail
      id={`meeting-${m.slug}`}
      category={m.category}
      badgeText={badge}
      status={m.status}
      title={m.title}
      sub="원데이 클럽 · 하루의 독서모임"
      description={m.description}
      fields={[
        { label: "일시", lines: [m.date] },
        { label: "장소", lines: [m.place] },
        { label: "진행", lines: [m.host] },
        { label: "문의", lines: [m.contact] },
      ]}
      price={m.price}
      buyHref="/one-day-talk-01/apply"
      images={m.images}
      cartItem={{ id: `meeting-${m.slug}`, name: m.title, price: m.price, href: `/preview/home-v3-workroom/meetings/${m.slug}`, img: m.thumbnail }}
    />
  )
}
