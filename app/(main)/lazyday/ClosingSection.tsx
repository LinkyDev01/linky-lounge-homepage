import Image from "next/image"
import Link from "next/link"
import styles from "./ClosingSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"


export function ClosingSection() {
  return (
    <section id="closing-section" className={styles.section}>
      <div className={styles.inner}>
        <FadeUp delay={0.1}>
          <p className={styles.sub}>당신의 이야기, 그리고 당신만의 방향이 남는 모임</p>
        </FadeUp>
        <FadeUp delay={0.15}>
          <p className={styles.title}>
            레이지데이 북클럽 <span className={styles.accent}>2기</span> 모집 중
          </p>
        </FadeUp>
        <FadeUp delay={0.18}>
          <Image
            src="/linky-lounge/book-club/lazyday_logo.png"
            alt="Lazy Day"
            width={120}
            height={120}
            className={styles.logoImg}
          />
        </FadeUp>
        <FadeUp delay={0.22}>
          <Link href="/lazyday/apply" className={styles.cta}>
            2기 신청하기
          </Link>
        </FadeUp>
      </div>
    </section>
  )
}
