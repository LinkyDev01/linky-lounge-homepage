import Link from "next/link"
import styles from "./ClosingSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"
import { ClosingMark } from "@/components/illustrations/bauhaus"

export function ClosingSection() {
  return (
    <section id="closing-section" className={styles.section}>
      <div className={styles.inner}>
        <FadeUp>
          <ClosingMark className={styles.mark} />
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className={styles.sub}>당신의 이야기, 그리고 당신만의 방향이 남는 모임</p>
        </FadeUp>
        <FadeUp delay={0.15}>
          <p className={styles.title}>
            레이지데이 북클럽 <span className={styles.accent}>2기</span> 모집 중
          </p>
        </FadeUp>
        <FadeUp delay={0.2}>
          <Link href="/lazyday/apply" className={styles.cta}>
            지금 바로 신청하세요
          </Link>
        </FadeUp>
      </div>
    </section>
  )
}
