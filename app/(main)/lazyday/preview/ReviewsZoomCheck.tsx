"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import styles from "../FaqSection.module.css"
import rstyles from "../ReviewsSection.module.css"
import zstyles from "./ReviewsZoomCheck.module.css"
import { useZoomGesture } from "./useZoomGesture"

/**
 * 후기 모달 확대 — 핀치 줌 프로토타입 검수대 (2026-08-19).
 * 운영자: "인스타그램에서 모바일 줌인 줌아웃 하는 그런 자연스러운 줌인/줌아웃"
 *
 * 실사이트 ReviewsSection.tsx 를 베이스로 카드 캐러셀은 그대로 두고,
 * 모달의 확대 로직만 useZoomGesture(연속 핀치·팬·더블탭·스프링 정리)로 교체했다.
 * 승인되면 lazyday-preview-migrate 절차로 실사이트에 이식한다 — 그때까지는
 * ReviewsSection.module.css(rstyles)에 클래스를 **추가만** 하고 기존 클래스는
 * 손대지 않았다(§5, 소비자 1곳뿐이라 안전하지만 이식 전까지는 실물 미반영이 원칙).
 */
type ReviewCard = { id: string; photo: string; photoCard: string; caption: string }

const photoCards: ReviewCard[] = [
  { id: "r1", photo: "/linky-lounge/book-club/reviews/review-01.webp", photoCard: "/linky-lounge/book-club/reviews/review-01-card.webp", caption: "2026. 7. 15의 기록" },
  { id: "r2", photo: "/linky-lounge/book-club/reviews/review-02.webp", photoCard: "/linky-lounge/book-club/reviews/review-02-card.webp", caption: "2026. 7. 12의 기록" },
  { id: "r3", photo: "/linky-lounge/book-club/reviews/review-03.webp", photoCard: "/linky-lounge/book-club/reviews/review-03-card.webp", caption: "2026. 7. 12의 기록" },
  { id: "r4", photo: "/linky-lounge/book-club/reviews/review-04.webp", photoCard: "/linky-lounge/book-club/reviews/review-04-card.webp", caption: "2026. 7. 12의 기록" },
  { id: "r5", photo: "/linky-lounge/book-club/reviews/review-05.webp", photoCard: "/linky-lounge/book-club/reviews/review-05-card.webp", caption: "2026. 8. 9의 기록" },
  { id: "r6", photo: "/linky-lounge/book-club/reviews/review-06.webp", photoCard: "/linky-lounge/book-club/reviews/review-06-card.webp", caption: "2026. 8. 9의 기록" },
]

const SWIPE_PX = 45

