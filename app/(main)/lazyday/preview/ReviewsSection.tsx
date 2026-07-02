import styles from "../FaqSection.module.css"
import pstyles from "./preview.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 후기 섹션 — 손글씨 후기 '사진'을 폴라로이드 스트립으로.
 * 개수가 적어도 성립하는 구성: 사진 2~3장 + 대표 인용 1개.
 * 사진 자리는 실물 촬영본으로 교체하면 됨.
 */
const photoCards = [
  { caption: "1기 멤버 J님의 노트" },
  { caption: "2기 멤버 H님의 노트" },
  { caption: "2기 마지막 모임에서" },
]

export function ReviewsSection() {
  return (
    <section id="reviews" className={pstyles.reviewsSection}>
      <div className={pstyles.reviewsInner}>
        <FadeUp>
          <div className={styles.titleRow}>
            <h2 className={styles.sectionTitle}>멤버들이 남긴 문장</h2>
          </div>
          <p className={pstyles.reviewsLead}>
            시즌이 끝나는 날, 멤버들이 손으로 눌러 적어준 이야기들이에요.
          </p>
        </FadeUp>

        <FadeUp>
          <div className={pstyles.reviewStrip}>
            {photoCards.map((c) => (
              <figure key={c.caption} className={pstyles.reviewCard} style={{ margin: 0 }}>
                <div className={pstyles.reviewPhoto}>
                  <span>📷</span>
                  <span>손글씨 후기 사진 자리<br />(실물 촬영본으로 교체)</span>
                </div>
                <figcaption className={pstyles.reviewCaption}>{c.caption}</figcaption>
              </figure>
            ))}
          </div>
        </FadeUp>

        <FadeUp>
          <blockquote className={pstyles.reviewQuote}>
            "혼자 읽었다면 밑줄만 긋고 지나쳤을 문장 앞에서,
            처음 보는 사람들과 한 시간을 머물렀어요.
            그 한 시간이 이번 계절에서 제일 느리고 제일 남는 시간이었습니다."
            <span className={pstyles.reviewQuoteBy}>— 1기 멤버 후기 중 (예시 문구, 실제 후기로 교체)</span>
          </blockquote>
        </FadeUp>
      </div>
    </section>
  )
}
