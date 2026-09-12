import type { Metadata } from "next"
import { PushPreview } from "./PushPreview"

/** [프리뷰] 커피앤바 제목을 로고가 밀어 떨어뜨리는 안무 (운영자 2026-09-11 기획).
 *  내비 미등록·noindex. 2026-09-12 승인되어 실사이트 /meetings/dm-gd 에 이식됐다 —
 *  여기는 값 조정·재검수용 시안대(다시 재생·3배속)로 남긴다. */
export const metadata: Metadata = {
  title: "커피앤바 제목 낙하 시안 — 레이지클럽",
  robots: { index: false, follow: false },
}

export default function CoffeeBarPushPreviewPage() {
  return <PushPreview />
}
