import type { Metadata } from "next"
import { HeroCheck } from "./HeroCheck"

/** 히어로 검수대 (2026-08-14 운영자 지시).
 *  "문제가 너무 잦아서 정적이미지 배포했으니까 다른 별도의 페이지에서 테스트 결과
 *   확인하고 최종적으로 랜딩페이지 배포하는 형태로 하자."
 *  → 랜딩(/lazyday)은 정적 포스터 이미지를 유지하고, 숨 쉬는 포스터의 수정은
 *    전부 이 페이지에서 확인받은 뒤에만 랜딩에 되살린다. */

export const metadata: Metadata = {
  title: "히어로 검수 — 레이지데이 북클럽",
  robots: { index: false, follow: false },
}

export default function HeroCheckPage() {
  return <HeroCheck />
}
