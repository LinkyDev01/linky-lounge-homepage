import type { Metadata } from "next"
import styles from "./page.module.css"
import { Footer } from "@/components/footer"
import { StickyApplyButton } from "./sticky-apply-button"
import { NavBar } from "./NavBar"
import { HeroParallax } from "./HeroParallax"
import { SectionIndicator } from "./SectionIndicator"
import { AboutSection } from "./AboutSection"
import { HowToSection } from "./HowToSection"
import { ScheduleSection } from "./ScheduleSection"
import { BookSection } from "./BookSection"
import { FifthSessionSection } from "./FifthSessionSection"
import { FaqSection } from "./FaqSection"
import { FeatureBoxSection } from "./FeatureBoxSection"
import { BrandCloseSection } from "./BrandCloseSection"

export const metadata: Metadata = {
  title: "레이지데이 북클럽",
  description: "당신의 이야기, 그리고 당신만의 방향이 남는 모임",
  openGraph: {
    title: "레이지데이 북클럽",
    description: "당신의 이야기, 그리고 당신만의 방향이 남는 모임",
    images: ["/linky-lounge/book-club/lazy%20is%20a.png"],
    type: "website",
  },
}

export default function StudyForeignPage() {
  return (
    <>
      <NavBar />
      <main className={styles.container} data-track-section="bookclub_home">
        <HeroParallax />
        <AboutSection />
        <FeatureBoxSection />
        <BookSection />
        <HowToSection />
        <FifthSessionSection />
        <ScheduleSection />
        <FaqSection />
        <BrandCloseSection />
      </main>

      <SectionIndicator />
      <StickyApplyButton />
      <Footer />
    </>
  )
}
