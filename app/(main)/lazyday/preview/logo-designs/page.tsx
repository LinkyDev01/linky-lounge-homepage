import type { Metadata } from "next"
import { LogoDesigns } from "./LogoDesigns"

export const metadata: Metadata = {
  title: "동적 로고 시안 · 레이지데이 북클럽",
}

/**
 * 동적 로고 시안 쇼케이스 (운영자 2026-08-12) — 내비 1행의 "레이지데이 북클럽"
 * 텍스트를 빼고, I ♥ LAZYDAY 손글씨(Cafe24 냥이체 W) + 손그림 하트 SVG 를
 * 레이지클럽처럼 **움직이는 로고**로 대체하기 위한 복수 시안.
 * 라운딩(아치) 배치와 1행 한 줄 배치를 모두 포함 — 채택안은 반응형 초안
 * (bookclub-responsive) 내비에 이식한다.
 */
export default function LogoDesignsPage() {
  return <LogoDesigns />
}
