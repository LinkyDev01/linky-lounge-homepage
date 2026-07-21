"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Nanum_Pen_Script } from "next/font/google"
import styles from "./FaqSection.module.css"
import rstyles from "./ReviewsSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 후기 섹션 (실사이트) — 폴라로이드 매트 콜라주 + '리프트 앨범' 인터랙션
 * (운영자 지시 2026-07-21: 장면들(ScenesSection) 매트 디자인 문법을 후기에 적용).
 *
 * 인터랙션 (라이브러리 추가 없음 — React state + CSS transform):
 *  - 탭 → 매트가 뷰포트 중앙으로 리프트(확대). 백드롭·재탭·Esc로 내려놓기.
 *  - 리프트 중 사진 2장 이상이면 ‹›버튼·스와이프·방향키로 앨범 넘김(순환) + 카운터.
 *  - 벽(휴지 상태)에는 photos[0](표지)만 보인다.
 *
 * 캡션: 폴라로이드 하단 여백 손글씨(Nanum Pen Script 16px), 발췌 인용(quote)은
 * 표지 캡션 아래 명조 11.5px — 사진과 함께 슬라이드.
 * 발췌문은 실물 서면후기에서 원문 전사 — 운영자 검수 전 오독 가능성 있음.
 */

const penScript = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
})

type ReviewPhoto = { src: string; alt: string; caption: string }
type Review = { label: string; quote?: string; photos: ReviewPhoto[] }

const REVIEWS: Review[] = [
  {
    label: "2026년 7월 15일 서면 후기",
    quote:
      "\"책을 읽고 나서 누군가와 대화하고 싶었습니다. 그 목마름을 해결해주는 것만으로도 마음이 굉장히 편안해졌던 것 같아요.\"",
    photos: [
      {
        src: "/linky-lounge/book-club/reviews/review-01.webp",
        alt: "2026년 7월 15일 멤버 서면 후기 손글씨",
        caption: "2026. 7. 15의 기록",
      },
    ],
  },
  {
    label: "2026년 7월 12일 서면 후기 첫 번째",
    quote:
      "\"장소의 인테리어나 BGM이 독서모임의 분위기와 잘 맞고 마음을 편안하게 해주었던 것 같습니다.\"",
    photos: [
      {
        src: "/linky-lounge/book-club/reviews/review-02.webp",
        alt: "2026년 7월 12일 멤버 서면 후기 손글씨",
        caption: "2026. 7. 12의 기록",
      },
    ],
  },
  {
    label: "2026년 7월 12일 서면 후기 두 번째",
    quote:
      "\"같은 책을 읽고 다 각자의 생각을 이야기할 수 있는 것도 너무 흥미로웠습니다.\"",
    photos: [
      {
        src: "/linky-lounge/book-club/reviews/review-03.webp",
        alt: "2026년 7월 12일 멤버 서면 후기 손글씨",
        caption: "2026. 7. 12의 기록",
      },
    ],
  },
  {
    label: "2026년 7월 12일 서면 후기 세 번째",
    quote:
      "\"『사랑의 기술』을 읽고 평소 어려워했던 철학에 관심이 생겼습니다. 함께라면 더 잘 읽을 수 있을 것 같아요.\"",
    photos: [
      {
        src: "/linky-lounge/book-club/reviews/review-04.webp",
        alt: "2026년 7월 12일 멤버 서면 후기 손글씨",
        caption: "2026. 7. 12의 기록",
      },
    ],
  },
]

// 위치 기반 회전(도) — 좌/우열 index별 (ScenesSection 문법)
const MAT_ROT = { left: [-0.8, 0.5], right: [0.9, -0.6] }
const TAPE_ROT = { left: [0, 1.5], right: [-1, 2] }

// 시각 순서 좌1→우1→좌2→우2: 좌열 = REVIEWS[0,2], 우열 = REVIEWS[1,3]
const LEFT_IDX = [0, 2]
const RIGHT_IDX = [1, 3]

type Lift = { dx: number; dy: number; s: number }

