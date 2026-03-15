import styles from "./AboutSection.module.css"

export function AboutSection() {
  return (
    <section className={styles.section}>
      <div className={styles.block}>
        <h2 className={styles.blockTitle}>LazyDay라는 시간 속에서</h2>
        <div className={styles.blockContent}>
          <p className={styles.paragraph}>
            무언가를 배워야 한다는 부담은 내려놓으세요. 대신 마음을 나누는 대화를 채워요.
            누군가의 말 한마디에 나를 발견하고, 내 진심이 누군가에게 영감을 주는 포근한 시간.
          </p>
          <p className={styles.paragraph}>
            책이라는 거울 앞에 모여 서로의 삶을 가만히 들여다보는 곳,{" "}
            <span className={styles.accent}>LazyDay</span>에서 우리 천천히, 그리고 깊게 연결되어요.
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
