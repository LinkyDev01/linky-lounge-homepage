"use client"

import { useCallback, useRef, useState } from "react"
import { ONE_DAY_MEETINGS } from "../one-day-config"
import styles from "../home.module.css"
import h from "./hosts.module.css"

/**
 * 다른 모임 샘플 — /hosts 본문 (2026-09-10, 운영자 "다른 모임 샘플은 클릭은 되지 않게 모임 가로슬라이드 없이
 * 레이지데이 북클럽처럼 옆으로 쭉 넘길 수 있는 형태로").
 * · 카드 = 레이지데이 북클럽 진열(ClubAside 의 shopItem)과 같은 구성: 포스터 · 카테고리 · 이름.
 * · 목록은 **세 모임만**(운영자 2026-09-10 "북클럽 말고 불안을넘어, 비로소 나를, 원데이토크(한 가지만) 세 가지만"):
 *   불안을 건너 고요로... · 비로소, 나를 쥐어짜지 않는 법 · 원데이 토크 하나(브람스 — 트리 진열 순서상 첫 원데이 토크,
 *   교체는 SAMPLE_SLUGS 한 줄). 카드 값은 one-day-config 그대로 — 여기 다시 적지 않는다.
 * · 링크 없음 — 카드 어디를 눌러도 이동하지 않는다(마크업에 a 가 없다). **넘김은 된다**: 가로 스크롤(터치·트랙패드)
 *   + 마우스 드래그 + 도트 버튼(누르면 그 카드로). 도트 활성 판정은 WorkroomHome.useDragCarousel 과 같은 진행률 방식.
 */
const SAMPLE_SLUGS = ["anxiety-to-calm", "not-squeezing-myself", "brahms"] as const
const SAMPLES = SAMPLE_SLUGS.flatMap((slug) => {
  const m = ONE_DAY_MEETINGS.find((x) => x.slug === slug)
  return m ? [{ id: m.slug, cat: m.catLabel, name: m.title, src: m.thumbnail }] : []
})

export function HostsSamples() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false })

  const onScroll = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const n = el.children.length
    const max = el.scrollWidth - el.clientWidth
    setActive(max <= 0 ? 0 : Math.min(n - 1, Math.round((el.scrollLeft / max) * (n - 1))))
  }, [])

  return (
    <div className={h.samples}>
      <div
        ref={trackRef}
        className={h.samplesTrack}
        onScroll={onScroll}
        onPointerDown={(e) => {
          const el = trackRef.current
          if (!el) return
          drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false }
        }}
        onPointerMove={(e) => {
          const el = trackRef.current
          if (!el || !drag.current.down) return
          const dx = e.clientX - drag.current.startX
          if (!drag.current.moved && Math.abs(dx) > 4) {
            drag.current.moved = true
            el.setPointerCapture(e.pointerId)
          }
          if (drag.current.moved) el.scrollLeft = drag.current.startLeft - dx
        }}
        onPointerUp={() => {
          drag.current.down = false
        }}
        onPointerCancel={() => {
          drag.current.down = false
        }}
      >
        {SAMPLES.map((s) => (
          <article key={s.id} className={h.sampleItem} aria-label={s.name}>
            <figure className={h.sampleFigure}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt="" draggable={false} />
            </figure>
            <div className={h.sampleBody}>
              <div className={styles.itemCat}>{s.cat}</div>
              <div className={h.sampleName}>{s.name}</div>
            </div>
          </article>
        ))}
      </div>
      <div className={h.samplesDots}>
        {SAMPLES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`${h.sampleDot} ${i === active ? h.sampleDotOn : ""}`}
            aria-label={`${i + 1}번째 모임 보기`}
            onClick={() => {
              const el = trackRef.current
              const card = el?.children[i] as HTMLElement | undefined
              if (!el || !card) return
              el.scrollTo({ left: card.offsetLeft - 15, behavior: "smooth" })
            }}
          />
        ))}
      </div>
    </div>
  )
}
