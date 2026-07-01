"use client"
import { useEffect } from "react"

/**
 * URL 해시(#book 등)로 공유된 링크를 열었을 때, 전역 scroll-behavior:smooth와
 * 이미지 로딩으로 인한 레이아웃 흔들림 없이 해당 섹션으로 즉시 이동시킨다.
 */
export function HashScrollOnLoad() {
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return

    const jump = () => {
      const el = document.getElementById(hash)
      if (!el) return
      const prev = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = "auto"
      el.scrollIntoView({ behavior: "auto", block: "start" })
      document.documentElement.style.scrollBehavior = prev
    }

    requestAnimationFrame(() => requestAnimationFrame(jump))
    const retry = window.setTimeout(jump, 400)
    return () => window.clearTimeout(retry)
  }, [])

  return null
}
