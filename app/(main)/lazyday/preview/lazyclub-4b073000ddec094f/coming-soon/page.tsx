import type { Metadata } from "next"
import { ComingSoonMain } from "./ComingSoonMain"
import { JsonLd } from "@/app/(main)/lazyday/JsonLd"

/**
 * lazy-club.com 랜딩페이지 (라운드 47 — '커밍순' 개념 폐기)
 * — 인트로(4×4 셔플 → LAZY·CLUB 완성 → 빙고 동그라미) 후 내비·푸터가 나타난다.
 * 경로명 /coming-soon 은 내부 식별자로만 유지 (미들웨어 rewrite·OG·파비콘이 묶임).
 * 파비콘·OG는 상위 layout.tsx(레이지클럽 메타)를 그대로 상속.
 * lazy-club.com 호스트는 middleware가 모든 경로를 이 페이지로 rewrite.
 */

// SEO (2026-08-12): 검색용 title·description·keywords + canonical.
// OG는 상위 lazyclub layout("레이지클럽 — lazy-club.com" + og-lazyclub-v4) 그대로 상속.
// canonical "/"는 metadataBase(호스트 분기) 기준 — lazy-club.com에선 자기 정본.
export const metadata: Metadata = {
  title: "레이지클럽 — 하루의 대화, 원데이 토크",
  description:
    "책과 영화를 하루의 대화로 만나는 원데이 토크, 그리고 레이지데이의 제품들. 서울 사당 링키라운지에서 열립니다.",
  keywords: ["원데이 토크", "북토크", "무비토크", "소셜클럽", "독서모임", "영화 모임", "사당 모임", "레이지클럽", "레이지데이"],
  alternates: { canonical: "/" },
}

export default function LazyClubLandingPage() {
  // 둥근모꼴은 CSS에 data URI로 인라인 (라운드 66) — preload 불필요
  return (
    <>
      <JsonLd brand="lazyclub" />
      <ComingSoonMain />
    </>
  )
}
