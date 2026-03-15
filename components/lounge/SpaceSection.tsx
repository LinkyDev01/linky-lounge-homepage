"use client"

import { ArrowRight } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"
import { SectionHeader, CTAButton } from "@/components/common"
import { SPACE_INFO } from "@/constants/lounge"

export function SpaceSection() {
  return (
    <section className="py-12 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeader
            label="Our Space"
            title="감각적인 인테리어와 유연한 공간 구성"
            labelColor="rose"
          />
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection>
            <div className="aspect-[4/3] rounded-3xl overflow-hidden group">
              <img
                src="/landing01.png"
                alt="링키라운지 내부"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200} direction="right">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">{SPACE_INFO.name}</h3>
                <p className="text-sage font-medium">
                  수용 인원: {SPACE_INFO.capacity}
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {SPACE_INFO.description}
              </p>
              <ul className="space-y-3">
                {SPACE_INFO.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-sage" />
                    <span className="text-foreground">{highlight}</span>
                  </li>
                ))}
              </ul>
              <CTAButton ctaVariant="sage">
                공간 둘러보기
                <ArrowRight className="ml-2 w-4 h-4" />
              </CTAButton>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
