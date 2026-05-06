"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { trackStandard, trackCustom } from "@/lib/meta-pixel"

export function MetaPixelTracker() {
  const pathname = usePathname()
  const firedDepths = useRef(new Set<number>())

  // SPA 라우트 변경 시 PageView 이벤트 발송
  useEffect(() => {
    trackStandard("PageView")
  }, [pathname])

  // 스크롤 depth 추적 (25%, 50%, 75%, 100%)
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return

      const percent = Math.round((scrollTop / docHeight) * 100)

      for (const threshold of [25, 50, 75, 100]) {
        if (percent >= threshold && !firedDepths.current.has(threshold)) {
          firedDepths.current.add(threshold)
          trackCustom("scroll_depth", {
            percent: threshold,
            page: window.location.pathname,
          })
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // 페이지 변경 시 스크롤 depth 리셋
  useEffect(() => {
    firedDepths.current.clear()
  }, [pathname])

  // 섹션 도달 추적 (IntersectionObserver)
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      "[data-track-section]"
    )
    if (sections.length === 0) return

    const fired = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const name = (entry.target as HTMLElement).dataset.trackSection
          if (entry.isIntersecting && name && !fired.has(name)) {
            fired.add(name)
            trackStandard("ViewContent", {
              content_name: name,
              content_type: "섹션",
            })
          }
        }
      },
      { threshold: 0.3 }
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname])

  return null
}
