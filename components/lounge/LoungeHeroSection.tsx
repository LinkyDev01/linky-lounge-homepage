"use client"

import { ArrowRight } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"
import { CTAButton } from "@/components/common"
import { Button } from "@/components/ui/button"

export function LoungeHeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sage-light via-transparent to-rose-light" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-sage/20 rounded-full blur-3xl animate-pulse" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <AnimatedSection>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-sage animate-pulse" />
                <div className="w-4 h-4 rounded-full bg-rose animate-pulse [animation-delay:0.2s]" />
                <div className="w-4 h-4 rounded-full bg-mustard animate-pulse [animation-delay:0.4s]" />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                사람을 잇는
                <br />
                <span className="text-sage">오프라인 커뮤니티</span>
                <br />
                공간
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                링키라운지는 단순한 파티룸이 아닌, '목적 있는 만남'이 자연스럽게
                이루어지는 커뮤니티 라운지입니다. 사람들이 "또 오고 싶은 공간",
                "사람을 만나는 이유가 있는 공간"을 만드는 것이 우리의 목표입니다.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="https://naver.me/FLebi2a9" target="_blank" rel="noopener noreferrer">
                  <CTAButton size="lg" ctaVariant="sage">
                    공간 예약하기
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </CTAButton>
                </a>
              </div>
            </AnimatedSection>
          </div>

          <AnimatedSection direction="right" delay={200}>
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden group">
                <img
                  src="/landing02.png"
                  alt="링키라운지 메인"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-mustard text-white rounded-2xl p-4 shadow-lg animate-bounce [animation-duration:2s]">
                <p className="font-bold text-2xl">10+</p>
                <p className="text-sm">성공적인 모임</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
