import styles from "./FaqSection.module.css"

const faqs: { q: string; a: string; sub?: string }[] = [
  {
    q: "인터뷰는 왜 하나요?",
    a: "20분 정도의 통화로 서로의 결을 가늠할 수 있는 자리입니다. 평소의 생각을 부담 없이 꺼내주세요.",
  },
  {
    q: "책을 다 읽고 와야 하나요?",
    a: "무조건적인 완독보다는 책 속의 문장을 고민하는 시간이 더 중요합니다. 완독은 좋지만, 그것보다는 '책 속의 문장으로 나의 생각이 확장될 수 있는가?'에 초점을 맞추어 독서하는 것을 권장하고 있습니다.",
  },
  {
    q: "정기모임 외 함께하는 시간이 있나요?",
    a: "정기적으로 레이지데이 멤버들과 함께 네트워킹을 하는 시간입니다. 같은 시간에 참여하지 못했던 멤버들과 함께 모여 새로운 인연을 쌓아갈 수 있습니다.",
  },
  {
    q: "모임은 어디에서 진행하나요?",
    a: "모든 모임은 링키라운지(사당역 10번 출구 4분 거리)에서 진행합니다.",
    sub: "*상황에 따라 장소가 변경될 수 있습니다",
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
            {faq.sub && <p className={styles.answerNote}>{faq.sub}</p>}
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
