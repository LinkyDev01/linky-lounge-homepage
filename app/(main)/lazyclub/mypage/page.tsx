import type { Metadata } from "next"
import { MypageView } from "./MypageView"

/** 마이페이지 — 본인 세션에서만 뜨는 개인 화면. 어느 도메인이든 noindex (레이아웃의
 *  호스트별 index 판정을 여기서 덮어쓴다 — 개인 화면은 색인될 이유가 없다) */
export const metadata: Metadata = {
  title: "마이페이지 — 레이지클럽",
  robots: { index: false, follow: false },
}

export default function MypagePage() {
  return <MypageView />
}
