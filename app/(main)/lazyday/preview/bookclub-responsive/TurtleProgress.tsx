"use client"

import { useEffect, useRef } from "react"
import t from "./turtle-progress.module.css"

/**
 * 거북이 진행률 — 우측 주황 점(SectionIndicator) 대체안, **북클럽 프리뷰 전용**
 * (운영자 2026-08-12: "거북이는 레이지클럽이 아니라 레이지데이 북클럽에 둘 거였으니
 *  북클럽 프리뷰에만").
 *
 * · 하단 고정 CTA 바로 위 얇은 레인에 살고, 스크롤 진행률을 따라 좌→우로 달린다
 *   ("구간별로 달려가도록" — 섹션 경계에서 잠깐 숨을 고르고 다음 구간으로 달린다)
 * · 역방향(위로 스크롤)이면 **좌우 대칭**으로 뒤집어 왼쪽을 보고 달린다
 * · 지나온 경로는 팔레트 주황(#d2691e)으로 채워진다 (데모의 그린 폐기)
 * · 세로를 거의 먹지 않아야 해서 거북이는 데모(48×28)보다 작은 30×17.5,
 *   레인 높이는 22px (운영자 "바가 너무 얇아서 안 보이니 조금 더 두껍게" → 트랙 3px)
 *
 * 성능: 스크롤마다 setState 하지 않는다 — rAF 로 묶어 CSS 변수(--p)만 갱신하고,
 * 트랙·거북이는 그 변수로만 움직인다 (리렌더 0회).
 */
export function TurtleProgress() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // 섹션 경계 = "구간". 경계에 닿으면 잠깐 멈췄다 다음 구간으로 달리는 느낌을 준다
    const SECTIONS = ["book", "feature", "howto", "schedule", "reviews", "faq"]
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let raf = 0
    let lastP = -1
    let lastY = window.scrollY

    const read = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const y = window.scrollY
      const raw = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0

      // 구간화 — 섹션 경계 사이를 0~1 로 나눠 이어 붙인다. 경계 근처에서는 진행이
      // 잠시 더뎌져(스냅) 구간을 하나씩 통과하는 인상이 된다
      let p = raw
      const marks = SECTIONS.map((id) => {
        const el = document.getElementById(id)
        return el ? (el.getBoundingClientRect().top + y - window.innerHeight * 0.5) / (max || 1) : null
      }).filter((v): v is number => v !== null && v > 0 && v < 1)
      for (const m of marks) {
        const d = raw - m
        if (Math.abs(d) < 0.02) {
          // 경계 ±2% 구간에서는 진행을 절반으로 눌러 '숨 고르기'
          p = m + d * 0.5
          break
        }
      }

      if (Math.abs(p - lastP) > 0.0005) {
        root.style.setProperty("--p", String(p))
        // 역방향이면 좌우 대칭 (운영자 지시)
        if (y < lastY - 1) root.dataset.dir = "back"
        else if (y > lastY + 1) root.dataset.dir = "fwd"
        // 움직이는 동안만 걷기 스프라이트를 돌린다
        root.dataset.walking = "true"
        clearTimeout(stopTimer)
        stopTimer = setTimeout(() => delete root.dataset.walking, 220)
        lastP = p
      }
      lastY = y
    }

    let stopTimer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      if (reduce) return read()
      if (!raf) raf = requestAnimationFrame(read)
    }

    read()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
      clearTimeout(stopTimer)
    }
  }, [])

  return (
    // 진입 홀드 동안엔 CTA 와 함께 숨는다 — 레인만 남으면 바닥에 선 하나가 뜬다
    <div className={t.lane} ref={rootRef} data-dir="fwd" data-lz-chrome="turtle" aria-hidden>
      <div className={t.track} />
      <div className={t.fill} />
      <div className={t.turtle}>
        <div className={t.sprite} />
      </div>
    </div>
  )
}
