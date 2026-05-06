import type { Metadata } from "next"
import Image from "next/image"
import styles from "./page.module.css"
import { ApplyButton } from "./apply-button"

export const metadata: Metadata = {
  title: "링키라운지 외국어 회화",
}

export default function StudyForeignPage() {
  return (
    <>
      <main className={styles.container} data-track-section="study_foreign_home">
        <Image
          src="/linky-lounge/study-foreign/linky-study.png"
          alt="Linky Study"
          className={styles.mainImage}
          width={600}
          height={3000}
          priority
        />
      </main>

      <div className={styles.fixedButtonContainer}>
        <ApplyButton />
      </div>
    </>
  )
}
