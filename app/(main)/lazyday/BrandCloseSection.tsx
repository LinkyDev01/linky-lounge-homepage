import Image from "next/image"
import styles from "./BrandCloseSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

export function BrandCloseSection() {
  return (
    <section className={styles.section}>
      <FadeUp delay={0.15}>
        <div className={styles.logoWrap}>
          <Image
            src="/linky-lounge/book-club/ldbc-logo-text.png"
            alt="레이지데이 북클럽"
            width={417}
            height={240}
            style={{ objectFit: "contain", opacity: 0.8 }}
          />
        </div>
      </FadeUp>
    </section>
  )
}
