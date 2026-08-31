"use client"

/**
 * 스크롤 거북이 (라운드 132, 기획안 ⑨) — **홈 전용** 프리뷰.
 *
 * 화면 하단 고정 헤어라인 위에서 거북이가 **스크롤 진행률만큼** 전진한다.
 * 끝까지 읽으면 우측 결승선(캘린더 트랙과 같은 파선 이중선)을 통과한다 — 그게 전부다.
 * 축하도 문구도 없다 (무표정 원칙).
 *
 * · 스프라이트·결승선은 캘린더 거북이 트랙의 것을 그대로 재사용 — 신규 도형 0개.
 * · 걸음(gait)은 **스크롤 중에만** 재생 — 멈추면 거북이도 선다 (스크롤이 곧 거북이의 시간).
 * · pointer-events 없음 — 콘텐츠 조작을 일절 방해하지 않는다.
 * · prefers-reduced-motion: 위치 매핑은 유지(애니메이션이 아니라 상태 표시), 걸음만 정지.
 * · 문서가 한 화면이면(스크롤 없음) 통째로 숨긴다.
 */

import { useEffect, useRef } from "react"
import styles from "./scroll-turtle.module.css"

const TURTLE_W = 48 // 렌더 폭 (스프라이트 140 × 0.345)
const WALK_HOLD = 220 // 마지막 스크롤 후 걸음을 멈추기까지 (ms)

export function ScrollTurtle() {
  const stripRef = useRef<HTMLDivElement>(null)
  const laneRef = useRef<HTMLDivElement>(null)
  const turtleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const strip = stripRef.current
    const lane = laneRef.current
    const turtle = turtleRef.current
    if (!strip || !lane || !turtle) return

    let raf = 0
    let walkTimer: ReturnType<typeof setTimeout> | null = null

    const update = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 4) {
        strip.style.visibility = "hidden"
        return
      }
      strip.style.visibility = "visible"
      const p = Math.min(1, Math.max(0, window.scrollY / max))
      const dist = Math.max(0, lane.clientWidth - TURTLE_W)
      turtle.style.transform = `translateX(${(p * dist).toFixed(1)}px)`
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
      // 스크롤 중에만 걷는다 — 멈추면 WALK_HOLD 뒤 정지
      turtle.dataset.walking = "true"
      if (walkTimer) clearTimeout(walkTimer)
      walkTimer = setTimeout(() => {
        delete turtle.dataset.walking
      }, WALK_HOLD)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
      if (walkTimer) clearTimeout(walkTimer)
    }
  }, [])

  return (
    <div className={styles.strip} ref={stripRef} aria-hidden>
      <div className={styles.lane} ref={laneRef}>
        {/* 결승선 — 캘린더 트랙과 같은 이중선 (크림 굵은 선 + 잉크 파선) */}
        <span className={styles.finish} />
        <span className={styles.finishDash} />
        <div className={styles.turtle} ref={turtleRef}>
          <div className={styles.sprite} />
        </div>
      </div>
    </div>
  )
}
