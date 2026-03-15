import styles from "./AboutSection.module.css"

export function AboutSection() {
  return (
    <section className={styles.section}>
      <div className={styles.block}>
        <h2 className={styles.blockTitle}>어떤 모임인가요</h2>
        <div className={styles.blockContent}>
          <p className={styles.lead}>책이 그 문을 열어줘요.</p>
          <p className={styles.paragraph}>
            같은 질문으로 시작해도 각자의 서로 다른 이야기가 나와요.
            그러다 보면 서로가 보이기 시작해요.
          </p>
          <p className={styles.lead}>아무나와는 안 돼요.</p>
          <p className={styles.paragraph}>
            모든 멤버가 운영진과 먼저 대화를 나눠요.
            어떤 사람인지, 어떤 생각을 하는지.
            처음 만나는 자리인데 결이 맞는 사람들이 모여 있는 이유예요.
          </p>
          <p className={styles.lead}>한 번으로 끝나지 않아요.</p>
          <p className={styles.paragraph}>
            8주 동안 같은 사람들과 격주로 만나요.
            서서히 대화가 쌓이며 관계가 깊은 이야기가 오가요.
          </p>
        </div>
      </div>

      <div className={styles.block}>
        <h2 className={styles.blockTitle}>어떻게 운영되나요</h2>
        <div className={styles.operationGrid}>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>8주, 4권</span>
            <p className={styles.operationDesc}>
              격주로 만나요. 링키라운지에서, 같은 사람들과.
            </p>
          </div>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>2부 구조</span>
            <p className={styles.operationDesc}>
              모임장 발제로 열고, 멤버 발제로 이어져요.
              책 이야기가 나의 이야기가 되는 흐름이에요.
            </p>
          </div>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>사전 인터뷰</span>
            <p className={styles.operationDesc}>
              함께할 사람을 확인하고 결정해요.
              인터뷰는 심사가 아니라 대화예요.
              30분, 링키라운지에서 편하게 이야기해요.
            </p>
          </div>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>게더링</span>
            <p className={styles.operationDesc}>
              모임 밖에서 더 많은 사람들과 자연스럽게 만나는 시간.
              멤버가 아닌 분들도 함께해요.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.block}>
        <p className={styles.paragraph}>
          책 얘기로 시작하다보면, 어느 순간 내 얘기가 나와요.
        </p>
        <p className={styles.paragraph}>
          주변에서 독서 얘기를 많이 듣는데, 열심히 읽어야 하고 완독해야 하고 성장해야 한다는 분위기가 많더라고요.
          저도 그렇게 해봤어요. 근데 그게 꼭 좋은 독서 경험을 만들진 않았어요.
        </p>
        <p className={styles.paragraph}>
          100회 이상 독서모임을 하면서 알게 된 건, 책이 좋아야 대화가 열리는 게 아니라는 거예요.
          이 책 앞에서 나의 이야기가 자연스럽게 나올 수 있는가. 그게 기준이었어요.
        </p>
        <p className={styles.paragraph}>
          4권에는 흐름이 있어요. 자기가 어떻게 살아왔는지 돌아보고, 등장인물을 통해 새로운 시선으로 자신을 바라보고,
          세상을 어떤 관점으로 살아왔는지, 앞으로 어떤 태도를 취할 건지.
          어린 왕자에서 시지프 신화까지 그 맥락으로 이어져요.
        </p>
        <p className={styles.paragraph}>
          무겁게 가지 않아요. 정답 같은 말을 준비하지 않아도 돼요.
          그냥 책에서 걸린 것 하나 들고 오면 충분해요.
        </p>
      </div>
    </section>
  )
}
