"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import styles from "./FaqSection.module.css"
import rstyles from "./ReviewsSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"
import { useZoomGesture } from "./useZoomGesture"
import { useDragDismiss } from "./useDragDismiss"

/**
 * 후기 섹션 (실사이트) — 폴라로이드 카드 캐러셀(확정 디자인, DECISIONS 2026-07-04·07-07)
 * + 모달 갤러리 (운영자 지시 2026-07-21):
 *  - 카드 사진 클릭 → 모달로 단독 확대. 모달 안에서 좌우 스와이프/‹›/방향키로
 *    다음 후기로 넘김 (확대 상태에서도 갤러리 유지).
 *  - 모바일 기준 설계, PC는 ‹›버튼·방향키·클릭 확대·드래그 팬으로 동일 기능.
 * 카드 하단 흰색 여백은 날짜만 표기 ("--의 기록") · 하단 발췌 인용 블록은 제거 (운영자 지시 2026-07-21 배포분).
 *
 * ⚠ 모달 확대 로직 2026-08-19 전면 교체: 고정 2배 탭 토글 → 핀치 줌(useZoomGesture.ts).
 * 운영자 "인스타그램에서 모바일 줌인 줌아웃 하는 그런 자연스러운 줌인/줌아웃 … 지금은
 * 클릭 기반인데 이런 식으로 하면 사용자들입장에서 불편해". 프리뷰(preview/reviews-zoom-check)
 * 승인 원본을 값 그대로 이식 — 카드 캐러셀·데이터는 무변경.
 */
type ReviewCard = {
  id: string
  caption: string
  /** 모달(확대 보기)용 원본 — 세로 1440px */
  photo?: string
  /**
   * 카드(캐러셀)용 축소본 — 가로 700px. 카드는 최대 322px 로 그려지므로 레티나에서도
   * 충분하고, 원본(1005~1029px)보다 절반 이하다 (운영자 2026-08-17 "카드용 축소본을
   * 따로 두고 모달만 원본"). 없으면 photo 로 폴백한다.
   */
  photoCard?: string
}

const photoCards: ReviewCard[] = [
  // 2026-08-27 추가분 — 운영자 지시로 **맨 앞**(260827-01)과 **맨 뒤**(260827-02)에 나눠 배치.
  // 규격은 종전과 동일(원본 JPG → 모달용 세로 1440px webp q82 + 카드용 가로 700px).
  // ⚠ 순서를 바꿀 땐 레이지클럽 `WorkroomHome.tsx` 의 ARCHIVE_SLIDES 도 같이 —
  //   자동 연동이 아니라 같은 이미지를 쓰는 **수동 사본**이다.
  {
    id: "r7",
    photo: "/linky-lounge/book-club/reviews/review-07.webp",
    photoCard: "/linky-lounge/book-club/reviews/review-07-card.webp",
    caption: "2026. 8. 27의 기록",
  },
  {
    id: "r1",
    photo: "/linky-lounge/book-club/reviews/review-01.webp",
    photoCard: "/linky-lounge/book-club/reviews/review-01-card.webp",
    caption: "2026. 7. 15의 기록",
  },
  {
    id: "r2",
    photo: "/linky-lounge/book-club/reviews/review-02.webp",
    photoCard: "/linky-lounge/book-club/reviews/review-02-card.webp",
    caption: "2026. 7. 12의 기록",
  },
  {
    id: "r3",
    photo: "/linky-lounge/book-club/reviews/review-03.webp",
    photoCard: "/linky-lounge/book-club/reviews/review-03-card.webp",
    caption: "2026. 7. 12의 기록",
  },
  {
    id: "r4",
    photo: "/linky-lounge/book-club/reviews/review-04.webp",
    photoCard: "/linky-lounge/book-club/reviews/review-04-card.webp",
    caption: "2026. 7. 12의 기록",
  },
  // 2026-08-09 추가분 (운영자 제공 원본 JPG → 세로 1440px webp q82, 기존 4장과 같은 규격)
  {
    id: "r5",
    photo: "/linky-lounge/book-club/reviews/review-05.webp",
    photoCard: "/linky-lounge/book-club/reviews/review-05-card.webp",
    caption: "2026. 8. 9의 기록",
  },
  {
    id: "r6",
    photo: "/linky-lounge/book-club/reviews/review-06.webp",
    photoCard: "/linky-lounge/book-club/reviews/review-06-card.webp",
    caption: "2026. 8. 9의 기록",
  },
  {
    id: "r8",
    photo: "/linky-lounge/book-club/reviews/review-08.webp",
    photoCard: "/linky-lounge/book-club/reviews/review-08-card.webp",
    caption: "2026. 8. 27의 기록",
  },
]

const SWIPE_PX = 45

