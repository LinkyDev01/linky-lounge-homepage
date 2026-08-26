import type { Metadata } from "next"
import { CaptureStage } from "./CaptureStage"

export const metadata: Metadata = { title: "LAZY CLUB 워드서치 — 영상 캡처" }

/** 필드만 세로 캔버스에 놓는 캡처 전용 화면 (인스타 4:5 · 9:16). 시안 비교는 상위 라우트. */
export default function MotionTypeCapturePage() {
  return <CaptureStage />
}
