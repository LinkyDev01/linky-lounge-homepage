import type { Metadata } from "next"
import { WorkroomShell } from "../Shell"
import shell from "../home.module.css"
import { TermsBody } from "@/app/(main)/lazyday/terms/TermsBody"

export const metadata: Metadata = {
  title: "이용약관 · 레이지데이",
  description: "레이지데이 통합 이용약관",
}

/**
 * 통합 이용약관 — 워크룸 셸 판. 본문은 실사이트 /lazyday/terms 의
 * TermsBody 를 그대로 공유한다 (법률 문서 — 사본 드리프트 금지).
 * 조문 수정은 app/(main)/lazyday/terms/TermsBody.tsx 한 곳만.
 */

export default function PreviewTermsPage() {
  return (
    <WorkroomShell>
      <main className={shell.content}>
        <TermsBody />
      </main>
    </WorkroomShell>
  )
}
