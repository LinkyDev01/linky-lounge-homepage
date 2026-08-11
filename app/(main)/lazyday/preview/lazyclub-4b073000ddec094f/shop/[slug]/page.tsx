import { notFound } from "next/navigation"
import { findGoods } from "../../goods-config"
import { ProductDetail } from "../../ProductDetail"
import { BASE } from "../../Shell"
import { goodsCode } from "@/lib/order-catalog"

/** 굿즈 상세 — 워크룸 상품 상세 구조 (docs/redesign/09 2순위).
 *  2026-08-11: 결제위젯 연결. 수령은 현장 수령 기본 + 택배 병행(운영자 "혹시 모르니
 *  배송정책" — 스마트스토어 표준 고지 양식). 배송지는 결제 후 연락 시 확인 —
 *  폼에서 주소를 받지 않아 09 문서의 "티켓형 결제" 원칙 유지 */
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
        {
          label: "배송·수령",
          lines: [
            "링키라운지 현장 수령 또는 택배 배송 중 선택",
            "택배: 우체국택배 · 배송비 3,000원 (제주·도서산간 추가) · 결제 확인 후 영업일 2–5일 내 발송",
            "배송지는 결제 후 연락처 안내 시 확인합니다.",
          ],
        },
        {
          label: "교환·반품",
          lines: [
            "수령일(배송 완료일)부터 7일 이내 신청 가능",
            "단순 변심: 반품 배송비 구매자 부담 (왕복 6,000원 · 현장 반납 시 무료)",
            "상품 하자·오배송: 기간 무관 판매자 부담으로 교환 또는 전액 환불",
            "보내실 곳: 서울 동작구 동작대로 7길 44, 지하 1층 링키라운지",
            "사용·훼손되었거나 포장 개봉으로 상품 가치가 훼손된 경우 교환·반품이 제한될 수 있습니다.",
          ],
        },
        { label: "문의", lines: ["contact@linkylounge.com · 010-7444-5790"] },
      ]}
      buyHref={`/one-day-talk-01/checkout?items=${goodsCode(g.slug)}`}
      price={g.price}
      images={[{ src: g.img, alt: g.name }]}
      cartItem={{ id: `goods-${g.slug}`, name: g.name, price: g.price, href: `${BASE}/shop/${g.slug}`, img: g.img }}
    />
  )
}
