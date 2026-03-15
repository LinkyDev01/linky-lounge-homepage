"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AnimatedSection } from "@/components/animated-section"
import { CTAButton } from "@/components/common"

export function LoungeCTASection() {
  return (
    <section className="py-24">
      <AnimatedSection className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-balance">
          링키라운지에서
          <br />
          특별한 만남을 시작하세요
        </h2>
        <p className="text-muted-foreground mb-8">
          공간 예약부터 프로그램 참여까지, 링키라운지가 함께합니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="https://naver.me/FLebi2a9" target="_blank" rel="noopener noreferrer">
            <CTAButton size="lg" ctaVariant="sage">
              공간 예약하기
              <ArrowRight className="ml-2 w-4 h-4" />
            </CTAButton>
          </a>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="transition-transform hover:scale-105 bg-transparent"
          >
            <Link href="https://www.instagram.com/linky_lounge/">문의하기</Link>
          </Button>
        </div>
      </AnimatedSection>
    </section>
  )
}
