"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import styles from "./ScenesSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"
import { SCENES, type Scene } from "./scenes-config"

/**
 * 장면들(SCENES) — 폴라로이드 앨범 콜라주 + 리프트 뷰어 (운영자 확정 2026-07-07)
 *  · 벽에는 각 장면의 표지(photos[0])만. 탭 → 뷰포트 중앙으로 리프트(scale)
 *  · 리프트 중 가로 슬라이드(스와이프 45px·방향키·‹ ›)로 앨범 넘기기, 캡션 동기
 *  · 닫기: 재탭·백드롭·Esc → 표지(0페이지) 리셋
 *  · 컨트롤은 fixed 금지 — 사진 위 오버레이(#f5ede4+text-shadow), 1장이면 숨김
 *  · 장면 ⑥ = 손글씨 후기 스캔 통합 (후기 섹션 별도 신설 영구 보류)
 *  · 원고(라벨·발췌·캡션)와 사진은 전부 자리표시 — 운영자 원고 대기
 */

const SLIDE_EASE = "cubic-bezier(0.22, 0.8, 0.36, 1)"

function SceneFigure({
  scene,
  lifted,
  onToggle,
  order,
}: {
  scene: Scene
  lifted: boolean
  onToggle: () => void
  order: number
}) {
  const figRef = useRef<HTMLElement>(null)
  const [page, setPage] = useState(0)
  const [liftStyle, setLiftStyle] = useState<React.CSSProperties | undefined>(undefined)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const n = scene.photos.length

  // 리프트: 뷰포트 중앙으로 translate + scale (min(1.6, vw·86%/폭, vh·80%/높이), 최소 1.15)
  useEffect(() => {
    if (!lifted) {
      setLiftStyle(undefined)
      setPage(0) // 닫힘 → 표지 리셋
      return
    }
    const el = figRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const scale = Math.max(1.15, Math.min(1.6, (vw * 0.86) / r.width, (vh * 0.8) / r.height))
    const dx = vw / 2 - (r.left + r.width / 2)
    const dy = vh / 2 - (r.top + r.height / 2)
    setLiftStyle({ transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(0deg)` })
  }, [lifted])

  const go = useCallback(
    (dir: 1 | -1) => setPage((p) => Math.min(n - 1, Math.max(0, p + dir))),
    [n],
  )

  // 방향키 (리프트 중에만)
  useEffect(() => {
    if (!lifted) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1)
      else if (e.key === "ArrowLeft") go(-1)
      else if (e.key === "Escape") onToggle()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lifted, go, onToggle])

  // 스와이프 45px (마우스 드래그 포함) / 그 미만은 탭(토글)
  const onPointerDown = (e: React.PointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointer.current
    pointer.current = null
    if (!start) return
    const dx = e.clientX - start.x
    if (lifted && Math.abs(dx) >= 45) {
      go(dx < 0 ? 1 : -1)
      return
    }
    onToggle() // 탭: 리프트 ↔ 닫기
  }

  return (
    <FadeUp y={10} duration={0.6} delay={0.06 * order}>
      <figure
        ref={figRef}
        className={`${styles.figure} ${lifted ? styles.figureLifted : ""}`}
        style={
          lifted
            ? liftStyle
            : { transform: `rotate(${scene.rotate}deg)` }
        }
        role="button"
        tabIndex={0}
        aria-expanded={lifted}
        aria-label={`${scene.label} — 사진 ${n}장`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
      >
        <span
          className={styles.tape}
          style={{ transform: `translateX(-50%) rotate(${scene.tapeRotate}deg)` }}
          aria-hidden
        />
        {/* 앨범: 프레임 absolute 스택, translateX((k−page)×100%) 가로 슬라이드 */}
        <div className={styles.album} style={{ height: `${scene.height}px` }}>
          {scene.photos.map((ph, k) => (
            <div
              key={k}
              className={styles.frame}
              style={{ transform: `translateX(${(k - page) * 100}%)` }}
              aria-hidden={k !== page}
            >
              <Image
                src={ph.src}
                alt={ph.alt}
                fill
                sizes="(max-width: 679px) 55vw, 420px"
                loading="lazy"
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
          {/* 컨트롤 오버레이 — 리프트 중 + 2장 이상일 때만 */}
          {lifted && n > 1 && (
            <>
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navPrev}`}
                onClick={(e) => { e.stopPropagation(); go(-1) }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                aria-label="이전 사진"
                disabled={page === 0}
              >
                ‹
              </button>
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navNext}`}
                onClick={(e) => { e.stopPropagation(); go(1) }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                aria-label="다음 사진"
                disabled={page === n - 1}
              >
                ›
              </button>
              <span className={styles.counter} aria-live="polite">
                {page + 1} / {n}
              </span>
            </>
          )}
        </div>
        {/* 캡션 — 페이지별 동기 슬라이드 (표지=label+quote, 비표지=사진 캡션) */}
        <figcaption className={styles.caption}>
          <span
            className={styles.captionCover}
            style={{ transform: `translateX(${(0 - page) * 100}%)` }}
            aria-hidden={page !== 0}
          >
            {scene.label}
            {scene.quote && <span className={styles.captionQuote}>{scene.quote}</span>}
          </span>
          {scene.photos.slice(1).map((ph, j) => (
            <span
              key={j}
              className={styles.captionPage}
              style={{ transform: `translateX(${(j + 1 - page) * 100}%)` }}
              aria-hidden={page !== j + 1}
            >
              {ph.caption}
            </span>
          ))}
        </figcaption>
      </figure>
    </FadeUp>
  )
}

export function ScenesSection() {
  const [liftedId, setLiftedId] = useState<string | null>(null)
  const scenes = SCENES.filter((s) => s.photos.length > 0)

  // 사진이 전부 비면 섹션 자체 미렌더
  if (scenes.length === 0) return null

  const left = scenes.filter((_, i) => i % 2 === 0) // ①③⑤
  const right = scenes.filter((_, i) => i % 2 === 1) // ②④⑥

  const toggle = (id: string) => setLiftedId((cur) => (cur === id ? null : id))

  return (
    <section className={styles.section}>
      <FadeUp y={12} duration={0.9} className={styles.eyebrowWrap}>
        <p className={styles.eyebrow}>SCENES</p>
      </FadeUp>

      {/* 백드롭 — 리프트 중에만, 클릭 시 닫기 */}
      {liftedId && (
        <div className={styles.backdrop} onClick={() => setLiftedId(null)} aria-hidden />
      )}

      <div className={styles.collage}>
        <div className={styles.colLeft}>
          {left.map((scene, i) => (
            <SceneFigure
              key={scene.id}
              scene={scene}
              lifted={liftedId === scene.id}
              onToggle={() => toggle(scene.id)}
              order={i * 2}
            />
          ))}
        </div>
        <div className={styles.colRight}>
          {right.map((scene, i) => (
            <SceneFigure
              key={scene.id}
              scene={scene}
              lifted={liftedId === scene.id}
              onToggle={() => toggle(scene.id)}
              order={i * 2 + 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
