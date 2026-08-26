import type { Metadata } from "next"
import { MotionTypeShowcase } from "./MotionTypeShowcase"

export const metadata: Metadata = { title: "LAZY CLUB 모션 타이포 시안" }

/**
 * LAZY CLUB 모션 타이포그래피 시안 비교 (릴 레퍼런스 — 픽셀 키네틱).
 * 실사이트·랜딩 인트로와 무관한 별개 시안 전용 페이지. 채택 시 이식 대상은 별도 지시로.
 */
export default function MotionTypePage() {
  return <MotionTypeShowcase />
}