export function ReviewsSection() {
  const [lifted, setLifted] = useState<number | null>(null)
  const [frame, setFrame] = useState(0)
  const [liftT, setLiftT] = useState<Lift | null>(null)
  const figRefs = useRef<(HTMLElement | null)[]>([])
  // 스와이프 직후 500ms간 탭(내려놓기) 판정 무시
  const suppressTapUntil = useRef(0)
  const dragStartX = useRef<number | null>(null)

  function liftTo(i: number) {
    const fig = figRefs.current[i]
    if (!fig) return
    const rect = fig.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const s = Math.max(1.15, Math.min(1.6, (vw * 0.86) / rect.width, (vh * 0.8) / rect.height))
    const dx = vw / 2 - (rect.left + rect.width / 2)
    const dy = vh / 2 - (rect.top + rect.height / 2)
    setLifted(i)
    setFrame(0)
    setLiftT({ dx, dy, s })
  }

  function putDown() {
    setLifted(null)
    setLiftT(null)
    setFrame(0)
  }

  // 백드롭 클릭: 그 지점에 다른 매트가 있으면 내려놓고 교체, 아니면 내려놓기.
  // (백드롭이 휴지 매트들 위(z)에 있어 매트 자체 클릭이 막히므로 좌표 히트테스트로 스왑)
  function onBackdropClick(e: React.MouseEvent) {
    const hit = document
      .elementsFromPoint(e.clientX, e.clientY)
      .find((el): el is HTMLElement => el instanceof HTMLElement && el.dataset.matIdx !== undefined)
    const idx = hit ? Number(hit.dataset.matIdx) : NaN
    if (!Number.isNaN(idx) && idx !== lifted) liftTo(idx)
    else putDown()
  }

  function toggle(i: number) {
    if (performance.now() < suppressTapUntil.current) return
    if (lifted === i) putDown()
    else liftTo(i)
  }

  function flip(dir: number) {
    if (lifted === null) return
    const n = REVIEWS[lifted].photos.length
    if (n < 2) return
    setFrame((f) => (f + dir + n) % n)
  }

  // 리프트 중: body 스크롤 잠금 + Esc/방향키
  useEffect(() => {
    if (lifted === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") putDown()
      else if (e.key === "ArrowRight") flip(1)
      else if (e.key === "ArrowLeft") flip(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifted])

  // 드래그·스와이프 (리프트된 매트, 사진 2장 이상일 때만 의미)
  function onPointerDown(i: number, e: React.PointerEvent) {
    if (lifted !== i || REVIEWS[i].photos.length < 2) return
    dragStartX.current = e.clientX
  }
  function onPointerUp(i: number, e: React.PointerEvent) {
    if (dragStartX.current === null) return
    const dx = e.clientX - dragStartX.current
    dragStartX.current = null
    if (Math.abs(dx) >= 45) {
      flip(dx < 0 ? 1 : -1)
      suppressTapUntil.current = performance.now() + 500
    }
  }

  function renderMat(idx: number, col: "left" | "right", pos: number, order: number) {
    const r = REVIEWS[idx]
    const isLifted = lifted === idx
    const curFrame = isLifted ? frame : 0
    const matRot = MAT_ROT[col][pos] ?? 0
    const tapeRot = TAPE_ROT[col][pos] ?? 0
    const multi = r.photos.length > 1
    return (
      <div key={idx} className={`${rstyles.matWrap} ${isLifted ? rstyles.matWrapLifted : ""}`}>
        <FadeUp y={10} duration={0.6} delay={0.06 * order}>
          <figure
            ref={(el) => { figRefs.current[idx] = el }}
            data-mat-idx={idx}
            role="button"
            tabIndex={0}
            aria-label={`${r.label} 크게 보기`}
            className={`${rstyles.mat} ${isLifted ? rstyles.matLifted : ""}`}
            style={{
              transform:
                isLifted && liftT
                  ? `translate(${liftT.dx}px, ${liftT.dy}px) rotate(0deg) scale(${liftT.s})`
                  : `rotate(${matRot}deg)`,
            }}
            onClick={() => toggle(idx)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(idx) }
            }}
            onPointerDown={(e) => onPointerDown(idx, e)}
            onPointerUp={(e) => onPointerUp(idx, e)}
          >
            <span
              className={rstyles.tape}
              style={{ transform: `translateX(-50%) rotate(${tapeRot}deg)` }}
              aria-hidden
            />
            <div className={rstyles.imgBox}>
              {r.photos.map((p, k) => (
                <div
                  key={p.src}
                  className={rstyles.photoSlide}
                  style={{ transform: `translateX(${(k - curFrame) * 100}%)` }}
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 480px) 86vw, 360px"
                    quality={85}
                    loading={k === 0 ? undefined : "lazy"}
                    draggable={false}
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))}
              {isLifted && multi && (
                <>
                  <button
                    type="button"
                    className={`${rstyles.navBtn} ${rstyles.navBtnLeft}`}
                    aria-label="이전 사진"
                    onClick={(e) => { e.stopPropagation(); flip(-1) }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={`${rstyles.navBtn} ${rstyles.navBtnRight}`}
                    aria-label="다음 사진"
                    onClick={(e) => { e.stopPropagation(); flip(1) }}
                  >
                    ›
                  </button>
                  <span className={rstyles.counter} aria-hidden>
                    {curFrame + 1} / {r.photos.length}
                  </span>
                </>
              )}
            </div>
            <div className={rstyles.capWrap}>
              {r.photos.map((p, k) => (
                <div
                  key={`cap-${p.src}`}
                  className={`${rstyles.capCell} ${k > 0 ? rstyles.capCellAbs : ""}`}
                  style={{ transform: `translateX(${(k - curFrame) * 100}%)` }}
                >
                  <span className={`${penScript.className} ${rstyles.penCaption}`}>{p.caption}</span>
                  {k === 0 && r.quote && <span className={rstyles.captionQuote}>{r.quote}</span>}
                </div>
              ))}
            </div>
          </figure>
        </FadeUp>
      </div>
    )
  }

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

        <div className={rstyles.collage}>
          <div className={rstyles.colLeft}>
            {LEFT_IDX.map((idx, i) => renderMat(idx, "left", i, i * 2))}
          </div>
          <div className={rstyles.colRight}>
            {RIGHT_IDX.map((idx, i) => renderMat(idx, "right", i, i * 2 + 1))}
          </div>
        </div>
      </div>

      {lifted !== null && <div className={rstyles.backdrop} onClick={onBackdropClick} aria-hidden />}
    </section>
  )
}
