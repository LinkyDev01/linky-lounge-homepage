import styles from "./AboutSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"
import { AboutMark } from "@/components/illustrations/bauhaus"

export function AboutSection() {
  return (
    <section id="about" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
          <AboutMark className={styles.mark} />
          <h2 className={styles.sectionTitle}>레이지데이 북클럽</h2>
        </div>
      </FadeUp>
      <div className={styles.leadBox}>
        <FadeUp delay={0.08}>
          <p className={styles.leadHero}>복잡함 속에서 찾는 단순함</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className={styles.leadIntro}>
            일상을 더 복잡하게 만드는 질문들은<br />
            앞세우지 않으려고 해요.
          </p>
        </FadeUp>
        <FadeUp delay={0.15}>
          <p className={styles.leadAccent}>
            중요한 건 딱 두 가지입니다.
          </p>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className={styles.leadBody}>
            이 책의 진짜 의도가 무엇인지,<br />
            그리고 거기서 내 이야기가 나올 수 있는지.
          </p>
        </FadeUp>
        <FadeUp delay={0.25}>
          <p className={styles.leadBody}>
            백 번의 독서모임을 하며 결국<br />
            제게 남은 질문도 이것뿐이었거든요.
          </p>
        </FadeUp>
        <FadeUp delay={0.3}>
          <p className={styles.leadFinale}>
            결국 이곳에 남는 건 책의 지식이 아니라<br />
            당신의 이야기, 그리고 당신만의 방향입니다.
          </p>
        </FadeUp>
      </div>
    </section>
  )
}
