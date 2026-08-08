import type { Metadata } from "next"
import { TurtleTrack } from "./TurtleTrack"
import styles from "./turtle.module.css"

/** 거북이 트랙 프로그레스 — 임시 페이지 (라운드 84 도입 · 87 트랙형 재설계).
 *  스타디움 트랙 루프 위에서 거북이가 2027년 1월 1일을 향해 아주 천천히 걷는다.
 *  중앙 카운트다운은 초 단위 실시간. 채택 시 실사이트 배치 위치를 정해 이식한다. */

export const metadata: Metadata = {
  title: "거북이 트랙 — 2027년까지",
  robots: { index: false, follow: false },
}

export default function TurtleDemoPage() {
  return (
    <main className={styles.page}>
      {/* 트랙 문구가 Gothic A1 을 쓴다 (라운드 115) — 단독 시연 페이지라 여기서 로드 */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@600;800&display=swap" />
      <div className={styles.demoWrap}>
        <TurtleTrack />
      </div>
    </main>
  )
}
