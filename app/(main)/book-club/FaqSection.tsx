import styles from "./FaqSection.module.css"

const faqs = [
  {
    q: "책을 다 읽고 와야 하나요?",
    a: "독서는 양보다 질이 중요해요. 나에게 와닿은 책 속의 문장 하나면 충분해요. 완독하지 않아도 대화에 충분히 참여할 수 있어요.",
  },
  {
    q: "인터뷰는 왜 하나요?",
    a: "레이지데이 북클럽은 결이 맞는 사람들이 모이는 게 중요해요. 인터뷰는 심사가 아니에요. 함께할 분인지 서로 확인하는 대화예요. 15분의 전화 인터뷰로, 만나기 전 서로를 알아가요.",
  },
  {
    q: "게더링은 뭔가요?",
    a: "모임 밖에서 더 많은 인연들을 자연스럽게 만나는 시간이에요.",
  },
  {
    q: "모임은 어디에서 진행하나요?",
    a: "모든 모임은 링키라운지(사당역 10번출구 4분 거리)에서 진행합니다.",
  },
]

export function FaqSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>

      <div className={styles.list}>
        {faqs.map((faq) => (
          <div key={faq.q} className={styles.item}>
            <p className={styles.question}>{faq.q}</p>
            <p className={styles.answer}>{faq.a}</p>
          </div>
        ))}
      </div>

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
    </section>
  )
}
