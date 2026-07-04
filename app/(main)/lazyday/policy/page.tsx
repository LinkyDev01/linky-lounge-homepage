import type { Metadata } from "next"
import { Suspense } from "react"
import { PolicyTabs } from "./PolicyTabs"

export const metadata: Metadata = {
  title: "이용약관 및 환불 규정 · 레이지데이 북클럽",
  description: "레이지데이 북클럽 이용약관과 청약철회·환불 기준 안내",
}

export default function LazydayPolicyPage() {
  return (
    <Suspense>
      <PolicyTabs />
    </Suspense>
  )
}
