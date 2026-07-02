"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import styles from "../FaqSection.module.css"
import pstyles from "./preview.module.css"
import { PREVIEW } from "./preview-config"
import { FadeUp } from "@/components/animation/FadeUp"

type Faq = {
  key: string
  q: ReactNode
  /** 항상 노출되는 핵심 답 (1~2문장) */
  summary: ReactNode
  /** 펼쳤을 때 보이는 상세 */
  detail?: ReactNode
  sub?: string
}

/**
 * 개선안 FAQ: 질문 + 핵심 답 한 줄은 항상 노출, 상세만 접기.
 * + 참가비 금액 명시, '신청하면 어떻게 진행되나요?' 항목 추가.
 */
const faqs: Faq[] = [
  {
    key: "process",
    q: <><strong className={styles.questionStrong}>신청하면</strong> 어떻게 진행되나요?</>,
    summary: <>신청서 작성 → 인터뷰(전화 20분 또는 서면 6문항) → 합류 확정 연락 → 참가비 결제, 네 단계로 진행돼요.</>,
    detail: (
      <>
        신청 시점에는 결제하지 않아요. 인터뷰에서 서로의 결을 확인한 뒤, 합류가 확정되면 결제를 안내드립니다. 보통 신청부터 확정까지 일주일 안에 마무리돼요.
      </>
    ),
  },
  {
    key: "interview",
    q: <><strong className={styles.questionStrong}>인터뷰</strong>는 왜 하나요?</>,
    summary: <>서로의 결을 가늠하는 자리예요. 전화(약 20분)와 서면(6가지 질문) 중 편한 방식을 선택할 수 있어요.</>,
    detail: (
      <>
        <strong className={styles.answerStrong}>전화 인터뷰</strong> — 모임 분위기를 미리 느끼며 궁금한 점도 바로 물어볼 수 있어요.
        <br /><br />
        <strong className={styles.answerStrong}>서면 인터뷰</strong> — 시간에 구애받지 않고 나만의 속도로 답할 수 있어요.
      </>
    ),
  },
  {
    key: "price",
    q: <><strong className={styles.questionStrong}>참가비</strong>는 얼마이고, 어떤 것들이 포함되나요?</>,
    summary: <>3기 참가비는 <strong className={styles.answerStrong}>{PREVIEW.priceNow}</strong>(정가 {PREVIEW.priceWas} · 3기 한정)이에요. 5회 모임 전체와 공간·다과가 포함됩니다.</>,
    detail: (
      <>
        <strong className={styles.answerStrong}>공간 운영</strong>, <strong className={styles.answerStrong}>모임 기획과 진행</strong>, <strong className={styles.answerStrong}>다과</strong>, <strong className={styles.answerStrong}>커뮤니티 운영</strong>이 포함됩니다. 직접 관리하는 약 30평 규모의 공간에서 진행하고, 인터뷰부터 모임 당일 진행까지 모든 과정을 레이지데이가 함께합니다.
      </>
    ),
  },
  {
    key: "book-select",
    q: "책은 어떤 기준으로 고르나요?",
    summary: <><strong className={styles.answerStrong}>철학서</strong>와 <strong className={styles.answerStrong}>고전 소설</strong>을 함께 읽는 구조로 구성해요.</>,
    detail: (
      <>
        철학자들의 시선과 이론을 바탕으로 생각의 도구를 먼저 갖추고, 고전 소설 속 저자의 의도를 들여다보며 나의 이야기와 시선을 깊이 들여다볼 수 있도록요. 같은 부분을 읽더라도 더 밀도 있는 대화를 나눌 수 있는 이유입니다.
      </>
    ),
  },
  {
    key: "book-read",
    q: "책을 다 읽고 와야 하나요?",
    summary: <>완독보다 <strong className={styles.answerStrong}>책 속의 문장을 고민하는 시간</strong>이 더 중요해요. '이 문장으로 내 생각이 확장될 수 있는가'에 초점을 맞춰 읽어오시면 충분합니다.</>,
  },
  {
    key: "location",
    q: "모임은 어디에서 진행하나요?",
    summary: <>모든 모임은 <strong className={styles.answerStrong}>링키라운지</strong>(사당역 10번 출구 4분 거리)에서 진행합니다.</>,
    sub: "*상황에 따라 장소가 변경될 수 있습니다",
  },
  {
    key: "gathering",
    q: <><strong className={styles.questionStrong}>자유 독서모임</strong>(5회차)에선 어떤 시간이 마련되나요?</>,
    summary: <>1부 영화 감상(14:30–17:00), 2부 자유 독서모임(17:00–)으로 모든 멤버가 처음으로 한자리에 모여요.</>,
    detail: (
      <>
        <strong className={styles.answerStrong}>1부</strong>&nbsp;철학과 예술이 맞닿아 있는 영화 한 편을 함께 감상하며, 4회차까지의 사유를 영상의 언어로 확장합니다.<br /><br />
        <strong className={styles.answerStrong}>2부</strong>&nbsp;다른 시간대의 멤버들과 처음 만나, 네 권의 책에서 꺼내지 못했던 이야기를 자유롭게 나눕니다.<br /><br />
        *5회차 구성은 기수마다 조금씩 달라질 수 있어요.
      </>
    ),
  },
]

export function FaqSectionV2() {
  const [openSet, setOpenSet] = useState<Set<string>>(new Set())

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
          const hasDetail = Boolean(faq.detail)
          return (
            <div key={faq.key} className={styles.item}>
              <button
                className={styles.titleBox}
                onClick={() => hasDetail && toggle(faq.key)}
                aria-expanded={hasDetail ? isOpen : undefined}
              >
                <span className={styles.question}>{faq.q}</span>
                {hasDetail && (
                  <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}>▾</span>
                )}
              </button>
              <div className={styles.quote}>
                <p className={pstyles.cardSummary}>{faq.summary}</p>
                {isOpen && faq.detail && <p className={styles.answer}>{faq.detail}</p>}
                {faq.sub && <p className={styles.answerNote}>{faq.sub}</p>}
                {hasDetail && (
                  <button
                    type="button"
                    className={pstyles.cardDetailToggle}
                    onClick={() => toggle(faq.key)}
                  >
                    {isOpen ? "접기" : "자세히 보기"}
                  </button>
                )}
              </div>
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
