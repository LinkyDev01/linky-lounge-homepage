"use client"

import { useEffect, useRef, useState } from "react"
import { CHROME_REVEAL_MS } from "./HeroBreathingPoster"

/**
 * 진입 홀드 — 처음엔 **포스터만** 보이고, 그어짐이 끝나갈 무렵 내비·푸터가,
 * 그로부터 3초 뒤 스티키 CTA 가 나타난다.
 *
 * 운영자 2026-08-12 (순서대로):
 *  · "레이지 클럽 초기 애니메이션처럼 ... 포스터만 뜨게 하고 클릭 혹은 애니메이션에서
 *    텍스트가 모두 노출되었을 때 네비 푸터/CTA 스티키가 뜨도록"
 *  · "4기 신청하기 cta 스티키는 지금보다 3초 지연시켜" → **CTA 만 분리**.
 *    내비·푸터는 CHROME_REVEAL_MS 그대로, CTA 는 거기서 +3초.
 *
 * 레이지클럽 인트로(ComingSoonMain 라운드 48·57)의 규율을 그대로 따른다:
 *  · **레이아웃 불변** — 감출 때 display 를 건드리지 않는다. opacity 만 0 으로 두어
 *    시작 화면과 끝 화면의 배치가 1px도 다르지 않다
 *  · **스크롤을 잠그지 않는다** — 잠그면 데스크톱에서 스크롤바가 사라져 폭이 바뀐다
 *  · **입력이 오면 즉시 노출** — 클릭·터치·키·휠·스크롤 어느 것이든 ("클릭 혹은")
 *  · reduced-motion 이면 홀드 없이 처음부터 노출
 *
 * ⚠ CTA 지연은 **크롬이 뜬 순간 기준 상대값**이다 — 입력으로 일찍 건너뛰어도
 * 내비가 뜬 뒤 3초가 지나야 CTA 가 온다. 절대 시각으로 잡으면 스킵한 사용자에게
 * CTA 만 한참 안 뜨거나(또는 즉시 뜨거나) 해서 간격이 들쭉날쭉해진다.
 *
 * SSR 은 hold 상태로 그려진다 — effect 에서 켜면 첫 페인트에 크롬이 번쩍인다.
 * JS 가 아예 없는 환경을 위해 셸이 `<noscript>` 로 강제 노출 스타일을 함께 둔다.
 */

/** 스티키 CTA 만 내비·푸터보다 늦게 (운영자 2026-08-12 "3초 지연시켜") */
export const CTA_EXTRA_DELAY_MS = 3000

/**
 * 이 홀드는 히어로가 **모션 포스터**일 때만 의미가 있다(그어짐이 끝나갈 무렵에
 * 맞춰 네비·CTA 를 띄우는 안무). 2026-08-14 정적 이미지 임시 복귀 중엔 기다릴
 * 대상이 없으니 네비·본문(마스크)·CTA 를 즉시 노출 — 홀드 로직 자체는 지우지
 * 않고 꺼만 둔다. 모션 재점등 시 true 로 되돌리면 원래 동작이 복원된다.
 */
const HOLD_ENABLED = false

/** @param force `true` 면 HOLD_ENABLED 와 무관하게 홀드를 켠다 — **검수 페이지
 *  (`preview/hero-check`) 전용**. 랜딩이 정적 이미지인 동안에도 모션 히어로의
 *  안무(내비·푸터 → 3초 뒤 CTA)를 그대로 볼 수 있어야 하기 때문 (운영자 2026-08-14
 *  "네비와 푸터 숨겼다가 노출되는 그 모든 과정까지 프리뷰에 다 실어"). */
export function useChromeIntro(force = false) {
  const [chrome, setChrome] = useState(false)
  const [cta, setCta] = useState(false)
  // 크롬 노출은 타이머·입력 어느 쪽으로도 올 수 있다 — CTA 예약이 두 번 걸려
  // 뒤로 밀리지 않게 첫 호출만 유효하게 한다
  const chromeDone = useRef(false)

  useEffect(() => {
    let ctaTimer: ReturnType<typeof setTimeout> | undefined

    /** 인트로 자체를 건너뛰는 경로 — 크롬·CTA 를 함께 즉시 노출 */
    const revealAll = () => {
      chromeDone.current = true
      setChrome(true)
      setCta(true)
    }
    /** 정상 경로 — 크롬 먼저, CTA 는 3초 뒤 */
    const revealChrome = () => {
      if (chromeDone.current) return
      chromeDone.current = true
      setChrome(true)
      ctaTimer = setTimeout(() => setCta(true), CTA_EXTRA_DELAY_MS)
    }

    if (!HOLD_ENABLED && !force) {
      revealAll()
      return
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealAll()
      return
    }
    // 이미 스크롤된 채 열린 경우(브라우저 위치 복원·해시 진입) 포스터가 보이지 않으므로
    // 홀드할 이유가 없다
    if (window.scrollY > 0) {
      revealAll()
      return
    }

    const timer = setTimeout(revealChrome, CHROME_REVEAL_MS)
    const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const
    EVENTS.forEach((ev) => window.addEventListener(ev, revealChrome, { passive: true }))
    return () => {
      clearTimeout(timer)
      clearTimeout(ctaTimer)
      EVENTS.forEach((ev) => window.removeEventListener(ev, revealChrome))
    }
  }, [force])

  return { chrome, cta }
}

/** 셸 두 곳(LandingShell·DraftShell)이 같은 마크업을 쓰도록 — JS 없는 환경 대비.
 *  덮개까지 걷어야 한다 (안 그러면 포스터 말고 아무것도 안 보인다) */
export const CHROME_NOSCRIPT_CSS =
  '[data-intro="hold"] > header,[data-intro="hold"] > footer,[data-cta="hold"] [data-lz-chrome]{opacity:1!important;pointer-events:auto!important}' +
  '[data-intro="hold"] [data-lz-mask]{opacity:0!important;pointer-events:none!important}'
