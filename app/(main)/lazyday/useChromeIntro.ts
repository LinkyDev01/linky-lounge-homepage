"use client"

import { useEffect, useState } from "react"
import { CHROME_REVEAL_MS } from "./HeroBreathingPoster"

/**
 * 진입 홀드 — 처음엔 **포스터만** 보이고, 히어로 텍스트가 정상 속도에 오른 순간
 * 내비·푸터·스티키 CTA 가 나타난다 (운영자 2026-08-12: "레이지 클럽 초기
 * 애니메이션처럼 ... 포스터만 뜨게 하고 클릭 혹은 애니메이션에서 텍스트가 모두
 * 노출(텍스트들이 돌아가기 시작한 순간으로부터 0.3초 후)되었을 때 네비 푸터/CTA
 * 스티키가 뜨도록").
 *
 * 레이지클럽 인트로(ComingSoonMain 라운드 48·57)의 규율을 그대로 따른다:
 *  · **레이아웃 불변** — 감출 때 display 를 건드리지 않는다. opacity 만 0 으로 두어
 *    시작 화면과 끝 화면의 배치가 1px도 다르지 않다
 *  · **스크롤을 잠그지 않는다** — 잠그면 데스크톱에서 스크롤바가 사라져 폭이 바뀐다
 *  · **입력이 오면 즉시 노출** — 클릭·터치·키·휠·스크롤 어느 것이든 ("클릭 혹은")
 *  · reduced-motion 이면 홀드 없이 처음부터 노출
 *
 * SSR 은 hold 상태로 그려진다 — effect 에서 켜면 첫 페인트에 크롬이 번쩍인다.
 * JS 가 아예 없는 환경을 위해 셸이 `<noscript>` 로 강제 노출 스타일을 함께 둔다.
 */
export function useChromeIntro() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true)
      return
    }
    // 이미 스크롤된 채 열린 경우(브라우저 위치 복원·해시 진입) 포스터가 보이지 않으므로
    // 홀드할 이유가 없다
    if (window.scrollY > 0) {
      setShown(true)
      return
    }

    const timer = setTimeout(() => setShown(true), CHROME_REVEAL_MS)
    const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const
    const onInput = () => setShown(true)
    EVENTS.forEach((ev) => window.addEventListener(ev, onInput, { passive: true }))
    return () => {
      clearTimeout(timer)
      EVENTS.forEach((ev) => window.removeEventListener(ev, onInput))
    }
  }, [])

  return shown
}

/** 셸 두 곳(LandingShell·DraftShell)이 같은 마크업을 쓰도록 — JS 없는 환경 대비.
 *  덮개까지 걷어야 한다 (안 그러면 포스터 말고 아무것도 안 보인다) */
export const CHROME_NOSCRIPT_CSS =
  '[data-intro="hold"] > header,[data-intro="hold"] > footer,[data-intro="hold"] [data-lz-chrome]{opacity:1!important;pointer-events:auto!important}' +
  '[data-intro="hold"] [data-lz-mask]{opacity:0!important;pointer-events:none!important}'
