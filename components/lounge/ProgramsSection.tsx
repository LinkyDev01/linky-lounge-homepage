"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ArrowRight, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"
import { SectionHeader } from "@/components/common"

const PROGRAMS = [
  // {
  //   id: 1,
  //   title: "회화 스터디",
  //   image: "/linky-lounge/foreign_class.png",
  //   schedule: "매주 월화 저녁 1시간 반 진행",
  //   description: "선생님과 함께, 웃으며 배우는 회화 스터디",
  //   link: "/study-foreign",
  // },
  // {
  //   id: 2,
  //   title: "와인 한 잔",
  //   image: "/linky-lounge/wine_party.png",
  //   schedule: "매주 토 3시간 진행",
  //   description: "와인과 함께 나누는 다정함 속깊은 대화",
  //   link: "https://linky-wine-party01.vercel.app/",
  // },
  {
    id: 3,
    title: "몰입의 밤",
    image: "/linky-lounge/focus_night.png",
    schedule: "매주 목 3시간 진행",
    description: "디지털 디톡스, 나의 내면에 접속하는 시간",
    link: "https://focus-night.vercel.app/",
  },
  // {
  //   id: 4,
  //   title: "감튀소개팅",
  //   image: "/linky-lounge/potato_meeting.png",
  //   schedule: "매주 금 저녁 진행",
  //   description: "짭짤한 감튀와 함께 찾는 달콤한 인연",
  //   link: "https://tally.so/r/lbrdkN",
  // },
  {
    id: 5,
    title: "레이지데이 북클럽",
    image: "/linky-lounge/book-club.png",
    schedule: "격주 3시간 진행",
    description: "책과 함께 시작하는 만남",
    link: "/lazyday",
  },
]

const ALL_ITEMS = [
  ...PROGRAMS,
  { id: 6, isRecommendation: true as const },
]

