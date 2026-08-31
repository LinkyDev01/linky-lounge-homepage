import type { Metadata } from "next"
import { CtaDesigns } from "./CtaDesigns"

export const metadata: Metadata = {
  title: "하단 CTA 시안 · 레이지데이 북클럽",
}

/**
 * 하단 고정 CTA 시안 쇼케이스 (운영자 2026-08-12: "현재 CTA가 상당히 강렬한데
 * 대안 있다면 말해줘. 나쁘진 않지만 너무 노골적이라" → "시안페이지 만들어").
 * 현행 포함 6안을 같은 문맥(실제 랜딩 하단 + 스크롤)에서 전환 비교한다.
 * 실사이트 미반영 — 프리뷰 전용 제안.
 */
export default function CtaDesignsPage() {
  return <CtaDesigns />
}
