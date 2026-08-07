import { ComingSoonMain } from "./ComingSoonMain"

/**
 * lazy-club.com 랜딩페이지 (라운드 47 — '커밍순' 개념 폐기)
 * — 인트로(4×4 셔플 → LAZY·CLUB 완성 → 빙고 동그라미) 후 내비·푸터가 나타난다.
 * 경로명 /coming-soon 은 내부 식별자로만 유지 (미들웨어 rewrite·OG·파비콘이 묶임).
 * 파비콘·OG는 상위 layout.tsx(레이지클럽 메타)를 그대로 상속.
 * lazy-club.com 호스트는 middleware가 모든 경로를 이 페이지로 rewrite.
 */
export default function LazyClubLandingPage() {
  return (
    <>
      {/* 둥근모꼴 서브셋 미리 받기 — CSS 파싱을 기다리지 않고 첫 페인트에 맞춘다.
          같은 출처라도 폰트는 CORS 모드로 받으므로 crossOrigin 필수 (라운드 65) */}
      <link rel="preload" href="/fonts/dunggeunmo-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <ComingSoonMain />
    </>
  )
}
