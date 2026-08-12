import styles from "./HowToSectionV2.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 진행 순서 — 콰이어트 리스트 (운영자 지시 2026-07-06)
 * 원본(HowToSection)의 좌정렬 스텝 구조는 유지, 다음만 개편:
 *  · 큰 주황 stepNumber(40px) → 작은 라벨형 번호(11px, 자간 0.22em, #a08b70)를
 *    라벨 위로 이동
 *  · 본문을 종이책 조판(명조 13px/1.9, 양쪽 정렬 + 음절 단위 줄바꿈)으로
 *  · 스텝 구분선을 주황 tint에서 무채 헤어라인으로
 *  · 메타 "총 3시간 진행"의 주황 강조 제거
 * 실사이트(HowToSection)는 V2 없이 프리뷰가 직접 import하는 구조라 원본
 * 파일은 수정하지 않는다 — 이 파일이 프리뷰 전용 신설 컴포넌트.
 */

const steps: {
  label: string
  description: string
}[] = [
  {
    label: "자기소개, 오프닝, 질문 1~3",
    description: "레이지데이가 제시하는 주제를 바탕으로 대화를 시작합니다.",
  },
  {
    label: "서로의 페이지",
    description:
      "각자 가져온 문장이나 질문을 중심으로 대화를 이어갑니다. 텍스트에서 시작된 이야기가 삶과 맞닿는 시간입니다.",
  },
  {
    label: "마무리",
    description:
      "오늘 대화 중 사유를 넓혀준 이야기를 나누며 마무리합니다. 다음 모임에서 다룰 도서도 함께 안내해 드립니다.",
  },
]

export function HowToSectionV2() {
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
