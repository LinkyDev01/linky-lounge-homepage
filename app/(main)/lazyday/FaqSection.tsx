import type { ReactNode } from "react"
import styles from "./FaqSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"
import { FaqMark } from "@/components/illustrations/bauhaus"

type Faq = {
  id?: string
  q: string
  a: ReactNode
  sub?: string
}

const faqs: Faq[] = [
  {
    q: "인터뷰는 왜 하나요?",
    a: "20분 정도의 통화로 서로의 결을 가늠할 수 있는 자리입니다. 평소의 생각을 부담 없이 꺼내주세요.",
  },
  {
    q: "책을 다 읽고 와야 하나요?",
    a: "완독 자체보다는 책 속의 문장을 고민하는 시간이 더 중요합니다. '책 속의 문장으로 나의 생각이 확장될 수 있는가?'에 초점을 맞추어 읽어오시면 충분합니다.",
  },
  {
    id: "gathering",
    q: "정기 독서모임 외 함께하는 시간이 있나요?",
    a: (
      <>
        <strong className={styles.answerStrong}>레이지선데이 미드나잇</strong>은 레이지데이 멤버들만 참여하는 포틀럭 파티입니다. 다른 시간대에 만나지 못한 멤버들과 새로운 인연을 쌓을 수 있습니다.
      </>
    ),
  },
  {
    q: "모임은 어디에서 진행하나요?",
    a: "모든 모임은 링키라운지(사당역 10번 출구 4분 거리)에서 진행합니다.",
    sub: "*상황에 따라 장소가 변경될 수 있습니다",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
          <FaqMark className={styles.mark} />
        </div>
      </FadeUp>

      <div className={styles.list}>
        {faqs.map((faq, i) => (
          <FadeUp key={faq.q} delay={0.1 + i * 0.06}>
            <div id={faq.id} className={styles.item}>
              <p className={styles.question}>{faq.q}</p>
              <p className={styles.answer}>{faq.a}</p>
              {faq.sub && <p className={styles.answerNote}>{faq.sub}</p>}
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp delay={0.4}>
        <div className={styles.contact}>
          <p className={styles.contactText}>다른 질문이 있어요</p>
          <a
            href="https://www.instagram.com/linky_lounge"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactLink}
          >
            인스타그램 DM으로 편하게 물어보세요 →
          </a>
        </div>
      </FadeUp>
    </section>
  )
}
