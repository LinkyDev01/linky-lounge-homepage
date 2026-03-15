import type { Metadata } from "next"
import Image from "next/image"
import styles from "./page.module.css"
import { ApplyButton } from "./apply-button"

export const metadata: Metadata = {
  title: "레이지데이 북클럽",
  openGraph: {
    images: ["/linky-lounge/book-club/bookclub-og-image.png"],
  },
}

export default function StudyForeignPage() {
  return (
    <>
      <main className={styles.container} data-track-section="독서모임_홈">
        <Image
          src="/linky-lounge/book-club/book-club.png"
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
