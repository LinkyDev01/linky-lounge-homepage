import type { Metadata } from "next"
import { LinkRevealShowcase } from "./LinkRevealShowcase"

/** 인물 약력의 커피앤바 링크(네비올로·네그로니) 점멸 시안 (2026-09-07) — 실배치 + 호버 4안 스위처.
 *  내비 미등록·noindex. 사람 페이지 미반영 — 채택안 확정 후 별건 이식. */

export const metadata: Metadata = {
  title: "약력 링크 점멸 시안 — 레이지클럽",
  robots: { index: false, follow: false },
}

export default function LinkRevealPage() {
  return <LinkRevealShowcase />
}
