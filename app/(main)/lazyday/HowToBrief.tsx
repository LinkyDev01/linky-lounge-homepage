import styles from "./howto-brief.module.css"

/**
 * 진행 순서 — 모임소개 하단 접이식 요약 (운영자 2026-08-13 시안 A).
 *
 * 원본: HowToSection.tsx (별도 섹션 + 상단 네비 탭). 운영자 판단 —
 * "별도 상단 네비 메뉴까지 있을 정도로 중요해보이진 않아서 모임 소개 하단에
 *  간략히 표현하는 수준이면 족할 것 같아. 웹버전 기준으로는 현재도 너무 섹션
 *  높이가 쓸데없이 정보량에 비해 높아."
 *
 * 유지한 것 (=텍스트 서식):
 *  · 라벨형 번호 11px / 자간 0.22em / #a08b70
 *  · 단계 제목 17px / 700 / #1a1208
 *  · 본문 종이책 조판 — 명조 13px / 행간 1.9 / justify / word-break normal
 *  · 원고 3단계 문안 (임의 수정 금지 — 2026-08-12 운영자 확정본 그대로)
 *
 * 바꾼 것 (=세로 크기):
 *  · 독립 섹션(배경 B, 상하 56/64px) → 모임소개 밴드 안의 블록(배경 상속, 상단 괘선)
 *  · 26px 섹션 제목 → 15px 라벨 + 우측 메타 한 줄
 *  · 데스크톱은 세로 스택 대신 **라벨 좌 / 본문 우** 2단 행 — 같은 정보를 훨씬 낮게.
 *    (3단 그리드는 칼럼이 좁아 13px 명조 justify 에 강이 생겨 탈락)
 */

const steps: { label: string; description: string }[] = [
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

export function HowToBrief() {
  return (
    <div className={styles.brief} id="howto">
      <div className={styles.head}>
        <h3 className={styles.title}>진행 순서</h3>
        <p className={styles.meta}>총 3시간 진행</p>
      </div>

      <ol className={styles.list}>
        {steps.map(({ label, description }, i) => (
          <li key={label} className={styles.step}>
            <div className={styles.stepHead}>
              <span className={styles.stepNum}>{String(i + 1).padStart(2, "0")}</span>
              <h4 className={styles.stepLabel}>{label}</h4>
            </div>
            <p className={styles.stepDesc}>{description}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
