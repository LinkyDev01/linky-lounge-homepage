/**
 * 구조화 데이터 (schema.org JSON-LD) — Organization + WebSite (SEO 2026-08-12).
 * 대화상점 실측 패턴(Organization에 alternateName·address·telephone·sameAs)을 따른다.
 * 서버 컴포넌트 — 북클럽 랜딩(lazyday/page.tsx)과 레이지클럽 랜딩(coming-soon)이
 * 브랜드 파라미터로 공유한다. SearchAction은 사이트 내 검색이 없어 제외.
 * 주소·전화는 goods-config DELIVERY_RETURNS(교환/반품 주소·고객센터)와 같은 값 — 함께 고칠 것.
 */

const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "동작대로7길 44, 지하 1층",
  addressLocality: "동작구",
  addressRegion: "서울특별시",
  addressCountry: "KR",
}

const SAME_AS = ["https://instagram.com/lazyday_bookclub", "https://pf.kakao.com/_gixaAX"]

const BRANDS = {
  bookclub: {
    name: "레이지데이 북클럽",
    alternateName: ["lazyday bookclub", "레이지데이"],
    url: "https://www.lazyday-bookclub.com",
    logo: "https://www.lazyday-bookclub.com/linky-lounge/book-club/og-lazyday-heart-v5.png",
    // 사실형 유지 자리 — 검색 스니펫(meta description)은 브랜드 한 줄로 갔고,
    // 지역·주제 신호는 여기와 keywords 가 든다 (운영자 2026-08-12 문구 지정)
    description: "고전과 철학을 다루는 서울 사당 독서모임.",
  },
  lazyclub: {
    name: "레이지클럽",
    alternateName: ["lazy club", "레이지데이"],
    url: "https://www.lazy-club.com",
    logo: "https://www.lazy-club.com/linky-lounge/book-club/home-v3/og-lazyclub-v4.png",
    description: "책과 영화를 하루의 대화로 만나는 원데이 토크, 그리고 레이지데이의 제품들.",
  },
} as const

export function JsonLd({ brand }: { brand: keyof typeof BRANDS }) {
  const b = BRANDS[brand]
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: b.name,
      alternateName: b.alternateName,
      url: b.url,
      logo: b.logo,
      description: b.description,
      address: ADDRESS,
      telephone: "010-7444-5790",
      sameAs: SAME_AS,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: b.name,
      url: b.url,
    },
  ]
  return (
    // JSON.stringify 출력엔 스크립트 태그가 없어 XSS 표면 없음 (정적 상수만 직렬화)
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}
