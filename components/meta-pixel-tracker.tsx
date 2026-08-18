"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { trackStandard, trackCustom } from "@/lib/meta-pixel"

export function MetaPixelTracker() {
  const pathname = usePathname()
  const firedDepths = useRef(new Set<number>())
  // 첫 경로는 layout.tsx 의 인라인 스니펫이 파싱 시점에 이미 쐈다.
  // 여기서 또 쏘면 첫 로드가 두 번 집계된다 — 두 번째 경로부터만 담당한다.
  const skipFirst = useRef(true)

  /**
   * 광고 클릭 ID 를 1st-party 쿠키로 보존 (2026-08-18, 전환 API 준비).
   *
   * 평소엔 fbevents.js 가 URL 의 `fbclid` 를 읽어 `_fbc` 쿠키를 심는다. 그런데
   * 차단기·추적 방지가 있으면 그 스크립트가 아예 안 뜨고, 그러면 서버 전송에도
   * "어느 광고에서 왔나"가 빠진다 — CAPI 로 메우려던 바로 그 구간이 무의미해진다.
   * 우리 코드는 차단당하지 않으므로 여기서 같은 형식(`fb.1.<ms>.<fbclid>`)으로
   * 사본을 남긴다. lib/meta-pixel.ts 가 `_fbc` 가 없을 때 이걸 폴백으로 쓴다.
   *
   * ⚠ Meta 의 클릭 ID 유효기간과 맞춰 90일. `_fbc` 가 이미 있으면 건드리지 않는다.
   */
  useEffect(() => {
    try {
      const fbclid = new URLSearchParams(window.location.search).get("fbclid")
      if (!fbclid) return
      if (document.cookie.includes("_fbc=")) return
      const value = `fb.1.${Date.now()}.${fbclid}`
      document.cookie = `lz_fbc=${encodeURIComponent(value)}; path=/; max-age=${90 * 24 * 60 * 60}; SameSite=Lax`
    } catch {
      /* 추적 보조 기능이라 실패해도 화면에 영향을 주지 않는다 */
    }
  }, [pathname])

  // SPA 라우트 변경 시 PageView 이벤트 발송 (첫 로드분은 스니펫이 담당)
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false
      return
    }
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
              content_type: "section",
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
