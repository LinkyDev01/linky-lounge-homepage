import Image from "next/image"
import styles from "./page.module.css"

/**
 * Hero 포스터 (정적). 스크롤 연동 모션은 제거됨 —
 * 단순 정적 이미지 + 다음 섹션 색으로 페이드되는 하단 그라데이션만 유지.
 */
export function HeroParallax() {
  return (
    <div className={styles.heroWrapper}>
      <Image
        src="/linky-lounge/book-club/3rd-poster-typo.webp"
        alt="Lazy Day Book Club 3기"
        className={styles.mainImage}
        width={1440}
        height={1800}
        priority
      />
      <div className={styles.heroFade} aria-hidden />
    </div>
  )
}
