import type React from "react"
import { Footer } from "@/components/footer"

export default function StudyForeignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ background: "#b8a38a", minHeight: "100vh"}}>
      {children}
      <Footer />
    </div>
  )
}
