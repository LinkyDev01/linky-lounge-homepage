import type { Metadata } from "next"
import { ReviewsZoomCheck } from "../ReviewsZoomCheck"

/** 후기 모달 핀치 줌 검수대 (2026-08-19).
 *  운영자: "인스타그램에서 모바일 줌인 줌아웃 하는 그런 자연스러운 줌인/줌아웃" —
 *  실사이트 카드 캐러셀은 그대로, 모달 확대 로직만 프로토타입으로 교체해 확인받는다. */

export const metadata: Metadata = {
  title: "후기 확대 검수 — 레이지데이 북클럽",
  robots: { index: false, follow: false },
}

export default function ReviewsZoomCheckPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f7f3ee", paddingTop: 40, paddingBottom: 80 }}>
      <ReviewsZoomCheck />
    </main>
  )
}
