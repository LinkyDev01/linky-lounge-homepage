import styles from "./page.module.css"
import { HeroBreathingPoster } from "./HeroBreathingPoster"

/**
 * Hero 포스터 자리 — 2026-08-11 운영자 채택으로 정적 이미지
 * (4th-poster-typo.webp) → **숨 쉬는 포스터**(hero-motion 시안 ③)로 대체.
 * 실측 실 위로 〈사유의 기슭〉이 흐르고 큰 글자 12자는 정적 — 구도·종이색은
 * 원본 포스터와 동일. 하단 그라데이션(다음 섹션 색 페이드)은 종전 그대로.
 * 구 정적 이미지 버전은 git 이력의 이 파일 직전 버전 참조.
 */
export function HeroParallax() {
  return (
    <div className={styles.heroWrapper}>
      {/* 포스터 원본 서체 Pretendard — 랜딩 전역(SUIT)엔 없어 여기서 로드
          (checkout·terms 와 같은 CDN 방식, 운영자 원본 스펙 2026-08-12) */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
      />
      <HeroBreathingPoster />
      <div className={styles.heroFade} aria-hidden />
    </div>
  )
}
