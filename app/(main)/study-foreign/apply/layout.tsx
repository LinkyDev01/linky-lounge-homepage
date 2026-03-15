import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "외국어 회화 신청하기",
}

export default function StudyForeignApplyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
