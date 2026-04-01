import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "링키라운지 | 𝑾𝒉𝒆𝒓𝒆 𝑾𝒆 𝑳𝒊𝒏𝒌",
  description: "링키라운지 안내사항",
  openGraph: {
    title: "링키라운지 | 𝑾𝒉𝒆𝒓𝒆 𝑾𝒆 𝑳𝒊𝒏𝒌",
    description: "링키라운지 안내사항",
    images: ["/linky-lounge/gallary/main.jpg"],
  },
}

export default function LoungeInfoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
