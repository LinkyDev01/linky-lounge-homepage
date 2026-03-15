import styles from "./FaqSection.module.css"

const faqs = [
  {
    q: "책을 많이 읽어야 하나요?",
    a: "아니요. 책 속의 문장 하나면 충분해요. 완독하지 않아도 대화에 충분히 참여할 수 있어요. 다만 조금이라도 읽고 오시는 걸 권장해요.",
  },
  {
    q: "혼자 와도 되나요?",
    a: "네, 대부분 혼자 오세요. 아는 사람과 같이 오면 오히려 새로운 대화가 어려울 수 있어요.",
  },
  {
    q: "인터뷰는 왜 하나요?",
    a: "결이 맞는 사람을 먼저 확인하기 위해서예요. 인터뷰는 심사가 아니에요. 함께할 분인지 서로 확인하는 대화예요. 15분, 전화로 편하게 이야기해요.",
  },
  {
    q: "중간에 빠지면 어떻게 되나요?",
    a: "4회 중 1회는 부득이하게 빠질 수 있어요. 다만 2회 이상 결석은 다른 멤버들의 모임 경험에 영향을 줄 수 있어요. 일정 확인 후 신청해주세요.",
  },
  {
    q: "환불이 되나요?",
    a: "모임 시작 7일 전까지는 전액 환불 가능해요. 모임 시작 후에는 환불이 어렵습니다.",
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
          href="https://www.instagram.com/linkylounge"
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
