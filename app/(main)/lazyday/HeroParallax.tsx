"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import styles from "./page.module.css"

/**
 * Hero 시네마틱: 스크롤하면 포스터가 천천히 줄어들고(스케일) 어두워지며,
 * 살짝 아래로 밀려나 다음 섹션에 자리를 내준다. "스크롤 = 이야기의 시작".
 * prefers-reduced-motion 시 정적 포스터 + 하단 페이드만 렌더한다.
 */
export function HeroParallax() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  // 스크롤 진행도(0→1)에 따라 포스터가 받는 변형
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9])
  const y = useTransform(scrollYProgress, [0, 1], [0, 56])
  const radius = useTransform(scrollYProgress, [0, 0.55], [0, 20])
  const darken = useTransform(scrollYProgress, [0, 1], [0, 0.5])

  if (reduce) {
    return (
      <div className={styles.heroWrapper}>
        <div className={styles.heroCard}>
          <Image
            src="/linky-lounge/book-club/3rd-poster-typo.png"
            alt="Lazy Day Book Club 3기"
            className={styles.mainImage}
            width={1440}
            height={1800}
            priority
          />
          <div className={styles.heroFade} aria-hidden />
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className={styles.heroWrapper}>
      <motion.div
        className={styles.heroCard}
        style={{ scale, y, borderRadius: radius }}
      >
        <Image
          src="/linky-lounge/book-club/3rd-poster-typo.png"
          alt="Lazy Day Book Club 3기"
          className={styles.mainImage}
          width={1440}
          height={1800}
          priority
        />
        <div className={styles.heroFade} aria-hidden />
        <motion.div
          className={styles.heroDarken}
          style={{ opacity: darken }}
          aria-hidden
        />
      </motion.div>
    </div>
  )
}
