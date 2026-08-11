import type { Metadata } from "next"
import { MotionBookclub } from "./MotionBookclub"

/** 북클럽 모션 시안 — 아카이브 확장 4안 (라운드 132).
 *  라운드 130 쇼케이스(motion-designs)와 별개 — 기존 자산 재활용이 아니라
 *  anime.js 아카이브에서 새로 발굴한 문법을 북클럽 랜딩에 적용한 신규 안.
 *  실사이트 미반영, 채택 시안만 이식한다 (철칙 1). */

export const metadata: Metadata = {
  title: "북클럽 모션 시안 — 아카이브 확장 4안",
  robots: { index: false, follow: false },
}

export default function MotionBookclubPage() {
  return <MotionBookclub />
}