export function ProgramsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  // 터치 방향 감지용 refs (native listener에서 사용)
  const touchStartXRef = useRef(0)
  const touchStartYRef = useRef(0)
  const isDraggingRef = useRef(false)
  const dragOffsetRef = useRef(0)
  const directionRef = useRef<"horizontal" | "vertical" | null>(null)

  const len = ALL_ITEMS.length

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // 모바일 터치: passive: false 네이티브 리스너로 방향 감지 후 가로만 차단
  useEffect(() => {
    const el = sliderRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      isDraggingRef.current = true
      directionRef.current = null
      touchStartXRef.current = e.touches[0].clientX
      touchStartYRef.current = e.touches[0].clientY
      dragOffsetRef.current = 0
      setIsDragging(true)
      setDragOffset(0)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return

      const dx = e.touches[0].clientX - touchStartXRef.current
      const dy = e.touches[0].clientY - touchStartYRef.current

      // 8px 이상 움직였을 때 방향 확정
      if (!directionRef.current) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          // 수평에서 ±30° 이내만 가로로 인정
          const angle = Math.abs(Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI)
          directionRef.current = angle < 30 ? "horizontal" : "vertical"
        }
        return
      }

      if (directionRef.current === "horizontal") {
        e.preventDefault() // 가로 드래그 시 페이지 스크롤 차단
        dragOffsetRef.current = dx
        setDragOffset(dx)
      }
      // 세로 방향이면 브라우저 기본 스크롤에 맡김
    }

    const onTouchEnd = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false

      if (directionRef.current === "horizontal") {
        const offset = dragOffsetRef.current
        if (offset > 80) {
          setActiveIndex((prev) => (prev - 1 + ALL_ITEMS.length) % ALL_ITEMS.length)
        } else if (offset < -80) {
          setActiveIndex((prev) => (prev + 1) % ALL_ITEMS.length)
        }
      }

      directionRef.current = null
      dragOffsetRef.current = 0
      setIsDragging(false)
      setDragOffset(0)
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
    }
  }, [])

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + len) % len)
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % len)
  }

  // 마우스 드래그 핸들러 (데스크탑)
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setDragOffset(e.clientX - startX)
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

  // 원형 거리 계산 (무한 루프를 위해)
  const getCircularDiff = (index: number) => {
    let diff = index - activeIndex

    // 최단 거리로 계산 (무한 루프)
    if (diff > len / 2) diff -= len
    if (diff < -len / 2) diff += len

    return diff
  }

  const getItemStyle = (index: number) => {
    const diff = getCircularDiff(index)
    const offsetX = dragOffset * 0.3
    const spacing = isMobile ? 140 : 300

    // 양쪽에 1개씩만 표시
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
    const scale = diff === 0 ? 1 : isMobile ? 0.75 : 0.85
    const rotateY = diff * -3
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
    <section className="py-12 bg-[#d5d2ce] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeader
            label="Programs We Offer"
            title=""
            description=""
            labelColor="sage"
          />
        </AnimatedSection>

        <AnimatedSection delay={200}>
          {/* 3D Slider */}
          <div
            ref={sliderRef}
            className="relative h-[580px] md:h-[620px] cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            {/* Cards */}
            <div className="relative h-full">
              {ALL_ITEMS.map((item, index) => (
                <div
                  key={item.id}
                  className="absolute left-1/2 top-0 w-[240px] md:w-[280px]"
                  style={getItemStyle(index)}
                  onClick={() => !isDragging && setActiveIndex(index)}
                >
                  {'isRecommendation' in item
                    ? <RecommendationCard isActive={index === activeIndex} />
                    : <ProgramCard program={item} isActive={index === activeIndex} />
                  }
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={handlePrev}
              className="absolute left-2 md:left-8 top-[40%] -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:scale-110 transition-all duration-300"
              aria-label="이전"
            >
              <ChevronLeft className="w-10 h-10" strokeWidth={2} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 md:right-8 top-[40%] -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:scale-110 transition-all duration-300"
              aria-label="다음"
            >
              <ChevronRight className="w-10 h-10" strokeWidth={2} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
              {ALL_ITEMS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === index
                    ? "bg-[#00c896] w-6"
                    : "bg-gray-400 hover:bg-gray-500"
                    }`}
                  aria-label={`슬라이드 ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>

      </div>
    </section>
  )
}

interface ProgramCardProps {
  program: (typeof PROGRAMS)[number]
  isActive: boolean
}

function RecommendationCard({ isActive }: { isActive: boolean }) {
  return (
    <div className="programs-card bg-white rounded-2xl overflow-hidden shadow-2xl">
      <div className="relative aspect-[3/4] bg-gradient-to-br from-[#a08060] to-[#5c3d2e] flex flex-col items-center justify-center p-6">
        <p className="text-white/60 text-xs tracking-widest uppercase mb-6">Find your fit</p>
        <p className="text-white text-2xl font-bold text-center leading-snug mb-3">
          고민되시나요?
        </p>
        <p className="text-white/80 text-sm text-center leading-relaxed">
          어떤 모임이<br />나에게 맞을지<br />알려드릴게요
        </p>
      </div>
      <div className="p-5 bg-white">
        <h3 className="text-xl font-bold text-gray-900 mb-2">모임 추천받기</h3>
        <p className="text-gray-500 text-sm mb-4">나에게 딱 맞는 모임을 찾아보세요</p>
        <a
          href="https://linky-intro.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center w-full py-2.5 px-4 bg-[#00c896] hover:bg-[#00b085] text-white text-sm font-medium rounded-xl transition-all duration-300 ${isActive ? "opacity-100" : "opacity-70"}`}
          onClick={(e) => e.stopPropagation()}
        >
          추천받으러 가기
          <ArrowRight className="ml-2 w-4 h-4" />
        </a>
      </div>
    </div>
  )
}

function ProgramCard({ program, isActive }: ProgramCardProps) {
  return (
    <div className="programs-card bg-white rounded-2xl overflow-hidden shadow-2xl">
      {/* Poster Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={program.image}
          alt={program.title}
          fill
          className="object-cover"
          draggable={false}
        />
      </div>

      {/* Content Below Image */}
      <div className="p-5 bg-white">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{program.title}</h3>

        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{program.schedule}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{program.description}</p>

        {/* CTA Button */}
        <a
          href={program.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center w-full py-2.5 px-4 bg-[#00c896] hover:bg-[#00b085] text-white text-sm font-medium rounded-xl transition-all duration-300 ${isActive ? "opacity-100" : "opacity-70"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          자세히 알아보기
          <ArrowRight className="ml-2 w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
