import type { Metadata } from "next"
import styles from "./turtle.module.css"

/** 거북이 프로그레스바 시연 — 임시 페이지 (라운드 84, 운영자 요청).
 *  운영자 제공 5프레임 워크 사이클 스트립을 가공한 스프라이트로,
 *  다리를 교차하며 프로그레스바 위를 좌→우로 걸어간다 (14초에 완주, 무한 반복).
 *  채택되면 실제 프로그레스(스크롤·폼 단계 등)에 연결해 이식한다. */

export const metadata: Metadata = {
  title: "거북이 프로그레스바 시연",
  robots: { index: false, follow: false },
}

export default function TurtleDemoPage() {
  return (
    <main className={styles.page}>
      <div className={styles.track} aria-hidden>
        <div className={styles.turtle} />
        <div className={styles.rail}>
          <div className={styles.fill} />
        </div>
      </div>
      <p className={styles.caption}>
        거북이 프로그레스바 시연 (임시) — 14초에 완주, 무한 반복
        <br />
        다리 8프레임 순환 2.4s (레퍼런스 GIF 프레임 그대로) · 채움 선과 동기 전진
      </p>
    </main>
  )
}
