import Image from "next/image"
import styles from "./BrandCloseSection.module.css"
import { BlurReveal } from "@/components/animation/BlurReveal"

export function BrandCloseSection() {
  return (
    <section className={styles.section}>
      <BlurReveal duration={1.28} blur={14} fromScale={1.04} finalOpacity={0.8}>
        <div className={styles.logoWrap}>
          <Image
            src="/linky-lounge/book-club/ldbc-logo-text.png"
            alt="레이지데이 북클럽"
            width={417}
            height={240}
            style={{ objectFit: "contain" }}
          />
        </div>
      </BlurReveal>
    </section>
  )
}
