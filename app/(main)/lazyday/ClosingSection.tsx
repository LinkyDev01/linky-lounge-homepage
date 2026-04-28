import Image from "next/image"
import Link from "next/link"
import styles from "./ClosingSection.module.css"
import { SeedPod } from "@/components/illustrations/poppy"
import { FadeUp } from "@/components/animation/FadeUp"

export function ClosingSection() {
  return (
    <section id="closing-section" className={styles.section}>
      <div className={styles.inner}>
        <FadeUp>
          <Image
            src="/logos/linky_lounge_logo_white.svg"
            alt="링키라운지"
            width={120}
            height={40}
            className={styles.logo}
          />
        </FadeUp>
        <FadeUp delay={0.05}>
          <p className={styles.sub}>당신의 이야기, 그리고 당신만의 방향이 남는 모임</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className={styles.title}>
            레이지데이 북클럽 <span className={styles.accent}>2기</span> 모집 중
          </p>
        </FadeUp>
        <FadeUp delay={0.15} className={styles.locationRow}>
          <SeedPod className={styles.locationMarker} aria-hidden />
          <span className={styles.locationText}>사당역 10번 출구 도보 4분 · 링키라운지</span>
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
