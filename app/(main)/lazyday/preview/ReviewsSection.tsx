"use client"

import { useEffect, useRef, useState } from "react"
import styles from "../FaqSection.module.css"
import pstyles from "./preview.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 후기 섹션 — 손글씨 후기 '사진' 폴라로이드 카드.
 * 슬라이딩 방식은 책 소개와 동일(가운데 스냅 + 양옆 축소·흐림 + 화살표·점),
 * 박스 레이아웃(폴라로이드 프레임 + 캡션)은 기존 그대로 유지.
 * 사진 자리는 실물 촬영본으로 교체하면 됨.
 */
const photoCards = [
  { caption: "1기 멤버 J님의 노트" },
  { caption: "2기 멤버 H님의 노트" },
  { caption: "2기 마지막 모임에서" },
]

export function ReviewsSection() {
  const [idx, setIdx] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  // 스크롤 위치 → 활성 카드 동기화 (책 소개와 동일 로직)
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const cards = Array.from(track.children) as HTMLElement[]
        if (!cards.length) return
        const center = track.scrollLeft + track.clientWidth / 2
        let best = 0
        let bestDist = Infinity
        cards.forEach((c, i) => {
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center)
          if (d < bestDist) { bestDist = d; best = i }
        })
        setIdx(best)
      })
    }
    track.addEventListener("scroll", onScroll, { passive: true })
    return () => { track.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf) }
  }, [])

  function scrollToCard(i: number) {
    const track = trackRef.current
    if (!track) return
    const card = track.children[i] as HTMLElement | undefined
    if (!card) return
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
      behavior: "smooth",
    })
  }

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

        <div className={pstyles.bookCarousel}>
          <button
            type="button"
            className={`${pstyles.bookChevron} ${pstyles.bookChevronLeft}`}
            style={{ top: "44%" }}
            onClick={() => scrollToCard(idx - 1)}
            disabled={idx === 0}
            aria-label="이전 후기"
          >
            ‹
          </button>
          <button
            type="button"
            className={`${pstyles.bookChevron} ${pstyles.bookChevronRight}`}
            style={{ top: "44%" }}
            onClick={() => scrollToCard(idx + 1)}
            disabled={idx === photoCards.length - 1}
            aria-label="다음 후기"
          >
            ›
          </button>

          <div className={pstyles.reviewTrack} ref={trackRef}>
            {photoCards.map((c, i) => (
              <div
                key={c.caption}
                className={`${pstyles.reviewSlide} ${i === idx ? pstyles.reviewSlideActive : ""}`}
                onClick={() => i !== idx && scrollToCard(i)}
              >
                <figure className={pstyles.reviewCard} style={{ margin: 0 }}>
                  <div className={pstyles.reviewPhoto}>
                    <span>📷</span>
                    <span>손글씨 후기 사진 자리<br />(실물 촬영본으로 교체)</span>
                  </div>
                  <figcaption className={pstyles.reviewCaption}>{c.caption}</figcaption>
                </figure>
              </div>
            ))}
          </div>

          <div className={pstyles.bookDots}>
            {photoCards.map((c, i) => (
              <button
                key={`dot-${c.caption}`}
                className={`${pstyles.bookDot} ${i === idx ? pstyles.bookDotActive : ""}`}
                onClick={() => scrollToCard(i)}
                aria-label={`${i + 1}번째 후기로 이동`}
              />
            ))}
          </div>
        </div>

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
