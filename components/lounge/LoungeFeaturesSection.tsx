"use client"

import { AnimatedSection } from "@/components/animated-section"
import { SectionHeader, FeatureCard } from "@/components/common"
import { LOUNGE_FEATURES } from "@/constants/lounge"

export function LoungeFeaturesSection() {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeader
            label="What We Offer"
            title=""
            labelColor="rose"
          />
        </AnimatedSection>

        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8">
          {LOUNGE_FEATURES.map((feature, index) => (
            <AnimatedSection key={index} delay={index * 100}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                accentColor="sage"
              />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
