import styles from "./FifthSessionSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

export function FifthSessionSection() {
  return (
    <section id="fifth-session" className={styles.section}>
      <div className={styles.content}>
        <FadeUp>
          <div className={styles.titleRow}>
            <h2 className={styles.sectionTitle}>5회차</h2>
            <span className={styles.sectionSub}>자유 독서모임</span>
          </div>
          <p className={styles.footnote}>*5회차는 정규 독서모임 4회 이후 추가로 진행되는 모임입니다.</p>
        </FadeUp>

        <FadeUp delay={0.08}>
          <p className={styles.intro}>
            4회에 걸쳐 나눈 대화의 마무리이자,<br />
            모든 멤버가 처음으로 한자리에 모이는 날입니다.
          </p>
        </FadeUp>

        <FadeUp delay={0.14}>
          <div className={styles.sessionBlocks}>
            <div className={styles.sessionBlock}>
              <p className={styles.sessionMeta}>
                <span className={styles.sessionPart}>1부</span>
                <span className={styles.sessionName}>영화 감상</span>
                <span className={styles.sessionTime}>14:30–17:00</span>
              </p>
              <p className={styles.sessionDesc}>
                시각과 청각의 언어로 펼쳐지는 한 편의 영화를 함께 감상합니다. 철학과 예술이 맞닿아 있는 작품을 고르고, 4회에 걸쳐 쌓아온 사유를 영상의 언어로 한층 더 확장해가는 시간입니다.
              </p>
            </div>
            <div className={styles.sessionBlock}>
              <p className={styles.sessionMeta}>
                <span className={styles.sessionPart}>2부</span>
                <span className={styles.sessionName}>자유 독서모임</span>
                <span className={styles.sessionTime}>17:00–</span>
              </p>
              <p className={styles.sessionDesc}>
                다른 시간대에 만나지 못한 멤버들과 처음으로 한자리에 모입니다. 네 권의 책에서는 꺼내지 못했던 이야기, 각자가 멤버들에게 묻고 싶었던 이야기를 자유롭게 나누는 자리입니다.
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
