"use client"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  className?: string
  yRange?: [number, number]
  rotateRange?: [number, number]
}

/**
 * 페이지 전체 스크롤 진행률(0→1)에 따라 자식 요소를 y·rotate로 천천히 이동시킨다.
 * divider처럼 "한 자리에 떠 있되 스크롤 동안 살짝 흔들리는" 효과용.
 *
 * useScroll에 target을 주지 않으면 자동으로 root scroll(window)을 추적한다.
 * target=ref 방식은 ref 요소가 viewport를 통과하는 짧은 구간만 progress가 바뀌어서
 * 작은 divider에서는 효과가 거의 보이지 않으므로 사용 X.
 */
export function ParallaxFloat({ children, className, yRange = [80, -240], rotateRange = [-12, 28] }: Props) {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], yRange)
  const rotate = useTransform(scrollYProgress, [0, 1], rotateRange)
  return (
    <div className={className}>
      <motion.div style={reduce ? undefined : { y, rotate }}>
        {children}
      </motion.div>
    </div>
  )
}
