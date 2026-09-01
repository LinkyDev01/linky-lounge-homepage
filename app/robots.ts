import type { MetadataRoute } from "next"
import { headers } from "next/headers"

/**
 * robots.txt — 세 도메인(링키라운지·레이지데이 북클럽·레이지클럽)이 한 앱을
 * 공유하므로 호스트별로 정본 도메인·사이트맵을 가른다 (layout generateMetadata와 동일 패턴).
 * 관리자·프리뷰·API·결제 페이지는 색인 제외 (프리뷰는 미들웨어로도 홈 리다이렉트됨.
 * 단 레이지클럽 랜딩은 내부적으로 preview 트리를 rewrite하지만 URL이 / 라 여기 안 걸린다).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = ((await headers()).get("host") || "").toLowerCase()
  const isBookclub = host.includes("lazyday-bookclub.com")
  const base = isBookclub
    ? "https://www.lazyday-bookclub.com"
    : host.includes("lazy-club.com")
      ? "https://www.lazy-club.com" // 정본 = www (애펙스 → www 308, 2026-08-12 실측)
      : "https://linkylounge.com"
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/lazyday/admin",
        "/preview",
        "/lazyday/preview",
        "/api/",
        // 결제(체크아웃·승인 결과)는 거래 페이지 — 검색 결과 노출 제외 (SEO 2026-08-12)
        "/checkout",
        "/lazyday/checkout",
        // 구 주소 (2026-09-01 이전 전) — 301 이 받지만, 이미 색인된 주소가 다시 크롤되며
        // 리다이렉트 체인을 타지 않게 남겨 둔다
        "/one-day-talk-01/checkout",
        "/lazyday/one-day-talk-01/checkout",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
