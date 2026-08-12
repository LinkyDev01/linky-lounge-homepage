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
 */

const TARGET = Number((SEASON.name.match(/\d+/) ?? ["4"])[0]) // "4기" → 4

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
      // 1 → 2 → 3 (짧게 튀어 오르며 교체)
      for (let n = 2; n < TARGET; n++) {
        timers.push(
          setTimeout(
            () => {
              el.textContent = String(n)
              animate(el, { translateY: [6, 0], opacity: [0.4, 1], duration: 160, ease: "out(2)" })
            },
            300 + (n - 2) * 180,
          ),
        )
      }
      // 마지막 기수 — 스프링으로 한 번 크게 앉는다
      timers.push(
        setTimeout(
          () => {
            el.textContent = String(TARGET)
            animate(el, {
              scale: [1.18, 1],
              duration: 460,
              ease: createSpring({ stiffness: 240, damping: 12 }),
            })
            playing = false
          },
          300 + (TARGET - 2) * 180,
        ),
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
