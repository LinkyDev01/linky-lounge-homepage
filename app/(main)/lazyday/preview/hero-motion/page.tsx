import type { Metadata } from "next"
import { HeroMotion } from "./HeroMotion"

/** 북클럽 히어로(인트로/포스터 자리) 모션 시안 4안 (라운드 133).
 *  현행 4기 포스터(4th-poster-typo.webp)의 조형 — 큰 글자 12자 + 문장이 실처럼
 *  얽힌 루프 — 를 재료로 한 대체안. 실사이트 미반영, 채택 시안만 이식 (철칙 1). */

export const metadata: Metadata = {
  title: "히어로 모션 시안 — 레이지데이 북클럽",
  robots: { index: false, follow: false },
}

export default function HeroMotionPage() {
  return <HeroMotion />
}
