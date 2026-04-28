"use client"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import { useRef, type ReactNode } from "react"

type Props = {
  children: ReactNode
  className?: string
  yRange?: [number, number]
  rotateRange?: [number, number]
}

export function ParallaxFloat({ children, className, yRange = [40, -120], rotateRange = [-10, 25] }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], yRange)
  const rotate = useTransform(scrollYProgress, [0, 1], rotateRange)
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y, rotate }}>
        {children}
      </motion.div>
    </div>
  )
}
