import type { Metadata } from "next"
import { MeetupCalendar } from "./MeetupCalendar"
import styles from "./calendar.module.css"

/** 모임 캘린더 — 레이지클럽 톤 시안 (라운드 93, 임시 페이지).
 *  캘린더 아래에 거북이 트랙이 같은 폭으로 붙는다. */

export const metadata: Metadata = {
  title: "모임 캘린더 — 레이지클럽 톤 시안",
  robots: { index: false, follow: false },
}

export default function CalendarPreviewPage() {
  return (
    <main className={styles.page}>
      {/* 제목 배역용 Gothic A1 — 셸(WorkroomShell)을 안 쓰는 단독 시안이라 여기서 로드 */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;600&display=swap" />
      <MeetupCalendar />
    </main>
  )
}
