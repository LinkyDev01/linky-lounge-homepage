import { notFound } from "next/navigation"
import { findGoods } from "../../goods-config"
import { ProductDetail } from "../../ProductDetail"
import { BASE } from "../../Shell"

/** 굿즈 상세 — 워크룸 상품 상세 구조 (docs/redesign/09 2순위) */

/** 굿즈는 실물 배송 상품이라 온라인 결제 연동 전이다 (배송 정책·주소 수집 확정 후 승격).
 *  판매중(open)이어도 구매 버튼이 기본 토스트("준비 중인 기능입니다")로 떨어지지 않도록
 *  문의 창구를 명시한다 (2026-08-11) */
const GOODS_BUY_MESSAGE =
  "굿즈 온라인 결제는 준비 중입니다. 구매 문의는 contact@linkylounge.com 으로 보내주세요."
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
      fields={[{ label: "문의", lines: ["contact@linkylounge.com"] }]}
      buyMessage={GOODS_BUY_MESSAGE}
      price={g.price}
      images={[{ src: g.img, alt: g.name }]}
      cartItem={{ id: `goods-${g.slug}`, name: g.name, price: g.price, href: `${BASE}/shop/${g.slug}`, img: g.img }}
    />
  )
}
