import type { MetadataRoute } from "next"
import { headers } from "next/headers"

/**
 * robots.txt — 두 도메인(링키라운지·레이지데이 북클럽)이 한 앱을 공유하므로
 * 호스트별로 정본 도메인·사이트맵을 가른다 (layout generateMetadata와 동일 패턴).
 * 관리자·프리뷰·API는 색인 제외 (프리뷰는 미들웨어로도 홈 리다이렉트됨).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = ((await headers()).get("host") || "").toLowerCase()
  const base = host.includes("lazyday-bookclub.com")
    ? "https://www.lazyday-bookclub.com"
    : "https://linkylounge.com"
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/lazyday/admin", "/preview", "/lazyday/preview", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
