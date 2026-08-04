import { notFound } from "next/navigation"
import { findGoods } from "../../goods-config"
import { ProductDetail } from "../../ProductDetail"

/** 굿즈 상세 — 워크룸 상품 상세 구조 (docs/redesign/09 2순위) */
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
      price={g.price}
      images={[{ src: g.img, alt: g.name }]}
      cartItem={{ id: `goods-${g.slug}`, name: g.name, price: g.price, href: `/preview/home-v3-workroom/shop/${g.slug}`, img: g.img }}
    />
  )
}
