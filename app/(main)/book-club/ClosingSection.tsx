import Image from "next/image"
import Link from "next/link"
import styles from "./ClosingSection.module.css"

export function ClosingSection() {
  return (
    <section id="closing-section" className={styles.section}>
      <div className={styles.inner}>
        <Image
          src="/logos/linky_lounge_logo_white.svg"
          alt="링키라운지"
          width={120}
          height={40}
          className={styles.logo}
        />
        <p className={styles.sub}>책과 대화로 시작해서 사람이 남는 모임</p>
        <p className={styles.title}>
          레이지데이 북클럽 <span className={styles.accent}>1기</span> 모집 중
        </p>
        <Link href="/book-club/apply" className={styles.cta}>
          지금 바로 신청하세요
        </Link>
      </div>
    </section>
  )
}
