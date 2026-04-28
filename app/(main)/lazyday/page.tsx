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
  description: "당신의 이야기, 그리고 당신만의 방향이 남는 모임",
  openGraph: {
    title: "레이지데이 북클럽",
    description: "당신의 이야기, 그리고 당신만의 방향이 남는 모임",
    images: ["/linky-lounge/book-club/bookclub-og-image.png"],
    type: "website",
  },
}

export default function StudyForeignPage() {
  return (
    <>
      <NavBar />
      <main className={styles.container} data-track-section="독서모임_홈">
        <div className={styles.heroWrapper}>
          <Image
            src="/linky-lounge/book-club/lazyday_poster_v2.png"
            alt="Lazy Day Book Club"
            className={styles.mainImage}
            width={1080}
            height={1350}
            priority
          />
        </div>
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
