import { notFound } from "next/navigation"
import { findGoods } from "../../goods-config"
import { ProductDetail } from "../../ProductDetail"
import { BASE } from "../../Shell"
import { goodsCode } from "@/lib/order-catalog"

/** 굿즈 상세 — 워크룸 상품 상세 구조 (docs/redesign/09 2순위).
 *  2026-08-11: 전 품목 **현장 수령**(배송 없음)으로 정하며 결제위젯 연결 —
 *  주소를 받지 않으므로 09 문서의 "티켓형 결제" 원칙 유지 */
export default async function GoodsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const g = findGoods(slug)
  if (!g) notFound()

  const badge = g.status === "open" ? "판매중" : g.status === "soldout" ? "품절" : "오픈 예정"
  return (
    <ProductDetail
      id={`goods-${g.slug}`}
      category={g.cat}
      badgeText={badge}
      status={g.status}
      title={g.name}
      sub="레이지데이 굿즈"
      description={g.description}
      fields={[
        { label: "수령", lines: ["링키라운지 현장 수령 (배송 없음)", "결제 후 수령 일정을 연락처로 안내드립니다."] },
        { label: "교환·환불", lines: ["수령일부터 7일 이내 미개봉·미사용 시 현장 반납 (반품 비용 없음)"] },
        { label: "문의", lines: ["contact@linkylounge.com"] },
      ]}
      buyHref={`/one-day-talk-01/checkout?items=${goodsCode(g.slug)}`}
      price={g.price}
      images={[{ src: g.img, alt: g.name }]}
      cartItem={{ id: `goods-${g.slug}`, name: g.name, price: g.price, href: `${BASE}/shop/${g.slug}`, img: g.img }}
    />
  )
}
