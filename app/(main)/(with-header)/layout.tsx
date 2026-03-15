import type React from "react"
import { Header } from "@/components/header"
import { LoungeFooter } from "@/components/lounge"

export default function LoungeWithHeaderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header variant="lounge" />
      {children}
      <LoungeFooter />
    </>
  )
}
