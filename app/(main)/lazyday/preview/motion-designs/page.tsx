import type { Metadata } from "next"
import { MotionDesigns } from "./MotionDesigns"

/** 모션 시안 쇼케이스 (라운드 130) — anime.js v4 아카이브 검토 기반.
 *  실사이트 미반영, 프리뷰 전용 제안. 채택 시안만 이식한다 (철칙 1). */

export const metadata: Metadata = {
  title: "모션 시안 — 레이지데이·레이지클럽",
  robots: { index: false, follow: false },
}

export default function MotionDesignsPage() {
  return <MotionDesigns />
}