export function ReviewsSection() {
  const [idx, setIdx] = useState(0)
  const [modalIdx, setModalIdx] = useState<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  // 축소 상태 스와이프 판정용 — 확대 판정은 useZoomGesture 가 전담
  const swipeRef = useRef<{ x: number; y: number } | null>(null)

  const zoom = useZoomGesture()
  // 세로 드래그 탈출 — 갇힌 느낌 해소 (운영자 2026-08-24, useDragDismiss 헤더 참조)
  const drag = useDragDismiss(closeModal)

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

  function closeModal() {
    setModalIdx(null)
    zoom.reset()
  }

  function slideModal(dir: number) {
    setModalIdx((m) => {
      if (m === null) return m
      const next = Math.min(photoCards.length - 1, Math.max(0, m + dir))
      if (next !== m) zoom.reset() // 슬라이드 넘김 시 확대 해제
      return next
    })
  }

  // 모달 열림 동안 배경 스크롤 잠금 + Esc 닫기 + 방향키 슬라이드
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

  // ── 모달 갤러리 포인터 인터랙션 — 확대 판정은 useZoomGesture 가 전담하고,
  //    여기는 축소 상태의 스와이프 넘김·이웃 카드 이동·세로 드래그 탈출만 처리한다. ──
  function onStagePointerDown(e: React.PointerEvent) {
    swipeRef.current = { x: e.clientX, y: e.clientY }
    zoom.onPointerDown(e)
    drag.onDown(e)
  }
  function onStagePointerMove(e: React.PointerEvent) {
    zoom.onPointerMove(e)
    // 세로 드래그 탈출 — 비확대 상태에서만 (확대 중 세로 이동은 팬)
    drag.onMove(e, !zoom.zoomed)
  }
  function onStagePointerUp(e: React.PointerEvent) {
    const result = zoom.onPointerUp(e, { pointerType: e.pointerType })
    if (drag.onUp(e).dragged) {
      swipeRef.current = null
      return
    }
    if (result.consumed) {
      swipeRef.current = null
      return
    }
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
    drag.onCancel()
  }

  const modal = modalIdx !== null ? photoCards[modalIdx] : null

  return (
    <section id="reviews" className={rstyles.reviewsSection}>
      <div className={rstyles.reviewsInner}>
        <FadeUp y={12} duration={0.9}>
          <div className={styles.titleRow}>
            {/* 운영자 2026-08-24: "멤버들이 남긴 문장" → "후기" */}
            <h2 className={styles.sectionTitle}>후기</h2>
          </div>
          <p className={rstyles.reviewsLead}>
            멤버들이 손으로 눌러 적어준 이야기들이에요.
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
                      onClick={(e) => { e.stopPropagation(); setModalIdx(i) }}
                      role="button"
                      aria-label={`${c.caption} 크게 보기`}
                    >
                      <Image
                        /* 카드는 축소본 — 모달만 원본을 쓴다 (2026-08-17) */
                        src={c.photoCard ?? c.photo}
                        alt={c.caption}
                        fill
                        sizes="(max-width: 600px) 92vw, 560px"
                        quality={85}
                        draggable={false}
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

      </div>

      {/* ── 모달 갤러리: 책소개 카드 문법 — 활성 카드 중앙 + 양옆 이웃 슬리버, 확대 상태에서도 넘김 ── */}
      {modal !== null && modalIdx !== null && (
        <div
          ref={drag.veilRef}
          className={`${rstyles.lightbox} ${rstyles.lightboxRoot} ${zoom.zoomed ? rstyles.lightboxZoomed : ""}`}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={`${modal.caption} 확대 보기`}
        >
          <button type="button" className={rstyles.lightboxClose} aria-label="닫기" onClick={(e) => { e.stopPropagation(); closeModal() }}>×</button>

          <div ref={drag.frameRef} className={`${rstyles.galleryFrame} ${rstyles.galleryFrameZoom}`} onClick={(e) => e.stopPropagation()}>
            <div
              ref={stageRef}
              className={`${rstyles.galleryStage} ${rstyles.zoomStage} ${zoom.zoomed ? rstyles.zoomStageZoomed : ""}`}
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
                    className={`${rstyles.gallerySlideM} ${isCur ? rstyles.gallerySlideMActive : ""} ${isCur && zoom.zoomed ? rstyles.activeSlideZoomed : ""}`}
                    ref={isCur ? zoom.frameRef : undefined}
                    style={{
                      transform: `translateX(calc(-50% + ${off} * (var(--slide-w) + 8px)))${isCur ? "" : " scale(0.94)"}`,
                    }}
                    aria-hidden={!isCur}
                  >
                    <div ref={isCur ? zoom.layerRef : undefined} className={rstyles.zoomLayer}>
                      {c.photo && (
                        <Image
                          src={c.photo}
                          alt={c.caption}
                          fill
                          sizes="(min-width: 721px) 80vw, 92vw"
                          quality={90}
                          draggable={false}
                          priority={isCur}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              className={`${rstyles.galleryNav} ${rstyles.galleryNavLeft}`}
              onClick={(e) => { e.stopPropagation(); slideModal(-1) }}
              disabled={modalIdx === 0}
              aria-label="이전 후기 사진"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${rstyles.galleryNav} ${rstyles.galleryNavRight}`}
              onClick={(e) => { e.stopPropagation(); slideModal(1) }}
              disabled={modalIdx === photoCards.length - 1}
              aria-label="다음 후기 사진"
            >
              ›
            </button>

            {/* 데스크톱 전용 +/− — 클릭 확대를 못 찾는 사용자용 안전망 (CSS 로 모바일에서 숨김) */}
            <div className={rstyles.zoomControls} onClick={(e) => e.stopPropagation()}>
              <button type="button" className={rstyles.zoomBtn} onClick={() => zoom.stepZoom(-1)} aria-label="축소">−</button>
              <button type="button" className={rstyles.zoomBtn} onClick={() => zoom.stepZoom(1)} aria-label="확대">+</button>
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
