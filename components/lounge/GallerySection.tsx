"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"
import { SectionHeader } from "@/components/common"
import { cn } from "@/lib/utils"

const GALLERY_IMAGES = [
  { src: "/linky-lounge/gallary/main.jpg", alt: "메인 공간", size: "large" },
  { src: "/linky-lounge/gallary/g.jpg", alt: "라운지 공간 G", size: "small" },
  { src: "/linky-lounge/gallary/c.jpg", alt: "라운지 공간 C", size: "small" },
  { src: "/linky-lounge/gallary/d.jpg", alt: "라운지 공간 D", size: "small" },
  { src: "/linky-lounge/gallary/e.jpg", alt: "라운지 공간 E", size: "small" },
]

export function GallerySection() {
  const [isMobile, setIsMobile] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const len = GALLERY_IMAGES.length

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + len) % len)
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % len)
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    setStartX(clientX)
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const diff = clientX - startX
    setDragOffset(diff)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (dragOffset > 80) {
      handlePrev()
    } else if (dragOffset < -80) {
      handleNext()
    }
    setDragOffset(0)
  }

  const getCircularDiff = (index: number) => {
    let diff = index - activeIndex
    if (diff > len / 2) diff -= len
    if (diff < -len / 2) diff += len
    return diff
  }

  const getItemStyle = (index: number) => {
    const diff = getCircularDiff(index)
    const offsetX = dragOffset * 0.3
    const spacing = 180

    if (Math.abs(diff) > 1) {
      return {
        transform: `translateX(calc(-50% + ${diff > 0 ? 400 : -400}px)) scale(0.7)`,
        zIndex: 0,
        opacity: 0,
        pointerEvents: "none" as const,
        transition: isDragging ? "none" : "all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
      }
    }

    const baseTranslate = diff * spacing + offsetX
    const scale = diff === 0 ? 1 : 0.85
    const rotateY = diff * -5
    const zIndex = diff === 0 ? 10 : 5
    const blur = diff === 0 ? 0 : 2
    const opacity = diff === 0 ? 1 : 0.5

    return {
      transform: `translateX(calc(-50% + ${baseTranslate}px)) scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`,
      zIndex,
      filter: blur > 0 ? `blur(${blur}px)` : "none",
      opacity,
      transition: isDragging ? "none" : "all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
    }
  }

  return (
    <section className="py-20 bg-[#f8f7f5]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeader
            label="Our Space"
            title=""
            description=""
            labelColor="sage"
          />
        </AnimatedSection>

        {/* 모바일: 슬라이더 */}
        {isMobile ? (
          <div
            ref={sliderRef}
            className="relative h-[280px] mt-10 cursor-grab active:cursor-grabbing select-none overflow-hidden"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <div className="relative h-full">
              {GALLERY_IMAGES.map((image, index) => (
                <div
                  key={`${image.src}-${index}`}
                  className="absolute left-1/2 top-0 w-[300px]"
                  style={getItemStyle(index)}
                  onClick={() => !isDragging && setActiveIndex(index)}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="300px"
                      draggable={false}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-2">{image.alt}</p>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={handlePrev}
              className="absolute left-0 top-[40%] -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all duration-300"
              aria-label="이전"
            >
              <ChevronLeft className="w-8 h-8" strokeWidth={2} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 top-[40%] -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all duration-300"
              aria-label="다음"
            >
              <ChevronRight className="w-8 h-8" strokeWidth={2} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
              {GALLERY_IMAGES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeIndex === index
                      ? "bg-sage w-6"
                      : "bg-gray-400 hover:bg-gray-500"
                  }`}
                  aria-label={`슬라이드 ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* 데스크탑: 그리드 레이아웃 */
          <div className="grid grid-cols-4 auto-rows-[200px] gap-0 border-l border-t border-black/10 mt-10">
            {GALLERY_IMAGES.map((image, index) => {
              const gridConfigs = [
                "col-span-2 row-span-2",
                "col-span-1 row-span-1",
                "col-span-1 row-span-1",
                "col-span-1 row-span-1",
                "col-span-1 row-span-1",
                "col-span-1 row-span-1",
                "col-span-1 row-span-1",
                "col-span-2 row-span-1",
              ]

              return (
                <div
                  key={`${image.src}-${index}`}
                  className={cn(
                    "relative group overflow-hidden bg-white border-r border-b border-black/10",
                    gridConfigs[index] || "col-span-1"
                  )}
                >
                  <div className="relative h-full">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 1200px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}