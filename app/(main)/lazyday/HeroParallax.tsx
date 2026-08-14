import Image from "next/image"
import styles from "./page.module.css"

/**
 * Hero 포스터 자리 — 2026-08-13 운영자 지시로 **임시 정적 이미지 복귀**.
 * "포스터 위치에 애니메이션 가능한 텍스트를 모션으로 대체해놨는데, 완성되면
 *  다시 살리려고 하니 지금은 포스터로 교체해놔" — 숨 쉬는 포스터(HeroBreathingPoster,
 *  hero-motion 시안 ③, 2026-08-11 채택)는 **삭제하지 않고 고아 보존**. 재점등 시
 *  이 파일에서 <HeroBreathingPoster /> 로 되돌리기만 하면 된다.
 * 이 파일의 직전 버전(모션)은 git 이력 참조.
 */
export function HeroParallax() {
  return (
    <div className={styles.heroWrapper}>
      {/* 랜딩 유일 h1 — SEO·접근성용 시각 숨김(2026-08-12 결정, 이미지 스왑과 무관해 유지) */}
      <h1 className={styles.srOnly}>레이지데이 북클럽</h1>
      {/* Pretendard — 포스터 자체엔 더는 안 쓰지만, 책 제목(BookSection)·모임소개·
          진행순서 라벨(FeatureQuietSection·HowToSection)이 이 CDN 로드에 기대고
          있어 유지한다 (checkout·terms 와 같은 방식) */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
      />
      <Image
        src="/linky-lounge/book-club/4th-poster-typo.webp"
        alt="Lazy Day Book Club 4기 모집"
        className={styles.mainImage}
        width={1600}
        height={2000}
        priority
      />
      <div className={styles.heroFade} aria-hidden />
    </div>
  )
}
