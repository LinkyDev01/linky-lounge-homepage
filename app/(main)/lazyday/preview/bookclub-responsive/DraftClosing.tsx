"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { animate, createSpring } from "animejs"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SEASON, daysUntilDeadline } from "../../season-config"
import c from "./draft-closing.module.css"

/**
 * 초안 클로징 — 실사이트 ClosingCtaSection·BrandCloseSection 의 **초안 전용 사본**
 * (운영자 2026-08-12). 두 원본은 실사이트 컴포넌트라 직접 고치면 실사이트가 바뀐다.
 *
 * ① 제목: hero-motion 시안 ⑥(기수 카운트) 서식을 **그대로** 옮겨,
 *    구 "레이지데이 북클럽 4기를 모집합니다." 자리를 1 → 2 → 3 → 4기 모집 으로 대체.
 *    포스터가 아니라 **로고 바로 위**가 자리 (운영자 지정).
 * ② 로고: 운영자 제공 새 마크(검정 박스 + LAZYDAY BOOKCLUB 세로 라벨).
 *
 * 시안 ⑥ 타이밍 원본: 300ms 에 2, 480ms 에 3 (translateY 6→0 · opacity .4→1 · 160ms
 * · out(2)), 660ms 에 4 (scale 1.18→1 · 460ms · spring 240/12).
 * 다만 이 자리는 첫 화면이 아니라 **끝까지 내려야 보이는 곳**이라, 마운트가 아니라
 * 화면에 들어올 때 한 번 재생한다 (진입 1회 = 모션 원칙 M2).
 *
 * 2026-08-13 리타이밍 — 실 SeasonCountCta 와 같은 값 (쌍 동기화). 등비수열 가속.
 *
 * 2026-09-05 방향 정정 — 실 SeasonCountCta 와 같은 값 (쌍 동기화). 가속은 룰렛의
 * 반대라 감속으로 뒤집었다: 69 → 172 → 259ms + 스프링 340ms (운영자 "룰렛머신처럼
 * 수렴하는 형태로").
 */

const TARGET = Number((SEASON.name.match(/\d+/) ?? ["4"])[0]) // "4기" → 4

/** 룰렛 머신처럼 **수렴**한다 — 간격이 매 단계 벌어지며 마지막 기수에 내려앉는다 (2026-09-05).
 *  교체 시각을 easeIn 곡선(t^EASE_P)에 태우면 앞은 촘촘하고 뒤로 갈수록 느려진다.
 *  ⚠ 종전(2026-08-13)은 등비수열 **가속**(210→139→91ms)이라 수렴의 반대였고,
 *    3틱뿐이라 눈에는 등속으로 읽혔다 (운영자 "현재 등속으로 보이는데"). */
const SPIN_MS = 500 // "1" 노출 → 마지막 기수 등장까지
const EASE_P = 1.8 // 클수록 초반이 빠르고 끝이 더 느려진다
const SETTLE_MS = 340 // 마지막 기수 스프링 (내려앉는 순간)
const SWAP_MAX_MS = 130 // 중간 숫자 교체 모션 상한
const STEPS = Math.max(1, TARGET - 1)
/** k 번째 교체 시각 (k=1 → "2" 노출). 간격: 69 → 172 → 259ms */
const stepAt = (k: number) => Math.round(SPIN_MS * Math.pow(k / STEPS, EASE_P))
/** 교체 모션은 그 앞 간격보다 짧아야 다음 틱과 겹치지 않는다 */
const swapMs = (k: number) => Math.max(60, Math.min(SWAP_MAX_MS, stepAt(k) - stepAt(k - 1) - 10))

export function DraftSeasonCountCta() {
  const numRef = useRef<HTMLSpanElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [d, setD] = useState<number | null>(null)
  useEffect(() => {
    setD(daysUntilDeadline())
  }, [])

  // 모집 중일 때만 카운트 — 마감·조기마감이면 문장형 안내를 그대로 둔다
  const counting = SEASON.status !== "closedEarly" && !(d !== null && d < 0)

  useEffect(() => {
    const root = rootRef.current
    const el = numRef.current
    if (!root || !el || !counting) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = String(TARGET)
      return
    }
    // 화면에 들어올 때마다 재생 — 실 SeasonCountCta 와 같은 값 (쌍 동기화 2026-08-12,
    // 운영자 "1 2 3 4 넘어가는 애니메이션 누락되었어": 평생 1회는 스크롤 중에 발사돼 놓친다)
    let playing = false
    let timers: ReturnType<typeof setTimeout>[] = []
    const stop = () => {
      timers.forEach(clearTimeout)
      timers = []
      playing = false
    }
    const play = () => {
      playing = true
      el.textContent = "1"
      // 1 → 2 → 3 (짧게 튀어 오르며 교체 — 간격이 점점 벌어진다 = 느려지는 구간)
      for (let n = 2; n < TARGET; n++) {
        const k = n - 1
        timers.push(
          setTimeout(() => {
            el.textContent = String(n)
            animate(el, { translateY: [6, 0], opacity: [0.4, 1], duration: swapMs(k), ease: "out(2)" })
          }, stepAt(k)),
        )
      }
      // 마지막 기수 — 스프링으로 한 번 크게 앉는다
      timers.push(
        setTimeout(() => {
          el.textContent = String(TARGET)
          animate(el, {
            scale: [1.18, 1],
            duration: SETTLE_MS,
            ease: createSpring({ stiffness: 240, damping: 12 }),
          })
          playing = false
        }, stepAt(TARGET - 1)),
      )
    }
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting)
        if (visible && !playing) play()
        if (!visible) {
          stop()
          el.textContent = String(TARGET)
        }
      },
      { threshold: 0.6 },
    )
    io.observe(root)
    return () => {
      io.disconnect()
      stop()
    }
  }, [counting])

  return (
    <div className={c.closing} ref={rootRef}>
      {counting ? (
        <h2 className={c.title}>
          {/* 숫자만 교체 — 폭이 흔들리지 않게 min-width 를 준다 (시안 ⑥ 서식) */}
          <span className={c.num} ref={numRef}>
            {TARGET}
          </span>
          기 모집
        </h2>
      ) : (
        <p className={c.titleStatic}>
          {SEASON.status === "closedEarly"
            ? `${SEASON.name} 모집이 조기 마감되었습니다.`
            : `${SEASON.name} 모집이 마감되었습니다.`}
        </p>
      )}
      <p className={c.sub}>
        ({SEASON.periodLabel}) 정규 독서모임 4회 + 자유 독서모임 1회
        <br />
        서울 사당역 부근 ·{" "}
        <a href="https://naver.me/FLebi2a9" target="_blank" rel="noopener noreferrer" className={c.link}>
          링키라운지
        </a>
      </p>
    </div>
  )
}

/** 브랜드 클로즈 — 실사이트 BrandCloseSection 그대로 (운영자 2026-08-12 정정:
 *  "기존 하단 레이지데이 로고 원래대로 돌려" — 새 박스 로고는 푸터로 갔다) */
export function DraftBrandClose() {
  return (
    <section className={c.brand}>
      <BlurReveal duration={1.28} blur={14} fromScale={1.04} finalOpacity={0.8}>
        <div className={c.brandLogo}>
          <Image
            src="/linky-lounge/book-club/ldbc-logo-text.png"
            alt="레이지데이 북클럽"
            width={417}
            height={240}
            style={{ objectFit: "contain" }}
          />
        </div>
      </BlurReveal>
    </section>
  )
}
