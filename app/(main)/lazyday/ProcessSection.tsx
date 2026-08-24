"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { FadeUp } from "@/components/animation/FadeUp"
import s from "./process-section.module.css"
import rstyles from "./ReviewsSection.module.css"
import { useZoomGesture } from "./useZoomGesture"

/**
 * 진행 방식 — 독립 섹션 (5안 확정, 운영자 2026-08-24 "5안으로 확정해서 배포해").
 *
 * 구 HowToBrief(모임소개 밴드 하단 요약)를 대체한다:
 *  · 3단계 → 4단계 (자기소개를 01 로 분리 — 운영자 "자기소개만 01에서 분리해서 추가")
 *  · 자기소개 규칙 원문·레이지 노트는 본문에 펼치지 않고 **모달 뒤**로
 *    → 화면 노출은 최소, 정보는 최대 (5안의 핵심)
 *
 * 모달은 **후기 섹션과 완전히 동일한 UI/UX** — ReviewsSection.module.css 와
 * useZoomGesture 를 코드 그대로 재사용해 크기·핀치줌·드래그팬·+/−·닫기가 같다
 * (운영자 "레이지노트/후기 모달과 동일한 사이즈로 잡아줘. UI/UX 동일하게 가").
 * 단, **자기소개 규칙은 단일 이미지라 넘김(‹›)과 카운터를 뺀다** (운영자 단서).
 *
 * ⚠ 01·02 문안은 운영자 원문 그대로 (2026-08-24 지급) — 임의 수정 금지.
 *   03·04 는 구 HowToBrief 확정본을 그대로 승계했다.
 * ⚠ HowToBrief 는 삭제하지 않고 고아 보존 (되돌릴 때 필요 — CLAUDE.md 관례).
 */

type Shot = { id: string; img: string; caption: string }

const INTRO_RULES: Shot[] = [
  {
    id: "intro-rules",
    img: "/linky-lounge/book-club/intro-rules/intro-rules-doc.webp",
    caption: "자기소개 규칙",
  },
]

/** 레이지 노트 — 기수별 실제 진행분 샘플 (운영자 제공, 2026-08-24) */
const LAZY_NOTES: Shot[] = [
  { id: "ln1", img: "/linky-lounge/book-club/lazynote/lazynote-01.webp", caption: "오프닝 — 에리히 프롬 『자유로부터의 도피』" },
  { id: "ln2", img: "/linky-lounge/book-club/lazynote/lazynote-02.webp", caption: "질문 1. 동일화 — 에밀리 브론테 『폭풍의 언덕』" },
  { id: "ln3", img: "/linky-lounge/book-club/lazynote/lazynote-03.webp", caption: "질문 2. 믿음 — 에리히 프롬 『사랑의 기술』" },
  { id: "ln4", img: "/linky-lounge/book-club/lazynote/lazynote-04.webp", caption: "질문 3. 인간적 모순 — 제임스 M. 케인 『포스트맨은 벨을 두 번 울린다』" },
]

const SWIPE_PX = 45

/**
 * 이미지 모달 — 후기 갤러리와 동일 문법. shots 가 1장이면 넘김·카운터를 숨긴다.
 * (ReviewsSection.tsx 의 모달 구조를 값 그대로 따온 사본 — 후기 쪽은 카드
 *  캐러셀과 얽혀 있어 컴포넌트를 분리 추출하지 않았다. 후기 모달 값을 바꾸면
 *  이쪽도 같이 볼 것.)
 */
