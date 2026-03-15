import type { Metadata } from "next"
import Image from "next/image"
import styles from "./page.module.css"
import { ApplyButton } from "./apply-button"
import { BookSection } from "./BookSection"

export const metadata: Metadata = {
  title: "레이지데이 북클럽",
  description: "책 얘기로 시작해요. 어느 순간 내 얘기가 나와요. 완독의 강박 대신 나를 읽는 여유, 레이지데이 북클럽",
  openGraph: {
    title: "레이지데이 북클럽",
    description: "책 얘기로 시작해요. 어느 순간 내 얘기가 나와요. 완독의 강박 대신 나를 읽는 여유, 레이지데이 북클럽",
    images: ["/linky-lounge/book-club/bookclub-og-image.png"],
    type: "website",
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
        <BookSection />
      </main>

      <div className={styles.fixedButtonContainer}>
        <ApplyButton />
      </div>
    </>
  )
}
