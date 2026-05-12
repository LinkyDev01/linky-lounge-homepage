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
  accordion?: boolean
}

const faqs: Faq[] = [
  {
    q: "인터뷰는 왜 하나요?",
    accordion: true,
    a: (
      <>
        서로의 결을 가늠하는 자리예요. 두 가지 방식 중 편한 걸 선택할 수 있어요.
        <br /><br />
        <strong className={styles.answerStrong}>전화 인터뷰</strong> — 진행자와 나누는 약 20분의 전화 대화예요. 모임의 분위기와 결을 미리 느껴볼 수 있고, 궁금한 점도 바로 물어볼 수 있어요.
        <br /><br />
        <strong className={styles.answerStrong}>서면 인터뷰</strong> — 시간에 구애받지 않고 6가지 질문에 자유롭게 답하는 방식이에요. 나만의 속도로 생각을 정리하며 작성할 수 있어요.
      </>
    ),
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
          