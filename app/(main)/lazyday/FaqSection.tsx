"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
import styles from "./FaqSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

type Faq = {
  id?: string
  q: string
  a: ReactNode
  sub?: string
}

const faqs: Faq[] = [
  {
    q: "인터뷰는 왜 하나요?",
    a: (
      <>
        서로의 결을 가늠하는 자리예요. 두 가지 방식 중 편한 걸 선택할 수 있어요.
        <br /><br />
        <strong className={styles.answerStrong}>전화 인터뷰</strong> — 약 20분, 모임 분위기를 미리 느끼며 궁금한 점도 바로 물어볼 수 있어요.
        <br /><br />
        <strong className={styles.answerStrong}>서면 인터뷰</strong> — 6가지 질문에 편한 시간에 자유롭게 답하는 방식이에요.
      </>
    ),
  },
  {
    q: "참가비에는 어떤 것들이 포함되어 있나요?",
    a: (
      <>
        <strong className={styles.answerStrong}>공간 운영</strong>, <strong className={styles.answerStrong}>모임 기획과 진행</strong>, <strong className={styles.answerStrong}>다과</strong>, <strong className={styles.answerStrong}>커뮤니티 운영</strong>이 포함됩니다. 직접 관리하는 약 30평 규모의 공간에서 진행하고, 일관된 모임 경험을 위하여 인터뷰부터 모임 당일 진행까지 모든 과정을 레이지데이가 함께하고 있습니다.
      </>
    ),
  },
  {
    q: "책은 어떤 기준으로 고르나요?",
    a: (
      <>
        <strong className={styles.answerStrong}>철학서</strong>와 <strong className={styles.answerStrong}>고전 소설</strong>을 함께 읽는 구조로 구성해요. 철학자들의 시선과 이론을 바탕으로 생각의 도구를 먼저 갖추고, 고전 소설 속 저자의 의도를 들여다보며 나의 이야기와 시선을 깊이 들여다볼 수 있도록요. 같은 부분을 읽더라도 더 밀도 있는 대화를 나눌 수 있는 이유입니다.
      </>
    ),
  },
  {
    q: "책을 다 읽고 와야 하나요?",
    a: (
      <>
        완독 자체보다는 <strong className={styles.answerStrong}>책 속의 문장을 고민하는 시간</strong>이 더 중요합니다. '책 속의 문장으로 나의 생각이 확장될 수 있는가?'에 초점을 맞추어 읽어오시면 충분합니다.
      </>
    ),
  },
  {
    q: "모임은 어디에서 진행하나요?",
    a: (
      <>
        모든 모임은 <strong className={styles.answerStrong}>링키라운지</strong>(사당역 10번 출구 4분 거리)에서 진행합니다.
      </>
    ),
    sub: "*상황에 따라 장소가 변경될 수 있습니다",
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
]

export function FaqSection() {
  const [openSet, setOpenSet] = useState<Set<string>>(new Set())

  const toggle = (q: string) => {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(q)) next.delete(q)
      else next.add(q)
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
        {faqs.map((faq, i) => {
          const isOpen = openSet.has(faq.q)
          return (
            <FadeUp key={faq.q} delay={0.1 + i * 0.06}>
              <div id={faq.id} className={styles.item}>
                <button
                  className={styles.titleBox}
                  onClick={() => toggle(faq.q)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.question}>{faq.q}</span>
                  <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>▾</span>
                </button>
                <div className={styles.quote}>
                  <div className={isOpen ? `${styles.peekWrap} ${styles.peekOpen}` : styles.peekWrap}>
                    <p className={styles.answer}>{faq.a}</p>
                    {!isOpen && (
                      <div className={styles.fadeWrap}>
                        <div className={styles.fadeBg} />
                        <span className={styles.moreHint}>...더보기</span>
                      </div>
                    )}
                  </div>
                </div>
                {faq.sub && isOpen && <p className={styles.answerNote}>{faq.sub}</p>}
              </div>
            </FadeUp>
          )
        })}
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

      <FadeUp delay={0.5}>
        <div className={styles.logoWrap}>
          <Image
            src="/linky-lounge/book-club/ldbc-logo-text.png"
            alt="레이지데이 북클럽"
            width={417}
            height={240}
            style={{ objectFit: "contain", opacity: 0.85 }}
          />
        </div>
      </FadeUp>
    </section>
  )
}
