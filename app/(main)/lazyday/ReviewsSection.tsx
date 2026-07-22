"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import styles from "./FaqSection.module.css"
import rstyles from "./ReviewsSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 후기 섹션 (실사이트) — 폴라로이드 카드 캐러셀(확정 디자인, DECISIONS 2026-07-04·07-07)
 * + 모달 갤러리 (운영자 지시 2026-07-21):
 *  - 카드 사진 클릭 → 모달로 단독 확대. 모달 안에서 좌우 스와이프/‹›/방향키로
 *    다음 후기로 넘김 (확대 상태에서도 갤러리 유지).
 *  - 모달 이미지 탭(클릭) → 그 지점 기준 2배 추가 확대, 드래그로 팬(이동),
 *    재탭 → 축소 복귀. 축소 상태에서만 스와이프가 슬라이드 넘김으로 동작.
 *  - 모바일 기준 설계, PC는 ‹›버튼·방향키·클릭 확대·드래그 팬으로 동일 기능.
 * 카드 하단 흰색 여백은 날짜만 표기 ("--의 기록", 운영자 지시 2026-07-21).
 * 발췌문(quote)은 실물 서면후기에서 원문 그대로 전사 — 운영자 검수 전 오독 가능성 있음.
 */
type ReviewCard = {
  id: string
  caption: string
  photo?: string
  quote?: string
  by?: string
}

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

const ZOOM_SCALE = 2
const SWIPE_PX = 45
const TAP_SLOP_PX = 8

type ZoomT = { tx: number; ty: number }

