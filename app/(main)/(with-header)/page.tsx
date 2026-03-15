import type { Metadata } from "next"
import {
  SpaceIntroSection,
  ProgramsSection,
  MeetupCalendarSection,
  GallerySection,
} from "@/components/lounge"

export const metadata: Metadata = {
  title: "링키라운지 - 𝑾𝒉𝒆𝒓𝒆 𝑾𝒆 𝑳𝒊𝒏𝒌",
}

export default function LoungePage() {
  return (
    <main className="min-h-screen">
      <SpaceIntroSection />
      <ProgramsSection />
      <MeetupCalendarSection />
      <GallerySection />
    </main>
  )
}
