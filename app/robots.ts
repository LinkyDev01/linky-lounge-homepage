import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { ADMIN_HOST } from "@/lib/site"

/**
 * robots.txt — 세 도메인(링키라운지·레이지데이 북클럽·레이지클럽)이 한 앱을
 * 공유하므로 호스트별로 정본 도메인·사이트맵을 가른다 (layout generateMetadata와 동일 패턴).
 * 관리자·프리뷰·API·결제 페이지는 색인 제외 (프리뷰는 미들웨어로도 홈 리다이렉트됨.
 * 단 레이지클럽 랜딩은 내부적으로 preview 트리를 rewrite하지만 URL이 / 라 여기 안 걸린다).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = ((await headers()).get("host") || "").toLowerCase()
  // 관리 호스트는 통째로 색인 제외 — 손님 사이트가 아니다 (2026-09-02 admin.lazy-club.com 분리)
  if (host === ADMIN_HOST) return { rules: { userAgent: "*", disallow: "/" } }
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
        // 마이페이지 — 본인 세션에서만 뜨는 개인 화면 (2026-09-02, 계획서 P4a).
        // lazy-club.com 에선 /mypage, 북클럽 도메인에선 /lazyclub/mypage 로 열린다
        "/mypage",
        "/lazyclub/mypage",
        // 모임장 기획서 폼 — 안내(/hosts)는 색인, 폼 페이지만 제외 (2026-09-05)
        "/hosts/apply",
        "/lazyclub/hosts/apply",
        // 구 주소 (2026-09-01 이전 전) — 301 이 받지만, 이미 색인된 주소가 다시 크롤되며
        // 리다이렉트 체인을 타지 않게 남겨 둔다
        "/one-day-talk-01/checkout",
        "/lazyday/one-day-talk-01/checkout",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
