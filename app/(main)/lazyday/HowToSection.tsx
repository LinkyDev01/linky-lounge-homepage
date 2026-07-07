import styles from "./HowToSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 진행 순서 — 콰이어트 리스트 (운영자 확정 2026-07-06)
 * 원본: preview/HowToSectionV2.tsx (프리뷰 승인본을 픽셀 동일 이식).
 * 큰 주황 stepNumber 대신 라벨형 번호(11px, 자간 0.22em) + 본문 종이책 조판.
 * 프리뷰 쌍(HowToSectionV2)과 드리프트 금지 — 한쪽 수정 시 함께.
 */

const steps: {
  label: string
  description: string
}[] = [
  {
    label: "1부 — 레이지노트 펼치기",
    description:
      "레이지데이가 준비한 질문을 통해 대화의 문을 엽니다. 생각이 확장되고, 마찰하고, 펼쳐질 수 있는 질문 하나를 위해 오래 공을 들입니다.",
  },
  {
    label: "2부 — 서로의 페이지",
    description:
      "멤버들이 각자 가져온 문장이나 궁금증을 중심으로 대화를 이어갑니다. 책에서 시작된 이야기가 저마다의 관점과 생각으로 번져가는 시간입니다.",
  },
  {
    label: "마무리",
    description:
      "오늘의 대화에서 우리의 생각을 조금 더 넓혀준 한 가지를 마음에 남기며 모임을 마무리합니다. 다음 모임에서 다룰 도서에 대한 짧은 예고도 함께 전해드립니다.",
  },
]

export function HowToSection() {
  return (
    <section id="howto" className={styles.section}>
      <FadeUp y={12} duration={0.9}>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>진행 순서</h2>
          <p className={styles.meta}>총 3시간 진행</p>
        </div>
      </FadeUp>

      <div className={styles.timeline}>
        {steps.map(({ label, description }, i) => (
          <div key={label} className={styles.step}>
            <span className={styles.stepNum}>{String(i + 1).padStart(2, "0")}</span>
            <h3 className={styles.stepLabel}>{label}</h3>
            <p className={styles.stepDesc}>{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
