"use client"
import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState, type ReactNode } from "react"
import fb from "./reveal-fallback.module.css"

/** JS가 죽었을 때(청크 404·웹뷰 실패) SSR opacity:0이 영구화되는 것 방지 —
 *  마운트 전까지만 CSS 폴백 클래스를 얹고, 하이드레이션 성공 시 즉시 제거 */
function useRevealFallback() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated ? "" : ` ${fb.fallback}`
}

type Props = {
  children: ReactNode
  delay?: number
  duration?: number
  y?: number
  className?: string
  once?: boolean
}

export function FadeUp({ children, delay = 0, duration = 0.6, y = 24, className, once = true }: Props) {
  const reduce = useReducedMotion()
  const fallback = useRevealFallback()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={(className || "") + fallback}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
