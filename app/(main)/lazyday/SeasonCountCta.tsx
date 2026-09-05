"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { animate, createSpring } from "animejs"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SEASON, daysUntilDeadline } from "./season-config"
import c from "./season-count-cta.module.css"

/**
 * 클로징 CTA — 반응형 초안의 승인본 이식 (2026-08-12). 구 ClosingCtaSection 을 대체한다
 * (구 컴포넌트는 프리뷰 쌍 ClosingSectionV2 와 함께 고아 보존 — 삭제하지 않는다).
 *
 * ① 제목: hero-motion 시안 ⑥(기수 카운트) 서식을 **그대로** 옮겨,
 *    구 "레이지데이 북클럽 4기를 모집합니다." 자리를 1 → 2 → 3 → 4기 모집 으로 대체.
 *    포스터가 아니라 **로고 바로 위**가 자리 (운영자 지정).
 * ② 로고: 운영자 제공 새 마크(검정 박스 + LAZYDAY BOOKCLUB 세로 라벨).
 *
 * 시안 ⑥ 타이밍 원본: 300ms 에 2, 480ms 에 3 (translateY 6→0 · opacity .4→1 · 160ms
 * · out(2)), 660ms 에 4 (scale 1.18→1 · 460ms · spring 240/12).
 * 다만 이 자리는 첫 화면이 아니라 **끝까지 내려야 보이는 곳**이라, 마운트가 아니라
 * 화면에 들어올 때 재생한다.
 *
 * 2026-08-12 (운영자 "1 2 3 4 넘어가는 애니메이션 누락되었어 다시 반영해"):
 * 종전 '평생 1회'(done 플래그)는 60% 보이는 순간 — 대개 아직 스크롤 중일 때 —
 * 발사돼 ~1.1초 만에 끝나, 사용자가 도착했을 땐 이미 4 로 앉아 있어 없는 것처럼
 * 보였다. → **화면에 들어올 때마다 재생**으로 변경 (나갔다 들어오면 다시 1부터).
 * 재생 중 재진입은 무시, 나가면 타이머를 걷어 어중간한 숫자로 멈추지 않게 한다.
 *
 * 2026-08-13 리타이밍: 균일 180ms 간격을 등비수열 **가속**으로 (210 → 139 → 91ms).
 *
 * 2026-09-05 방향 정정 (운영자 "1부터 4까지 4기로 고정되는 그 룰렛형태는 현재 등속으로
 * 보이는데 룰렛머신처럼 수렴하는 형태로 자연스럽게 해줘"): 가속은 룰렛의 **반대**였다.
 * 룰렛은 빠르게 돌다 느려지며 한 칸에 앉는다 → 간격을 easeIn 곡선에 태워 **감속**으로
 * 뒤집었다. 69 → 172 → 259ms + 스프링 340ms (총 840ms).
 * 종전 2026-08-13 지시("앞부분에서 감속해서 4까지 와")와도 이쪽이 맞는다.
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

export function SeasonCountCta() {
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
          // 나가면 정리 — 어중간한 숫자로 멈추지 않게 최종값으로
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
export function BrandCloseV2() {
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
