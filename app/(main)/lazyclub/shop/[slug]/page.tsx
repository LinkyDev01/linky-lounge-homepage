import { notFound } from "next/navigation"
import { KAKAO_CHAT_URL } from "@/app/(main)/lazyday/support"
import { findGoods, DELIVERY_RETURNS } from "../../goods-config"
import { ProductDetail } from "../../ProductDetail"
// 서버 컴포넌트 — Shell("use client") 경유로 BASE 를 받으면 프록시가 찍힌다 (base-path 직수입)
import { BASE } from "../../base-path"
import { goodsCode } from "@/lib/order-catalog"

/** 굿즈 상세 — 워크룸 상품 상세 구조 (docs/redesign/09 2순위).
 *  2026-08-11: 결제위젯 연결. 수령은 현장 수령 기본 + 택배 병행(운영자 "혹시 모르니
 *  배송정책" — 스마트스토어 표준 고지 양식). 배송지는 결제 후 연락 시 확인 —
 *  폼에서 주소를 받지 않아 09 문서의 "티켓형 결제" 원칙 유지
 *  라운드 136(운영자): 배송·교환 고지는 상단에 있을 필요가 없다 → fields 에서 빼
 *  policies 로 넘겨 저장 버튼 아래에 둔다. 상단 필드는 문의만 남기고 값은 카카오톡 채널 */
export default async function GoodsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const g = findGoods(slug)
  if (!g) notFound()

  // 운영자 2026-08-18: 상단 배지의 "· 판매중"은 뺀다 — 품절·오픈예정은 이미지 위
  // StatusOverlay(상태 !== open일 때만 렌더)가 별도로 신호하므로 텍스트 중복이 없다.
  // sub 도 "레이지데이 제품"(한글) 대신 카테고리 태그(g.cat="제품")와 겹치지 않게
  // 영어 한 줄 "Product" 로.
  return (
    <ProductDetail
      id={`goods-${g.slug}`}
      category={g.cat}
      status={g.status}
      title={g.name}
      sub="Product"
      description={g.description}
      fields={[{ label: "문의", lines: ["카카오톡 채널"], href: KAKAO_CHAT_URL }]}
      buyHref={`/one-day-talk-01/checkout?items=${goodsCode(g.slug)}`}
      options={{
        // 색별 제품컷 — 칩 클릭 시 메인 사진 교체 (운영자 2026-08-11, 나열 폐기)
        colors: g.colors.map((hex, i) => ({ hex, name: g.colorNames[i] ?? hex, img: g.colorImgs?.[i] })),
        sizes: g.sizes,
      }}
      price={g.price}
      deliveryReturns={DELIVERY_RETURNS}
      images={[{ src: g.img, alt: g.name }]}
      cartItem={{ id: `goods-${g.slug}`, name: g.name, price: g.price, href: `${BASE}/shop/${g.slug}`, img: g.img }}
    />
  )
}
