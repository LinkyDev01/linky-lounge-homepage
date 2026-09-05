import type { Metadata } from "next"
import { WorkroomShell } from "../../Shell"
import { HostPlanFlow } from "./HostPlanFlow"
import styles from "../../home.module.css"

/** 모임 기획서 — 한 화면에 질문 하나. 폼 페이지라 noindex(마이페이지와 같은 처리, robots.ts disallow). */
export const metadata: Metadata = {
  title: "모임 기획서 — 레이지클럽",
  robots: { index: false, follow: false },
}

export default function HostsApplyPage() {
  return (
    <WorkroomShell>
      <main className={styles.content}>
        <div className={styles.indexHead}>
          <div className={styles.sectionTitle}>
            <span>
              <span>모임 기획서</span>
            </span>
          </div>
        </div>
        <HostPlanFlow />
      </main>
    </WorkroomShell>
  )
}
