"use client"
import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState, type ReactNode } from "react"
import fb from "./reveal-fallback.module.css"

type Props = {
  children: ReactNode
  /** 등장 지연(초) */
  delay?: number
  /** 등장 길이(초). 길수록 더 느긋하게 번진다 */
  duration?: number
  /** 시작 블러 강도(px) */
  blur?: number
  /** 시작 시 y 오프셋(px) */
  y?: number
  /** 도착 시 최종 불투명도 (로고처럼 0.8로 은은하게 둘 수 있음) */
  finalOpacity?: number
  /** 시작 스케일 (1.04 → 1 처럼 잉크가 모이는 느낌) */
  fromScale?: number
  className?: string
  once?: boolean
}

/**
 * 흐릿함 → 선명함으로 떠오르는 리빌.
 * "사유가 또렷해진다"는 메시지와 맞닿은 키 모먼트 전용.
 * prefers-reduced-motion 시 모션 없이 최종 상태만 렌더한다.
 */
export function BlurReveal({
  children,
  delay = 0,
  duration = 0.9,
  blur = 8,
  y = 0,
  finalOpacity = 1,
  fromScale = 1,
  className,
  once = true,
}: Props) {
  const reduce = useReducedMotion()
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  const fallback = hydrated ? "" : ` ${fb.fallback}`
  if (reduce) {
    return (
      <div className={className} style={{ opacity: finalOpacity }}>
        {children}
      </div>
    )
  }
  return (
    <motion.div
      className={(className || "") + fallback}
      initial={{ opacity: 0, filter: `blur(${blur}px)`, y, scale: fromScale }}
      whileInView={{ opacity: finalOpacity, filter: "blur(0px)", y: 0, scale: 1 }}
      viewport={{ once, amount: 0.4 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
