import type { MetadataRoute } from "next"
import { headers } from "next/headers"

/**
 * sitemap.xml — 호스트별로 공개 URL(깨끗한 경로)을 나열한다.
 * 북클럽 도메인은 middleware가 / → /lazyday로 rewrite하므로, 사이트맵엔
 * 내부 /lazyday/* 가 아닌 공개 경로(/, /apply …)를 싣는다.
 * admin·preview·api는 제외.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = ((await headers()).get("host") || "").toLowerCase()

  if (host.includes("lazyday-bookclub.com")) {
    const b = "https://www.lazyday-bookclub.com"
    return [
      { url: `${b}/`, changeFrequency: "weekly", priority: 1 },
      { url: `${b}/apply`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${b}/apply/interview/schedule`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${b}/lounge-info`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${b}/policy`, changeFrequency: "yearly", priority: 0.2 },
    ]
  }

  // 링키라운지 (기본 호스트)
  const b = "https://linkylounge.com"
  return [
    { url: `${b}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${b}/lounge-info`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${b}/policy`, changeFrequency: "yearly", priority: 0.2 },
  ]
}
