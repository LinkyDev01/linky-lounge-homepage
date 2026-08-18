import styles from "./page.module.css"
import { HeroBreathingPoster } from "./HeroBreathingPoster"

/**
 * Hero 포스터 자리 — **숨 쉬는 포스터** (hero-motion 시안 ③, 2026-08-11 채택).
 * 실측 실 위로 〈사유의 기슭〉이 흐르고 큰 글자 12자는 정적 — 구도·종이색은
 * 원본 포스터와 동일. 하단 그라데이션(다음 섹션 색 페이드)은 종전 그대로.
 *
 * 2026-08-13~17 **정적 이미지 임시 복귀** 기간이 있었다 (운영자 "문제가 너무 잦아서
 * 정적이미지 배포했으니까 다른 별도의 페이지에서 테스트 결과 확인하고 최종적으로
 * 랜딩페이지 배포하는 형태로 하자"). 그 사이 `preview/hero-check` 에서 iOS 결함을
 * 전부 규명해 배치를 **빌드 타임 확정**으로 옮겼고(poster-metrics/poster-place),
 * 운영자 검수 통과("됐다. 이제 레이지데이 북클럽 랜딩페이지 포스터자리 배포하고")로
 * 2026-08-17 재점등했다. 정적 이미지 버전은 git 이력 참조.
 */
export function HeroParallax() {
  return (
    <div className={styles.heroWrapper}>
      {/* 랜딩 유일 h1 — 히어로가 SVG 포스터라 문서에 제목 텍스트가 없어
          시각 숨김(srOnly)으로 보충 (SEO·접근성, 2026-08-12. 화면 픽셀 무변경) */}
      <h1 className={styles.srOnly}>레이지데이 북클럽</h1>
      {/* Pretendard CDN 링크는 제거 (2026-08-17) — **루트 레이아웃이 같은 URL 을
          이미 전역 로드**하고 있어 순수 중복이었고, 여기 있던 사본은 렌더 블로킹이라
          첫 페인트만 늦췄다. 책 제목·모임소개 라벨은 루트 로드(DeferredCss, 비차단)가
          공급한다. 포스터는 애초에 자체 호스팅 서브셋이라 무관. */}
      <HeroBreathingPoster />
      <div className={styles.heroFade} aria-hidden />
    </div>
  )
}
