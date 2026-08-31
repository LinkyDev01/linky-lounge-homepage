import type { Metadata } from "next"
import { JourneyDoc } from "./JourneyDoc"

/** 레이지클럽 커머스 — 고객여정 설계 문서 (2026-08-18, 운영자 지시).
 *  "커머스 로드맵이 고객여정이야? 그렇다면 그것부터 설계한 인터랙티브 웹 문서가 필요하지"
 *  → 고객여정(고객이 겪는 흐름)을 먼저 놓고, 로드맵(우리가 만드는 순서)을 여정의
 *    빈틈에서 도출하는 구조. 구현 착수 전 운영자 검토·결정용 기획 문서다. */

export const metadata: Metadata = {
  title: "커머스 고객여정 — 레이지클럽",
  robots: { index: false, follow: false },
}

export default function CommerceJourneyPage() {
  return <JourneyDoc />
}
