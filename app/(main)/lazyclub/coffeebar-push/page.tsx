import type { Metadata } from "next"
import { PushPreview } from "./PushPreview"

/** [프리뷰] 커피앤바 제목을 로고가 밀어 떨어뜨리는 안무 (운영자 2026-09-11 기획).
 *  내비 미등록·noindex. 실사이트 /meetings/dm-gd 미반영 — 승인 후 별건 이식. */
export const metadata: Metadata = {
  title: "커피앤바 제목 낙하 시안 — 레이지클럽",
  robots: { index: false, follow: false },
}

export default function CoffeeBarPushPreviewPage() {
  return <PushPreview />
}
