"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import styles from "../FaqSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * FAQ — 실사이트 A안(미니멀 라인)의 프리뷰 쌍 (2026-07-07 현행화)
 * 구형 '맛보기(peek)+더보기' 실험을 걷어내고 실 FaqSection과 동일한
 * 미니멀 라인(line*)·문항 데이터로 정렬. 실 FAQ 수정 시 이 쌍도 같은 값으로.
 * (구형 peek*·fade*·moreHint 클래스는 FaqSection.module.css에 보존 — 삭제 금지)
 */

type Faq = {
  id?: string
  key: string
  q: string
  paragraphs: ReactNode[]
  sub?: string
}

const faqs: Faq[] = [
  {
    key: "interview",
    q: "인터뷰는 왜 하나요?",
    paragraphs: [
      <>서로의 결을 가늠하는 자리예요. 두 가지 방식 중 편한 걸 선택할 수 있어요.</>,
      <><strong className={styles.answerStrong}>전화 인터뷰</strong> — 약 20분, 모임 분위기를 미리 느끼며 궁금한 점도 바로 물어볼 수 있어요.</>,
      <><strong className={styles.answerStrong}>서면 인터뷰</strong> — 6가지 질문에 편한 시간에 자유롭게 답하는 방식이에요.</>,
    ],
  },
  {
    key: "price",
    q: "참가비에는 어떤 것들이 포함되어 있나요?",
    paragraphs: [
      <><strong className={styles.answerStrong}>공간 운영</strong>, <strong className={styles.answerStrong}>모임 기획과 진행</strong>, <strong className={styles.answerStrong}>다과</strong>, <strong className={styles.answerStrong}>커뮤니티 운영</strong>이 포함됩니다.</>,
      <>직접 관리하는 약 30평 규모의 공간에서 진행하고, 일관된 모임 경험을 위하여 인터뷰부터 모임 당일 진행까지 모든 과정을 레이지데이가 함께하고 있습니다.</>,
    ],
  },
  {
    key: "book-select",
    q: "책은 어떤 기준으로 고르나요?",
    paragraphs: [
      <><strong className={styles.answerStrong}>철학서</strong>와 <strong className={styles.answerStrong}>고전 소설</strong>을 함께 읽는 구조로 구성해요. 철학자들의 시선과 이론을 바탕으로 생각의 도구를 먼저 갖추고, 고전 소설 속 저자의 의도를 들여다보며 나의 이야기와 시선을 깊이 들여다볼 수 있도록요. 같은 부분을 읽더라도 더 밀도 있는 대화를 나눌 수 있는 이유입니다.</>,
    ],
  },
  {
    key: "location",
    q: "모임은 어디에서 진행하나요?",
    paragraphs: [
      <>모든 모임은 <strong className={styles.answerStrong}>링키라운지</strong>(사당역 10번 출구 4분 거리)에서 진행합니다.</>,
    ],
    sub: "*상황에 따라 장소가 변경될 수 있습니다",
  },
  {
    id: "gathering",
    key: "gathering",
    q: "5회차 자유 독서모임은 어떤 시간인가요?",
    paragraphs: [
      <>4회에 걸쳐 나눈 대화의 마무리이자, 모든 멤버가 처음으로 한자리에 모이는 날입니다.</>,
      <><strong className={styles.answerStrong}>1부</strong>&nbsp;영화 감상&nbsp;&nbsp;14:30–17:00<br />시각과 청각의 언어로 펼쳐지는 한 편의 영화를 함께 감상합니다. 철학과 예술이 맞닿아 있는 작품을 고르고, 4회에 걸쳐 쌓아온 사유를 영상의 언어로 한층 더 확장해가는 시간입니다.</>,
      <><strong className={styles.answerStrong}>2부</strong>&nbsp;자유 독서모임&nbsp;&nbsp;17:00–<br />다른 시간대에 만나지 못한 멤버들과 처음으로 한자리에 모입니다. 네 권의 책에서는 꺼내지 못했던 이야기, 각자가 멤버들에게 묻고 싶었던 이야기를 자유롭게 나누는 자리입니다.</>,
    ],
    sub: "*5회차는 정규 독서모임 4회 이후 추가로 진행되는 모임입니다",
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

  // 해시(#gathering 등)로 진입 시 해당 FAQ 항목을 자동으로 열고 스크롤 —
  // 일정 박스의 '자유 독서모임' 링크가 이 항목을 펼치기 위함 (운영자 지시 2026-07-06)
  useEffect(() => {
    const openByKey = (key: string) => {
      if (!(key && faqs.some(f => f.key === key))) return
      // 시야가 확보된 뒤 펼침 모션이 보이도록: 먼저 스크롤로 데려간 다음 연다
      // (운영자 지시 2026-07-07 — 이동 전에 열리면 도착했을 땐 이미 펼쳐져 모션을 못 본다)
      document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" })
      let done = false
      const open = () => {
        if (done) return
        done = true
        setOpenSet(prev => { const n = new Set(prev); n.add(key); return n })
      }
      // 스크롤이 끝난 직후 펼침 — scrollend 미지원 브라우저/무스크롤 케이스는 타이머 폴백
      window.addEventListener("scrollend", open, { once: true })
      setTimeout(open, 700)
    }
    const openFromHash = () => openByKey(window.location.hash.slice(1))
    // 해시가 이미 같은 상태의 재클릭은 hashchange가 안 뜨므로, 링크가 쏘는 커스텀 이벤트로도 연다
    const openFromEvent = (e: Event) => openByKey((e as CustomEvent<string>).detail)
    openFromHash()
    window.addEventListener("hashchange", openFromHash)
    window.addEventListener("lazyday:open-faq", openFromEvent)
    return () => {
      window.removeEventListener("hashchange", openFromHash)
      window.removeEventListener("lazyday:open-faq", openFromEvent)
    }
  }, [])

  return (
    <section id="faq" className={styles.section}>
      <FadeUp y={12} duration={0.9}>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
        </div>
      </FadeUp>

      <div className={styles.lineList}>
        {faqs.map((faq) => {
          const isOpen = openSet.has(faq.key)
          return (
            <div key={faq.key} id={faq.id} className={styles.lineItem}>
              <button
                className={styles.lineQ}
                onClick={() => toggle(faq.key)}
                aria-expanded={isOpen}
              >
                <span className={styles.lineQText}>{faq.q}</span>
                <span className={`${styles.lineIcon} ${isOpen ? styles.lineIconOpen : ""}`}>+</span>
              </button>
              <div className={`${styles.lineBody} ${isOpen ? styles.lineBodyOpen : ""}`}>
                <div className={styles.lineBodyInner}>
                  <div className={styles.lineAnswer}>
                    {faq.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                  {faq.sub && <p className={styles.lineNote}>{faq.sub}</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

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
    </section>
  )
}
