import styles from "./AboutSection.module.css"

export function AboutSection() {
  return (
    <section className={styles.section}>
      <div className={styles.block}>
        <h2 className={styles.blockTitle}>책을 읽다 문득, 내 이야기가 하고 싶어질 때.</h2>
        <div className={styles.blockContent}>
          <p className={styles.paragraph}>
            지식을 채우는 공부 대신, 마음을 비우는 대화를 선택합니다.
            타인의 목소리에서 나를 발견하고, 나의 고백이 누군가의 영감이 되는 경험.
          </p>
          <p className={styles.paragraph}>
            <span className={styles.accent}>LazyDay</span>는 책이라는 거울을 통해
            각자의 삶을 가만히 비춰보는 느슨한 연대의 공동체입니다.
          </p>
        </div>
      </div>

      <div className={styles.block}>
        <h2 className={styles.blockTitle}>밀도 있는 대화를 위한 구조</h2>
        <div className={styles.operationGrid}>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>8주, 4권</span>
            <p className={styles.operationDesc}>
              8주간 격주 정기 모임으로 운영됩니다. 매회차 깊이 있는 대화를 위해 지정된 멤버와 함께합니다.
            </p>
          </div>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>1부·2부 구조</span>
            <p className={styles.operationDesc}>
              모임장 발제로 열고, 멤버 발제로 이어져요. 책 이야기가 나의
              이야기가 되는 흐름이에요.
            </p>
          </div>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>사전 인터뷰</span>
            <p className={styles.operationDesc}>
              15분의 전화 인터뷰로, 만나기 전 서로를 알아가요. 인터뷰는
              심사가 아니라 대화예요.
            </p>
          </div>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>게더링</span>
            <p className={styles.operationDesc}>
              모임 밖에서 더 많은 사람들과 자연스럽게 만나는 시간. 멤버가
              아닌 분들도 함께해요.
            </p>
          </div>
        </div>
      </div>

    </section>
  )
}
