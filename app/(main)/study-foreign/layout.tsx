import type React from "react"
import { Footer } from "@/components/footer"

export default function StudyForeignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ background: "rgb(242 241 229)", minHeight: "100vh", paddingBottom: 80 }}>
      {children}
      <Footer />
    </div>
  )
}
