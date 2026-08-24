"use client"

/**
 * 기록 섹션 모달 갤러리 — 실사이트 후기 모달(ReviewsSection.tsx 하단 모달 블록)의
 * **그대로 이식본** (운영자 2026-08-21 "레이지데이 북클럽에서 후기 클릭했을 때 모달을
 * 기록 섹션에 그대로 이식해"). 갤러리 슬리버·스와이프·방향키·핀치 줌·+/− 안전망까지
 * 동작 동일. 확대 로직은 원본과 **같은 훅**(useZoomGesture)을 공유하고, CSS 만
 * §9 규율(기존 .module.css 미임포트) 때문에 사본(records-lightbox.module.css)이다.
 * ⚠ 원본 모달이 바뀌면 이 파일·CSS 사본도 같은 값으로 (쌍 동기화).
 */

import { useEffect, useRef } from "react"
import Image from "next/image"
import { useZoomGesture } from "@/app/(main)/lazyday/useZoomGesture"
import { useDragDismiss } from "@/app/(main)/lazyday/useDragDismiss"
import rstyles from "./records-lightbox.module.css"

export type RecordItem = {
  key: string
  /** 모달(확대 보기)용 원본 — 세로 1440px */
  photo: string
  caption: string
}

const SWIPE_PX = 45 // 원본 ReviewsSection 과 동일 판정값

export function RecordsLightbox({
  items,
  index,
  onClose,
  onSlide,
}: {
  items: RecordItem[]
  index: number
  onClose: () => void
  /** dir: ±1 — 경계 클램프는 호출부가 아니라 여기서 한다 (원본과 동일) */
  onSlide: (next: number) => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  const zoom = useZoomGesture()
  // 세로 드래그 탈출 — 갇힌 느낌 해소 (운영자 2026-08-24, useDragDismiss 헤더 참조)
  const drag = useDragDismiss(close)

  function close() {
    onClose()
    zoom.reset()
  }
  function slide(dir: number) {
    const next = Math.min(items.length - 1, Math.max(0, index + dir))
    if (next !== index) {
      zoom.reset() // 슬라이드 넘김 시 확대 해제 (원본 동일)
      onSlide(next)
    }
  }

  // 모달 열림 동안 배경 스크롤 잠금 + Esc 닫기 + 방향키 슬라이드 (원본 동일)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowRight") slide(1)
      else if (e.key === "ArrowLeft") slide(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // 트랙패드 핀치 — 원본 주석 참조 (React 합성 onWheel 은 passive 라 네이티브 등록)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const handler = (e: WheelEvent) => zoom.onWheel(e as unknown as React.WheelEvent)
    el.addEventListener("wheel", handler, { passive: false })
    return () => el.removeEventListener("wheel", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 포인터 — 확대 판정은 useZoomGesture, 여기는 축소 상태 스와이프·이웃 탭만 (원본 동일)
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
      slide(dx < 0 ? 1 : -1)
      return
    }
    if (!result.tap) return
    const hit = (e.target as HTMLElement).closest("[data-slide-idx]") as HTMLElement | null
    const hitIdx = hit ? Number(hit.dataset.slideIdx) : NaN
    if (!Number.isNaN(hitIdx) && hitIdx !== index) onSlide(hitIdx)
  }
  function onStagePointerCancel(e: React.PointerEvent) {
    swipeRef.current = null
    zoom.onPointerCancel(e)
    drag.onCancel()
  }

  const cur = items[index]
  if (!cur) return null

  return (
    <div
      ref={drag.veilRef}
      className={`${rstyles.lightbox} ${rstyles.lightboxRoot} ${zoom.zoomed ? rstyles.lightboxZoomed : ""}`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={`${cur.caption} 확대 보기`}
    >
      <button type="button" className={rstyles.lightboxClose} aria-label="닫기" onClick={(e) => { e.stopPropagation(); close() }}>×</button>

      <div ref={drag.frameRef} className={`${rstyles.galleryFrame} ${rstyles.galleryFrameZoom}`} onClick={(e) => e.stopPropagation()}>
        <div
          ref={stageRef}
          className={`${rstyles.galleryStage} ${rstyles.zoomStage} ${zoom.zoomed ? rstyles.zoomStageZoomed : ""}`}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          onPointerCancel={onStagePointerCancel}
        >
          {items.map((c, k) => {
            const off = k - index
            const isCur = k === index
            return (
              <div
                key={`slide-${c.key}`}
                data-slide-idx={k}
                className={`${rstyles.gallerySlideM} ${isCur ? rstyles.gallerySlideMActive : ""} ${isCur && zoom.zoomed ? rstyles.activeSlideZoomed : ""}`}
                ref={isCur ? zoom.frameRef : undefined}
                style={{
                  transform: `translateX(calc(-50% + ${off} * (var(--slide-w) + 8px)))${isCur ? "" : " scale(0.94)"}`,
                }}
                aria-hidden={!isCur}
              >
                <div ref={isCur ? zoom.layerRef : undefined} className={rstyles.zoomLayer}>
                  <Image
                    src={c.photo}
                    alt={c.caption}
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

        <button
          type="button"
          className={`${rstyles.galleryNav} ${rstyles.galleryNavLeft}`}
          onClick={(e) => { e.stopPropagation(); slide(-1) }}
          disabled={index === 0}
          aria-label="이전 후기 사진"
        >
          ‹
        </button>
        <button
          type="button"
          className={`${rstyles.galleryNav} ${rstyles.galleryNavRight}`}
          onClick={(e) => { e.stopPropagation(); slide(1) }}
          disabled={index === items.length - 1}
          aria-label="다음 후기 사진"
        >
          ›
        </button>

        {/* 데스크톱 전용 +/− — 클릭 확대를 못 찾는 사용자용 안전망 (원본 동일) */}
        <div className={rstyles.zoomControls} onClick={(e) => e.stopPropagation()}>
          <button type="button" className={rstyles.zoomBtn} onClick={() => zoom.stepZoom(-1)} aria-label="축소">−</button>
          <button type="button" className={rstyles.zoomBtn} onClick={() => zoom.stepZoom(1)} aria-label="확대">+</button>
        </div>
      </div>

      <div className={rstyles.lightboxCaption}>
        <span>{cur.caption}</span>
        <span className={rstyles.lightboxCounter}>{index + 1} / {items.length}</span>
      </div>
    </div>
  )
}
