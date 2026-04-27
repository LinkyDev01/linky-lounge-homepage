import type { Metadata } from "next"
import Image from "next/image"
import styles from "./page.module.css"
import { StickyApplyButton } from "./sticky-apply-button"
import { NavBar } from "./NavBar"
import { AboutSection } from "./AboutSection"
import { VibeSection } from "./VibeSection"
import { HowToSection } from "./HowToSection"
import { ScheduleSection } from "./ScheduleSection"
import { BookSection } from "./BookSection"
import { FaqSection } from "./FaqSection"
import { ClosingSection } from "./ClosingSection"

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
      <NavBar />
      <main className={styles.container} data-track-section="독서모임_홈">
        <Image
          src="/linky-lounge/book-club/book-club-hero.png"
          alt="bookclub hero image"
          className={styles.mainImage}
          width={600}
          height={3000}
          priority
        />
        <AboutSection />
        <VibeSection />
        <BookSection />
        <HowToSection />
        <ScheduleSection />
        <FaqSection />
        <ClosingSection />
      </main>

      <StickyApplyButton />
    </>
  )
}