export function ReviewsZoomCheck() {
  const [idx, setIdx] = useState(0)
  const [modalIdx, setModalIdx] = useState<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  // 축소 상태 스와이프 판정용 — 확대 판정은 useZoomGesture 가 전담
  const swipeRef = useRef<{ x: number; y: number } | null>(null)

  const zoom = useZoomGesture()

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
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: "smooth" })
  }

  function closeModal() {
    setModalIdx(null)
    zoom.reset()
  }

  function slideModal(dir: number) {
    setModalIdx((m) => {
      if (m === null) return m
      const next = Math.min(photoCards.length - 1, Math.max(0, m + dir))
      if (next !== m) zoom.reset()
      return next
    })
  }

  useEffect(() => {
    if (modalIdx === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal()
      else if (e.key === "ArrowRight") slideModal(1)
      else if (e.key === "ArrowLeft") slideModal(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalIdx])

  // 트랙패드 핀치(wheel+ctrlKey) — React 의 합성 onWheel 은 루트에서 passive 로 붙어
  // preventDefault 가 씹힐 수 있어, 네이티브 리스너로 직접 non-passive 등록한다.
  useEffect(() => {
    const el = stageRef.current
    if (!el || modalIdx === null) return
    const handler = (e: WheelEvent) => zoom.onWheel(e as unknown as React.WheelEvent)
    el.addEventListener("wheel", handler, { passive: false })
    return () => el.removeEventListener("wheel", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalIdx])

  function onStagePointerDown(e: React.PointerEvent) {
    swipeRef.current = { x: e.clientX, y: e.clientY }
    zoom.onPointerDown(e)
  }
  function onStagePointerMove(e: React.PointerEvent) {
    zoom.onPointerMove(e)
  }
  function onStagePointerUp(e: React.PointerEvent) {
    const result = zoom.onPointerUp(e, { pointerType: e.pointerType })
    if (result.consumed) {
      swipeRef.current = null
      return
    }
    // 확대 엔진이 넘긴 것 — 기존 축소 상태 스와이프/이웃카드 판정 (실사이트 로직과 동일)
    const start = swipeRef.current
    swipeRef.current = null
    if (!start) return
    const dx = e.clientX - start.x
    if (Math.abs(dx) >= SWIPE_PX) {
      slideModal(dx < 0 ? 1 : -1)
      return
    }
    if (!result.tap) return
    const hit = (e.target as HTMLElement).closest("[data-slide-idx]") as HTMLElement | null
    const hitIdx = hit ? Number(hit.dataset.slideIdx) : NaN
    if (!Number.isNaN(hitIdx) && hitIdx !== modalIdx) {
      setModalIdx(hitIdx)
    }
  }
  function onStagePointerCancel(e: React.PointerEvent) {
    swipeRef.current = null
    zoom.onPointerCancel(e)
  }

  const modal = modalIdx !== null ? photoCards[modalIdx] : null

  return (
    <section id="reviews" className={rstyles.reviewsSection}>
      <div className={rstyles.reviewsInner}>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>멤버들이 남긴 문장</h2>
        </div>
        <p className={rstyles.reviewsLead}>핀치 줌 프로토타입 — 사진을 눌러 모달을 열어보세요.</p>

        <div className={rstyles.bookCarousel}>
          <button type="button" className={`${rstyles.bookChevron} ${rstyles.bookChevronLeft}`} style={{ top: "42%" }} onClick={() => scrollToCard(idx - 1)} disabled={idx === 0} aria-label="이전 후기">‹</button>
          <button type="button" className={`${rstyles.bookChevron} ${rstyles.bookChevronRight}`} style={{ top: "42%" }} onClick={() => scrollToCard(idx + 1)} disabled={idx === photoCards.length - 1} aria-label="다음 후기">›</button>

          <div className={rstyles.reviewTrack} ref={trackRef}>
            {photoCards.map((c, i) => (
              <div key={c.id} className={`${rstyles.reviewSlide} ${i === idx ? rstyles.reviewSlideActive : ""}`} onClick={() => i !== idx && scrollToCard(i)}>
                <figure className={rstyles.reviewCard} style={{ margin: 0 }}>
                  <div
                    className={`${rstyles.reviewPhoto} ${rstyles.reviewPhotoFilled}`}
                    onClick={() => i === idx && setModalIdx(i)}
                    role="button"
                    aria-label={`${c.caption} 크게 보기`}
                  >
                    <Image src={c.photoCard} alt={c.caption} fill sizes="(max-width: 600px) 92vw, 560px" quality={85} draggable={false} />
                  </div>
                  <figcaption className={rstyles.reviewCaption}>{c.caption}</figcaption>
                </figure>
              </div>
            ))}
          </div>

          <div className={rstyles.bookDots}>
            {photoCards.map((c, i) => (
              <button key={`dot-${c.id}`} className={`${rstyles.bookDot} ${i === idx ? rstyles.bookDotActive : ""}`} onClick={() => scrollToCard(i)} aria-label={`${i + 1}번째 후기로 이동`} />
            ))}
          </div>
        </div>
      </div>

      {modal !== null && modalIdx !== null && (
        <div
          className={`${rstyles.lightbox} ${zstyles.lightboxRoot} ${zoom.zoomed ? zstyles.lightboxZoomed : ""}`}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={`${modal.caption} 확대 보기`}
        >
          <button type="button" className={rstyles.lightboxClose} aria-label="닫기" onClick={(e) => { e.stopPropagation(); closeModal() }}>×</button>

          <div className={`${rstyles.galleryFrame} ${zstyles.galleryFrameZoom}`} onClick={(e) => e.stopPropagation()}>
            <div
              ref={stageRef}
              className={`${rstyles.galleryStage} ${zstyles.zoomStage} ${zoom.zoomed ? zstyles.zoomStageZoomed : ""}`}
              onPointerDown={onStagePointerDown}
              onPointerMove={onStagePointerMove}
              onPointerUp={onStagePointerUp}
              onPointerCancel={onStagePointerCancel}
            >
              {photoCards.map((c, k) => {
                const off = k - modalIdx
                const isCur = k === modalIdx
                return (
                  <div
                    key={`slide-${c.id}`}
                    data-slide-idx={k}
                    className={`${rstyles.gallerySlideM} ${isCur ? rstyles.gallerySlideMActive : ""} ${isCur && zoom.zoomed ? zstyles.activeSlideZoomed : ""}`}
                    ref={isCur ? zoom.frameRef : undefined}
                    style={{
                      transform: `translateX(calc(-50% + ${off} * (var(--slide-w) + 8px)))${isCur ? "" : " scale(0.94)"}`,
                    }}
                    aria-hidden={!isCur}
                  >
                    <div ref={isCur ? zoom.layerRef : undefined} className={zstyles.zoomLayer}>
                      <Image
                        src={c.photo}
                        alt={c.caption}
                        fill
                        sizes="(min-width: 721px) 80vw, 92vw"
                        quality={90}
                        draggable={false}
                        priority={isCur}
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <button type="button" className={`${rstyles.galleryNav} ${rstyles.galleryNavLeft}`} onClick={(e) => { e.stopPropagation(); slideModal(-1) }} disabled={modalIdx === 0} aria-label="이전 후기 사진">‹</button>
            <button type="button" className={`${rstyles.galleryNav} ${rstyles.galleryNavRight}`} onClick={(e) => { e.stopPropagation(); slideModal(1) }} disabled={modalIdx === photoCards.length - 1} aria-label="다음 후기 사진">›</button>

            {/* 데스크톱 전용 +/− — 클릭 확대를 못 찾는 사용자용 안전망 (CSS 로 모바일에서 숨김) */}
            <div className={zstyles.zoomControls} onClick={(e) => e.stopPropagation()}>
              <button type="button" className={zstyles.zoomBtn} onClick={() => zoom.stepZoom(-1)} aria-label="축소">−</button>
              <button type="button" className={zstyles.zoomBtn} onClick={() => zoom.stepZoom(1)} aria-label="확대">+</button>
            </div>
          </div>

          <div className={rstyles.lightboxCaption}>
            <span>{modal.caption}</span>
            <span className={rstyles.lightboxCounter}>{modalIdx + 1} / {photoCards.length}</span>
          </div>
        </div>
      )}
    </section>
  )
}
