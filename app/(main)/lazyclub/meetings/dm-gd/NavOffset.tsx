"use client"

/**
 * 티커를 탑네비에 **빈틈없이** 붙인다 (운영자 2026-08-25 "맨위 스티키와 탑네비 사이의
 * 빈틈없게해줘").
 *
 * 왜 상수로는 안 되나: 셸 헤더 높이가 정수가 아니다 — 390px 에서 **59.5px** 이다.
 * CSS 에 60px 으로 박아 두면 티커가 0.5px 아래에 앉는다. 둘 다 종이색일 때는 안 보였지만
 * 티커에 경계선을 긋는 순간 그 틈이 선 위로 드러난다.
 *
 * 그래서 헤더 높이와 `.content` 의 padding-top 을 **런타임에 재서** 변수에 넣는다.
 * 티커의 `top` 과 `margin-top` 이 그 두 값으로 계산되므로, 재는 순간 정확히 맞물린다.
 * 내비가 접히거나 글자 크기가 바뀌어도 ResizeObserver 가 따라간다.
 *
 * ⚠ CSS 쪽 하드코딩(60/65px · 92/100px)은 **하이드레이션 전 폴백**으로 남겨 둔다 —
 *   이 컴포넌트가 돌기 전 한 프레임 동안 쓰인다.
 * ⚠ 1px 겹치기로 때우지 않았다: 헤더가 z-index 99 로 티커(20) 위에 있어서,
 *   겹치면 티커의 윗 경계선이 헤더 뒤로 숨는다.
 */

import { useEffect } from "react"

export function NavOffset() {
  useEffect(() => {
    const header = document.querySelector("header")
    const root = document.querySelector<HTMLElement>("[data-cb-root]")
    const main = root?.closest("main")
    if (!header || !root || !main) return

    const apply = () => {
      root.style.setProperty("--cb-nav-h", `${header.getBoundingClientRect().height}px`)
      root.style.setProperty("--cb-content-pt", getComputedStyle(main).paddingTop)
    }
    apply()

    const ro = new ResizeObserver(apply)
    ro.observe(header)
    ro.observe(main)
    return () => ro.disconnect()
  }, [])

  return null
}
