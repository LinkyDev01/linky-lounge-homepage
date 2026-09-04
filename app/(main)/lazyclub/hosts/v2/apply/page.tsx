import type { Metadata } from "next"
import { WorkroomShell } from "../../../Shell"
import { HostPlanFlow } from "./HostPlanFlow"
import styles from "../../../home.module.css"

/** 모임 기획서 — 한 화면에 질문 하나 (v2 시안, noindex). 접수 계약은 v1 과 같다(type:"host"). */
export const metadata: Metadata = {
  title: "모임 기획서 (시안 v2) — 레이지클럽",
  robots: { index: false, follow: false },
}

export default function HostsV2ApplyPage() {
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