function ShotModal({ shots, startIdx, onClose }: { shots: Shot[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx)
  const stageRef = useRef<HTMLDivElement>(null)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  const zoom = useZoomGesture()
  const multi = shots.length > 1

  function slide(dir: number) {
    if (!multi) return
    setIdx((m) => {
      const next = Math.min(shots.length - 1, Math.max(0, m + dir))
      if (next !== m) zoom.reset()
      return next
    })
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowRight") slide(1)
      else if (e.key === "ArrowLeft") slide(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 트랙패드 핀치(wheel+ctrlKey) — React 합성 이벤트는 passive 라 네이티브로 등록
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const handler = (e: WheelEvent) => zoom.onWheel(e as unknown as React.WheelEvent)
    el.addEventListener("wheel", handler, { passive: false })
    return () => el.removeEventListener("wheel", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onDown(e: React.PointerEvent) {
    swipeRef.current = { x: e.clientX, y: e.clientY }
    zoom.onPointerDown(e)
  }
  function onUp(e: React.PointerEvent) {
    const result = zoom.onPointerUp(e, { pointerType: e.pointerType })
    if (result.consumed) { swipeRef.current = null; return }
    const start = swipeRef.current
    swipeRef.current = null
    if (!start || !multi) return
    const dx = e.clientX - start.x
    if (Math.abs(dx) >= SWIPE_PX) slide(dx < 0 ? 1 : -1)
  }

  const cur = shots[idx]

  return (
    <div
      className={`${rstyles.lightbox} ${rstyles.lightboxRoot} ${zoom.zoomed ? rstyles.lightboxZoomed : ""}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${cur.caption} 확대 보기`}
    >
      <button type="button" className={rstyles.lightboxClose} aria-label="닫기" onClick={(e) => { e.stopPropagation(); onClose() }}>×</button>

      <div className={`${rstyles.galleryFrame} ${rstyles.galleryFrameZoom}`} onClick={(e) => e.stopPropagation()}>
        <div
          ref={stageRef}
          className={`${rstyles.galleryStage} ${rstyles.zoomStage} ${zoom.zoomed ? rstyles.zoomStageZoomed : ""}`}
          onPointerDown={onDown}
          onPointerMove={zoom.onPointerMove}
          onPointerUp={onUp}
          onPointerCancel={(e) => { swipeRef.current = null; zoom.onPointerCancel(e) }}
        >
          {shots.map((sh, k) => {
            const off = k - idx
            const isCur = k === idx
            return (
              <div
                key={sh.id}
                data-slide-idx={k}
                className={`${rstyles.gallerySlideM} ${isCur ? rstyles.gallerySlideMActive : ""} ${isCur && zoom.zoomed ? rstyles.activeSlideZoomed : ""}`}
                ref={isCur ? zoom.frameRef : undefined}
                style={{ transform: `translateX(calc(-50% + ${off} * (var(--slide-w) + 8px)))${isCur ? "" : " scale(0.94)"}` }}
                aria-hidden={!isCur}
              >
                <div ref={isCur ? zoom.layerRef : undefined} className={rstyles.zoomLayer}>
                  <Image
                    src={sh.img}
                    alt={sh.caption}
                    fill
                    sizes="(min-width: 721px) 80vw, 92vw"
                    quality={90}
                    draggable={false}
                    priority={isCur}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* 단일 이미지에서는 넘김을 숨긴다 (운영자: "단일 이미지이므로 넘김만 빼고") */}
        {multi && (
          <>
            <button
              type="button"
              className={`${rstyles.galleryNav} ${rstyles.galleryNavLeft}`}
              onClick={(e) => { e.stopPropagation(); slide(-1) }}
              disabled={idx === 0}
              aria-label="이전"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${rstyles.galleryNav} ${rstyles.galleryNavRight}`}
              onClick={(e) => { e.stopPropagation(); slide(1) }}
              disabled={idx === shots.length - 1}
              aria-label="다음"
            >
              ›
            </button>
          </>
        )}

        {/* 데스크톱 전용 +/− (모바일은 CSS 로 숨김) — 후기와 동일 */}
        <div className={rstyles.zoomControls} onClick={(e) => e.stopPropagation()}>
          <button type="button" className={rstyles.zoomBtn} onClick={() => zoom.stepZoom(-1)} aria-label="축소">−</button>
          <button type="button" className={rstyles.zoomBtn} onClick={() => zoom.stepZoom(1)} aria-label="확대">+</button>
        </div>
      </div>

      <div className={rstyles.lightboxCaption}>
        <span>{cur.caption}</span>
        {multi && <span className={rstyles.lightboxCounter}>{idx + 1} / {shots.length}</span>}
      </div>
    </div>
  )
}

type Step = {
  label: string
  description: string
  /** 설명 아래 모달 링크 */
  open?: { text: string; shots: Shot[] }
}

const steps: Step[] = [
  {
    label: "자기소개",
    // 운영자 원문 (2026-08-24) — 임의 수정 금지
    description: "대화에만 온전히 집중할 수 있도록 조금은 특별한 자기소개를 진행합니다.",
    open: { text: "자기소개 규칙 확인하기", shots: INTRO_RULES },
  },
  {
    label: "오프닝, 질문 1~3",
    // 운영자 원문 (2026-08-24) — 구 "레이지데이가 제시하는" → "건네는"
    description: "레이지데이가 건네는 주제를 바탕으로 대화를 시작합니다.",
    open: { text: "레이지 노트 모아보기", shots: LAZY_NOTES },
  },
  {
    // 이하 2건은 구 HowToBrief 확정본 승계 — 임의 수정 금지
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

export function ProcessSection() {
  const [modal, setModal] = useState<{ shots: Shot[]; idx: number } | null>(null)

  return (
    <section id="process" className={s.section}>
      <div className={s.inner}>
        <FadeUp y={12} duration={0.9}>
          <div className={s.head}>
            <h2 className={s.title}>진행 방식</h2>
            <p className={s.meta}>총 3시간 진행</p>
          </div>
        </FadeUp>

        <ol className={s.list}>
          {steps.map(({ label, description, open }, i) => (
            <li key={label} className={s.step}>
              <div className={s.stepHead}>
                <span className={s.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className={s.stepLabel}>{label}</h3>
              </div>
              <div>
                <p className={s.stepDesc}>{description}</p>
                {open && (
                  <button
                    type="button"
                    className={s.openBtn}
                    onClick={() => setModal({ shots: open.shots, idx: 0 })}
                  >
                    {open.text}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {modal && <ShotModal shots={modal.shots} startIdx={modal.idx} onClose={() => setModal(null)} />}
    </section>
  )
}
