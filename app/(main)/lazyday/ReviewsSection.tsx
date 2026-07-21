"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import styles from "./FaqSection.module.css"
import rstyles from "./ReviewsSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 후기 섹션 (실사이트) — preview/ReviewsSection.tsx(확정 디자인, DECISIONS 2026-07-04·07-07)를
 * lazyday-preview-migrate 절차로 이식. 스타일은 ReviewsSection.module.css로 분리 복사,
 * titleRow·sectionTitle만 FaqSection.module.css 공유분 유지.
 *
 * 실사이트 추가분(운영자 지시 2026-07-21):
 *  - 실물 손글씨 사진 슬롯(photo) + 클릭 시 부드러운 확대(라이트박스)
 *  - photo 미지정 카드는 승인된 플레이스홀더(괘지+점선) 그대로 렌더
 * 사진 파일: /public/linky-lounge/book-club/reviews/review-01.webp ~ 04 (업로드 대기)
 */
type ReviewCard = {
  id: string
  caption: string
  photo?: string
  quote?: string
  by?: string
}

/* 발췌문(quote)은 실물 서면후기(LazyDay Archive)에서 원문 그대로 전사 —
   운영자 검수 전까지 오독 가능성 있음. photo는 실물 촬영본 도착 시 채움. */
const photoCards: ReviewCard[] = [
  {
    id: "r1",
    photo: "/linky-lounge/book-club/reviews/review-01.webp",
    caption: "2026. 7. 15의 기록",
    quote:
      "\"책을 읽고 나서 누군가와 대화하고 싶었습니다. 그 목마름을 해결해주는 것만으로도 마음이 굉장히 편안해졌던 것 같아요.\"",
    by: "— 2026. 7. 15 서면 후기에서",
  },
  {
    id: "r2",
    photo: "/linky-lounge/book-club/reviews/review-02.webp",
    caption: "2026. 7. 12의 기록",
    quote:
      "\"장소의 인테리어나 BGM이 독서모임의 분위기와 잘 맞고 마음을 편안하게 해주었던 것 같습니다.\"",
    by: "— 2026. 7. 12 서면 후기에서",
  },
  {
    id: "r3",
    photo: "/linky-lounge/book-club/reviews/review-03.webp",
    caption: "2026. 7. 12의 기록",
    quote:
      "\"같은 책을 읽고 다 각자의 생각을 이야기할 수 있는 것도 너무 흥미로웠습니다.\"",
    by: "— 2026. 7. 12 서면 후기에서",
  },
  {
    id: "r4",
    photo: "/linky-lounge/book-club/reviews/review-04.webp",
    caption: "2026. 7. 12의 기록",
    quote:
      "\"『사랑의 기술』을 읽고 평소 어려워했던 철학에 관심이 생겼습니다. 함께라면 더 잘 읽을 수 있을 것 같아요.\"",
    by: "— 2026. 7. 12 서면 후기에서",
  },
]

export function ReviewsSection() {
  const [idx, setIdx] = useState(0)
  const [zoomIdx, setZoomIdx] = useState<number | null>(null)
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

  // 라이트박스 열림 동안 배경 스크롤 잠금 + Esc 닫기
  useEffect(() => {
    if (zoomIdx === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomIdx(null) }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [zoomIdx])

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

  const active = photoCards[Math.min(idx, photoCards.length - 1)]
  const zoomed = zoomIdx !== null ? photoCards[zoomIdx] : null

  return (
    <section id="reviews" className={rstyles.reviewsSection}>
      <div className={rstyles.reviewsInner}>
        <FadeUp y={12} duration={0.9}>
          <div className={styles.titleRow}>
            <h2 className={styles.sectionTitle}>멤버들이 남긴 문장</h2>
          </div>
          <p className={rstyles.reviewsLead}>
            시즌이 끝나는 날, 멤버들이 손으로 눌러 적어준 이야기들이에요.
          </p>
        </FadeUp>

        <div className={rstyles.bookCarousel}>
          <button
            type="button"
            className={`${rstyles.bookChevron} ${rstyles.bookChevronLeft}`}
            style={{ top: "42%" }}
            onClick={() => scrollToCard(idx - 1)}
            disabled={idx === 0}
            aria-label="이전 후기"
          >
            ‹
          </button>
          <button
            type="button"
            className={`${rstyles.bookChevron} ${rstyles.bookChevronRight}`}
            style={{ top: "42%" }}
            onClick={() => scrollToCard(idx + 1)}
            disabled={idx === photoCards.length - 1}
            aria-label="다음 후기"
          >
            ›
          </button>

          <div className={rstyles.reviewTrack} ref={trackRef}>
            {photoCards.map((c, i) => (
              <div
                key={c.id}
                className={`${rstyles.reviewSlide} ${i === idx ? rstyles.reviewSlideActive : ""}`}
                onClick={() => i !== idx && scrollToCard(i)}
              >
                <figure className={rstyles.reviewCard} style={{ margin: 0 }}>
                  {c.photo ? (
                    <div
                      className={`${rstyles.reviewPhoto} ${rstyles.reviewPhotoFilled}`}
                      onClick={() => i === idx && setZoomIdx(i)}
                      role="button"
                      aria-label={`${c.caption} 크게 보기`}
                    >
                      <Image
                        src={c.photo}
                        alt={c.caption}
                        fill
                        sizes="(max-width: 600px) 92vw, 560px"
                        quality={82}
                      />
                    </div>
                  ) : (
                    <div className={rstyles.reviewPhoto}>
                      <span>📷</span>
                      <span>손글씨 후기 사진 자리<br />(reviews 01~04 업로드 대기)</span>
                    </div>
                  )}
                  <figcaption className={rstyles.reviewCaption}>{c.caption}</figcaption>
                </figure>
              </div>
            ))}
          </div>

          <div className={rstyles.bookDots}>
            {photoCards.map((c, i) => (
              <button
                key={`dot-${c.id}`}
                className={`${rstyles.bookDot} ${i === idx ? rstyles.bookDotActive : ""}`}
                onClick={() => scrollToCard(i)}
                aria-label={`${i + 1}번째 후기로 이동`}
              />
            ))}
          </div>
        </div>

        {/* 활성 슬라이드에 맞춰 페이드 전환되는 인용문 — 발췌문이 준비된 카드만 */}
        {active.quote && (
          <blockquote key={idx} className={`${rstyles.reviewQuote} ${rstyles.quoteFade}`}>
            {active.quote}
            {active.by && <span className={rstyles.reviewQuoteBy}>{active.by}</span>}
          </blockquote>
        )}
      </div>

      {/* 사진 확대 라이트박스 */}
      {zoomed?.photo && (
        <div className={rstyles.lightbox} onClick={() => setZoomIdx(null)} role="dialog" aria-modal="true" aria-label={`${zoomed.caption} 확대 보기`}>
          <button type="button" className={rstyles.lightboxClose} aria-label="닫기">×</button>
          <div className={rstyles.lightboxImgWrap} onClick={(e) => e.stopPropagation()}>
            <Image
              src={zoomed.photo}
              alt={zoomed.caption}
              fill
              sizes="92vw"
              quality={90}
              priority
            />
          </div>
          <p className={rstyles.lightboxCaption}>{zoomed.caption}</p>
        </div>
      )}
    </section>
  )
}
