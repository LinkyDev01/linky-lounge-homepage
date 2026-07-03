"use client"

import { useLayoutEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import styles from "../FaqSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * FAQ 제안 — 모임 소개(FeatureBoxSectionV2)와 동일한 상호작용 실험.
 * 기존(고정 54px 접힘) 대신, 답변의 핵심 문장(lead)은 항상 노출하고
 * 나머지(rest)만 접어서 페이드로 '더 있다'는 신호를 준다.
 * 이미 한 줄로 짧은 항목(noPeek: true)은 그대로 둔다.
 * — 실사이트 미반영, 프리뷰 전용 제안.
 */
type Faq = {
  id?: string
  key: string
  q: ReactNode
  /** 접혀 있어도 항상 보이는 핵심 답변 (1~2문장) */
  lead: ReactNode
  /** '더보기'를 눌러야 보이는 나머지 답변 */
  rest?: ReactNode[]
  sub?: string
  noPeek?: boolean
}

const faqs: Faq[] = [
  {
    key: "interview",
    q: <><strong className={styles.questionStrong}>인터뷰</strong>는 왜 하나요?</>,
    lead: "서로의 결을 가늠하는 자리예요. 두 가지 방식 중 편한 걸 선택할 수 있어요.",
    rest: [
      <><strong className={styles.answerStrong}>전화 인터뷰</strong> — 약 20분, 모임 분위기를 미리 느끼며 궁금한 점도 바로 물어볼 수 있어요.</>,
      <><strong className={styles.answerStrong}>서면 인터뷰</strong> — 6가지 질문에 편한 시간에 자유롭게 답하는 방식이에요.</>,
    ],
  },
  {
    key: "price",
    q: <><strong className={styles.questionStrong}>참가비</strong>에는 어떤 것들이 포함되어 있나요?</>,
    lead: (
      <><strong className={styles.answerStrong}>공간 운영</strong>, <strong className={styles.answerStrong}>모임 기획과 진행</strong>, <strong className={styles.answerStrong}>다과</strong>, <strong className={styles.answerStrong}>커뮤니티 운영</strong>이 포함됩니다.</>
    ),
    rest: [
      "직접 관리하는 약 30평 규모의 공간에서 진행하고, 일관된 모임 경험을 위하여 인터뷰부터 모임 당일 진행까지 모든 과정을 레이지데이가 함께하고 있습니다.",
    ],
  },
  {
    key: "book-select",
    q: "책은 어떤 기준으로 고르나요?",
    lead: <><strong className={styles.answerStrong}>철학서</strong>와 <strong className={styles.answerStrong}>고전 소설</strong>을 함께 읽는 구조로 구성해요.</>,
    rest: [
      "철학자들의 시선과 이론을 바탕으로 생각의 도구를 먼저 갖추고, 고전 소설 속 저자의 의도를 들여다보며 나의 이야기와 시선을 깊이 들여다볼 수 있도록요. 같은 부분을 읽더라도 더 밀도 있는 대화를 나눌 수 있는 이유입니다.",
    ],
  },
  {
    key: "book-read",
    noPeek: true,
    q: "책을 다 읽고 와야 하나요?",
    lead: (
      <>완독 자체보다는 <strong className={styles.answerStrong}>책 속의 문장을 고민하는 시간</strong>이 더 중요합니다. &lsquo;책 속의 문장으로 나의 생각이 확장될 수 있는가?&rsquo;에 초점을 맞추어 읽어오시면 충분합니다.</>
    ),
  },
  {
    key: "location",
    q: "모임은 어디에서 진행하나요?",
    noPeek: true,
    lead: <>모든 모임은 <strong className={styles.answerStrong}>링키라운지</strong>(사당역 10번 출구 4분 거리)에서 진행합니다.</>,
    sub: "*상황에 따라 장소가 변경될 수 있습니다",
  },
  {
    id: "gathering",
    key: "gathering",
    q: <><strong className={styles.questionStrong}>자유 독서모임</strong>에선 어떤 시간이 마련되나요?</>,
    lead: (
      <><strong className={styles.answerStrong}>1부</strong>&nbsp;영화 감상&nbsp;&nbsp;14:30–17:00 — 시각과 청각의 언어로 펼쳐지는 한 편의 영화를 함께 감상합니다.</>
    ),
    rest: [
      "철학과 예술이 맞닿아 있는 작품을 고르고, 4회차의 사유를 영상의 언어로 더 깊이 확장해가는 시간입니다.",
      <><strong className={styles.answerStrong}>2부</strong>&nbsp;자유 독서모임&nbsp;&nbsp;17:00– — 다른 시간대에 만나지 못한 멤버들과 처음으로 한자리에 모여, 네 권의 책에서는 꺼내지 못했던 이야기를 자유롭게 나눕니다.</>,
    ],
  },
]

// 접힘 상태에서 lead 아래로 보여줄 rest 첫 줄의 슬리버 높이(px).
const PEEK_SLIVER = 30

export function FaqSectionV2() {
  const [openSet, setOpenSet] = useState<Set<string>>(new Set())
  const leadRefs = useRef<Record<string, HTMLParagraphElement | null>>({})
  const [peekHeights, setPeekHeights] = useState<Record<string, number>>({})

  useLayoutEffect(() => {
    const measure = () => {
      const next: Record<string, number> = {}
      for (const key in leadRefs.current) {
        const el = leadRefs.current[key]
        if (el) next[key] = el.offsetHeight + PEEK_SLIVER
      }
      setPeekHeights(next)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  const toggle = (key: string) => {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <section id="faq" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
        </div>
      </FadeUp>

      <div className={styles.list}>
        {faqs.map((faq) => {
          const isOpen = openSet.has(faq.key)
          return (
            <div key={faq.key} id={faq.id} className={styles.item}>
              <button
                className={styles.titleBox}
                onClick={() => toggle(faq.key)}
                aria-expanded={isOpen}
              >
                <span className={styles.question}>{faq.q}</span>
                {!faq.noPeek && (
                  <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}>▾</span>
                )}
              </button>
              {faq.noPeek ? (
                <div className={styles.quote}>
                  <p className={styles.answer}>{faq.lead}</p>
                  {faq.sub && <p className={styles.answerNote}>{faq.sub}</p>}
                </div>
              ) : (
                <div
                  className={styles.quote}
                  onClick={() => toggle(faq.key)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onKeyDown={e => e.key === "Enter" && toggle(faq.key)}
                  style={{ cursor: isOpen ? "default" : "pointer" }}
                >
                  <div
                    className={`${styles.peekWrap} ${isOpen ? styles.peekOpen : ""}`}
                    style={!isOpen && peekHeights[faq.key] ? { maxHeight: peekHeights[faq.key] } : undefined}
                  >
                    <p
                      className={styles.answer}
                      ref={el => { leadRefs.current[faq.key] = el }}
                    >
                      {faq.lead}
                    </p>
                    {faq.rest?.map((p, j) => (
                      <p key={j} className={styles.answer} style={{ marginTop: 10 }}>{p}</p>
                    ))}
                    {!isOpen && (
                      <div className={styles.fadeWrap}>
                        <div className={styles.fadeBg} />
                      </div>
                    )}
                  </div>
                  {!isOpen && <span className={styles.moreHint}>...더보기</span>}
                  {faq.sub && isOpen && <p className={styles.answerNote}>{faq.sub}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <FadeUp>
        <div className={styles.contact}>
          <p className={styles.contactText}>다른 질문이 있어요</p>
          <a
            href="https://www.instagram.com/lazyday_bookclub"
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
