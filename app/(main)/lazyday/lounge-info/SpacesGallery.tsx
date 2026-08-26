"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import styles from "./spaces.module.css"
import { useDragDismiss } from "../useDragDismiss"

/**
 * 공간 둘러보기 — linkylounge 홈 'Our Space' 갤러리를 북클럽 오시는길 맨 아래로 이식
 * (운영자 지시 2026-07-12). 원본 components/lounge/GallerySection과 이미지 소스만 공유.
 *  · 목록은 경량 webp 썸네일(-thumb, 11~32KB) — 원본 jpg(최대 9.7MB) 미로드
 *  · 클릭 시에만 라이트박스에서 대형본(-full, 1600w webp) 로드
 *  · 닫기: X·백드롭·Esc / 이동: ‹ ›·방향키
 */

const PHOTOS = [
  { base: "/linky-lounge/gallary/main", alt: "메인 공간", main: true },
  { base: "/linky-lounge/gallary/g", alt: "라운지 공간" },
  { base: "/linky-lounge/gallary/c", alt: "라운지 공간" },
  { base: "/linky-lounge/gallary/d", alt: "라운지 공간" },
  { base: "/linky-lounge/gallary/e", alt: "라운지 공간" },
]

export function SpacesGallery() {
  const [open, setOpen] = useState<number | null>(null)
  const n = PHOTOS.length
  // 세로 드래그 탈출 — 갇힌 느낌 해소 (운영자 2026-08-24, useDragDismiss 헤더 참조).
  // 이 모달은 줌이 없어 항상 허용(onMove 두 번째 인자 true).
  const drag = useDragDismiss(() => setOpen(null))

  const go = useCallback(
    (dir: 1 | -1) => setOpen((cur) => (cur === null ? cur : Math.min(n - 1, Math.max(0, cur + dir)))),
    [n],
  )

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null)
      else if (e.key === "ArrowRight") go(1)
      else if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    // 라이트박스 동안 배경 스크롤 잠금
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, go])

  return (
    <div className={styles.section}>
      <div className={styles.wrap}>
        <p className={styles.sectionTag}>공간</p>
        <h2 className={styles.sectionTitle}>라운지 둘러보기</h2>
        <div className={styles.grid}>
          {PHOTOS.map((p, i) => (
            <button
              key={p.base}
              type="button"
              className={`${styles.cell} ${p.main ? styles.cellMain : ""}`}
              onClick={() => setOpen(i)}
              aria-label={`${p.alt} 크게 보기`}
            >
              <Image
                src={`${p.base}-thumb.webp`}
                alt={p.alt}
                fill
                sizes="(max-width: 600px) 50vw, 300px"
                loading="lazy"
                className={styles.cellImg}
              />
            </button>
          ))}
        </div>
      </div>

      {open !== null && (
        <div ref={drag.veilRef} className={styles.lightbox} onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <button type="button" className={styles.lbClose} aria-label="닫기">×</button>
          <button
            type="button"
            className={`${styles.lbNav} ${styles.lbPrev}`}
            onClick={(e) => { e.stopPropagation(); go(-1) }}
            aria-label="이전 사진"
            disabled={open === 0}
          >
            ‹
          </button>
          <div
            ref={drag.frameRef}
            className={styles.lightboxImgWrap}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={drag.onDown}
            onPointerMove={(e) => drag.onMove(e, true)}
            onPointerUp={drag.onUp}
            onPointerCancel={drag.onCancel}
          >
            <Image
              src={`${PHOTOS[open].base}-full.webp`}
              alt={PHOTOS[open].alt}
              fill
              sizes="92vw"
              className={styles.lightboxImg}
              draggable={false}
            />
          </div>
          <button
            type="button"
            className={`${styles.lbNav} ${styles.lbNext}`}
            onClick={(e) => { e.stopPropagation(); go(1) }}
            aria-label="다음 사진"
            disabled={open === n - 1}
          >
            ›
          </button>
          <span className={styles.lbCounter}>{open + 1} / {n}</span>
        </div>
      )}
    </div>
  )
}
