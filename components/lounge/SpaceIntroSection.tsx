"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

function AnimatedText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay])

  return (
    <span ref={ref} className="inline-flex flex-wrap justify-center">
      {text.split("").map((char, index) => (
        <span
          key={index}
          className={`inline-block ${isVisible ? "animate-char" : "opacity-0"}`}
          style={{
            animationDelay: isVisible ? `${index * 80}ms` : "0ms",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  )
}

export function SpaceIntroSection() {
  const [showLogo, setShowLogo] = useState(false)
  const [showLine, setShowLine] = useState(false)

  useEffect(() => {
    const textDelay = "Where we link,".length * 80 + 600
    const logoTimer = setTimeout(() => setShowLogo(true), textDelay)
    const lineTimer = setTimeout(() => setShowLine(true), textDelay + 400)
    return () => {
      clearTimeout(logoTimer)
      clearTimeout(lineTimer)
    }
  }, [])

  return (
    <section className="relative h-[70vh] flex items-center justify-center bg-[#d5d2ce]">
      {/* Background Image with rounded bottom */}
      <div className="absolute bg-foreground h-[65vh] inset-0 overflow-hidden rounded-b-[3rem] sm:rounded-b-[4rem] md:rounded-b-[5rem]">
        {/* <Image
          src="/linky-lounge/gallary/intro.jpg"
          alt="링키라운지 공간"
          fill
          className="object-cover saturate-50 brightness-75"
          priority
        /> */}
        <div className="absolute inset-0"/>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 text-center text-white px-4 mb-32">
        <p className="text-2xl sm:text-3xl md:text-4xl font-playfair font-semibold italic tracking-wide mb-8" style={{ perspective: "1000px" }}>
          <AnimatedText text="Where we link" />
        </p>

        {/* Decorative Line */}
        <div className="flex justify-center mb-8">
          <div
            className={`h-px bg-white/60 transition-all duration-700 ${
              showLine ? "w-24 opacity-100 animate-line-expand" : "w-0 opacity-0"
            }`}
          />
        </div>

        {/* Logo */}
        <div
          className={`flex justify-center transition-all duration-1000 ease-out ${
            showLogo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Image
            src="/logos/linky_lounge_logo_white_text.svg"
            alt="Linky Lounge"
            width={200}
            height={189}
            className="w-32 sm:w-40 md:w-48 h-auto"
          />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-24 left-1/2 -translate-x-1/2 z-10 transition-all duration-1000 ${
          showLogo ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col items-center gap-2 text-white/70">
          <span className="md:hidden text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/70 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  )
}
