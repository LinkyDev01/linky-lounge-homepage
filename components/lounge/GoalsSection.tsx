"use client"

import { AnimatedSection } from "@/components/animated-section"
import { LOUNGE_GOALS } from "@/constants/lounge"

export function GoalsSection() {
  return (
    <section className="py-24 bg-sage">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white text-balance">
                또 오고 싶은 공간,
                <br />
                사람을 만나는 이유가 있는 공간
              </h2>
              <p className="text-white/80 leading-relaxed text-lg">
                링키라운지는 단순히 공간을 제공하는 것이 아닌, 사람들이 서로
                연결되고 의미 있는 경험을 만들어갈 수 있는 커뮤니티를 구축합니다.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 gap-4">
            {LOUNGE_GOALS.map((item, index) => (
              <AnimatedSection key={index} delay={index * 100} direction="fade">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] group">
                  <item.icon className="w-8 h-8 text-white mb-4 transition-transform group-hover:scale-110" />
                  <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                  <p className="text-white/70 text-sm">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