export function ReviewsSection() {
  const [idx, setIdx] = useState(0)
  const [modalIdx, setModalIdx] = useState<number | null>(null)
  // 모달 내 추가 확대 상태 (null = 축소/기본). tx·ty는 팬 오프셋(px)
  const [zoomT, setZoomT] = useState<ZoomT | null>(null)
  const [panning, setPanning] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null)

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
    setZoomT(null)
    setPanning(false)
  }

  function slideModal(dir: number) {
    setModalIdx((m) => {
      if (m === null) return m
      const next = Math.min(photoCards.length - 1, Math.max(0, m + dir))
      if (next !== m) setZoomT(null) // 슬라이드 넘김 시 확대 해제
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

  // 팬 한계: 확대(s)된 이미지가 뷰포트 밖으로 다 나가지 않게
  function clampPan(v: number, size: number) {
    const lim = (size * (ZOOM_SCALE - 1)) / 2
    return Math.max(-lim, Math.min(lim, v))
  }

  // 활성 슬라이드 DOM (탭 좌표 → 확대 원점 계산, 팬 한계 산정)
  function activeSlideRect() {
    const el = stageRef.current?.querySelector(`[data-slide-idx="${modalIdx}"]`)
    return el ? (el as HTMLElement).getBoundingClientRect() : null
  }

  // ── 모달 갤러리 포인터 인터랙션 (책소개 카드 문법의 캐러셀 스테이지) ──
  // 축소 상태: 가로 45px 이상 드래그 = 슬라이드 넘김 / 활성 카드 탭 = 그 지점 2배 확대
  //           / 양옆 살짝 보이는 이웃 카드 탭 = 그 카드로 이동
  // 확대 상태: 드래그 = 팬 / 살짝 탭 = 축소 복귀
  function onStagePointerDown(e: React.PointerEvent) {
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      tx: zoomT?.tx ?? 0,
      ty: zoomT?.ty ?? 0,
      moved: false,
    }
    if (zoomT) setPanning(true)
  }
  function onStagePointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.abs(dx) + Math.abs(dy) > TAP_SLOP_PX) d.moved = true
    if (zoomT) {
      const r = activeSlideRect()
      if (r) setZoomT({ tx: clampPan(d.tx + dx, r.width), ty: clampPan(d.ty + dy, r.height) })
    }
  }
  function onStagePointerUp(e: React.PointerEvent) {
    const d = dragRef.current
    dragRef.current = null
    setPanning(false)
    if (!d) return
    const dx = e.clientX - d.x
    if (zoomT) {
      // 확대 중: 탭이면 축소 복귀, 드래그였으면 팬 종료
      if (!d.moved) setZoomT(null)
      return
    }
    if (Math.abs(dx) >= SWIPE_PX) {
      slideModal(dx < 0 ? 1 : -1)
      return
    }
    if (d.moved) return
    // 탭: 이웃 카드면 그 카드로, 활성 카드면 탭 지점 확대
    const hit = (e.target as HTMLElement).closest("[data-slide-idx]") as HTMLElement | null
    const hitIdx = hit ? Number(hit.dataset.slideIdx) : NaN
    if (!Number.isNaN(hitIdx) && hitIdx !== modalIdx) {
      setZoomT(null)
      setModalIdx(hitIdx)
      return
    }
    const r = activeSlideRect()
    if (r) {
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      setZoomT({
        tx: clampPan(-px * r.width * ZOOM_SCALE, r.width),
        ty: clampPan(-py * r.height * ZOOM_SCALE, r.height),
      })
    }
  }

  const active = photoCards[Math.min(idx, photoCards.length - 1)]
  const modal = modalIdx !== null ? photoCards[modalIdx] : null

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
                      onClick={() => i === idx && setModalIdx(i)}
                      role="button"
                      aria-label={`${c.caption} 크게 보기`}
                    >
                      <Image
                        src={c.photo}
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

        {/* 활성 슬라이드에 맞춰 페이드 전환되는 인용문 — 발췌문이 준비된 카드만 */}
        {active.quote && (
          <blockquote key={idx} className={`${rstyles.reviewQuote} ${rstyles.quoteFade}`}>
            {active.quote}
            {active.by && <span className={rstyles.reviewQuoteBy}>{active.by}</span>}
          </blockquote>
        )}
      </div>

      {/* ── 모달 갤러리: 책소개 카드 문법 — 활성 카드 중앙 + 양옆 이웃 슬리버, 확대 상태에서도 넘김 ── */}
      {modal !== null && modalIdx !== null && (
        <div
          className={rstyles.lightbox}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={`${modal.caption} 확대 보기`}
        >
          <button type="button" className={rstyles.lightboxClose} aria-label="닫기">×</button>

          <div className={rstyles.galleryFrame} onClick={(e) => e.stopPropagation()}>
            <div
              ref={stageRef}
              className={rstyles.galleryStage}
              onPointerDown={onStagePointerDown}
              onPointerMove={onStagePointerMove}
              onPointerUp={onStagePointerUp}
              onPointerCancel={() => { dragRef.current = null; setPanning(false) }}
            >
              {photoCards.map((c, k) => {
                const off = k - modalIdx
                const isCur = k === modalIdx
                return (
                  <div
                    key={`slide-${c.id}`}
                    data-slide-idx={k}
                    className={`${rstyles.gallerySlideM} ${isCur ? rstyles.gallerySlideMActive : ""}`}
                    style={{
                      transform: `translateX(calc(-50% + ${off} * (var(--slide-w) + 8px)))${isCur ? "" : " scale(0.94)"}`,
                    }}
                    aria-hidden={!isCur}
                  >
                    <div
                      className={rstyles.galleryZoomLayer}
                      style={
                        isCur && zoomT
                          ? {
                              transform: `translate(${zoomT.tx}px, ${zoomT.ty}px) scale(${ZOOM_SCALE})`,
                              transition: panning ? "none" : undefined,
                            }
                          : undefined
                      }
                    >
                      {c.photo && (
                        <Image
                          src={c.photo}
                          alt={c.caption}
                          fill
                          sizes="92vw"
                          quality={90}
                          draggable={false}
                          priority={isCur}
                          style={{ objectFit: "cover" }}
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
