import Image from "next/image"
import styles from "./page.module.css"

/**
 * Hero 이미지 + 하단 그라데이션 오버레이.
 * (parallax는 폐기됨. 단순 정적 이미지 + 다음 섹션 색으로 자연스럽게
 * 페이드되는 그라데이션만 유지.)
 */
export function HeroParallax() {
  return (
    <div className={styles.heroWrapper}>
      <Image
        src="/linky-lounge/book-club/lazyday_poster_v2.png"
        alt="Lazy Day Book Club"
        className={styles.mainImage}
        width={1080}
        height={1350}
        priority
      />
      <div className={styles.heroFade} aria-hidden />
    </div>
  )
}
