"use client"

import { useEffect, useRef, useState } from "react"
import { ApplyButton } from "./apply-button"
import styles from "./page.module.css"

/**
 * 페이지 전체에서 항상 하단에 노출되는 신청하기 버튼.
 * (이전에는 closing-section이 viewport에 들어오면 사라졌으나, 동민님 요청으로
 * 어떤 섹션에 있든 일관되게 노출되도록 변경.)
 * 조기마감 모드의 희소성 문구는 버튼 안 둘째 줄로 이동 (운영자 지시 2026-07-13 — 가독성)
 *
 * 2026-08-09 (운영자 "CTA는 4기 신청하기만 남겨놔"): 원데이 토크 병행 2버튼 서식을
 * 걷어내고 원래 1버튼 버전으로 복귀. 2버튼 서식은 `sticky-apply-button-duo.tsx` 로 보존.
 *
 * 2026-08-09 (운영자 "하단까지 내려가면 해당 위치에 놓이면 돼. 이중으로 될 필요는 없어 /
 * 캘린더 하단 고정 거북이 트랙처럼"): **fixed → sticky**.
 *  · 문서 흐름상 위치 = 클로징 CTA 와 브랜드 로고 사이 → 끝까지 내리면 거기 내려앉는다
 *  · 그전까지는 `bottom: 0` 으로 뷰포트 하단에 붙어 종전과 똑같이 보인다
 *  · 클로징 섹션에 있던 중복 신청 버튼은 제거 — 버튼은 이제 하나뿐이다
 *  · 떠 있을 때만 스크림(그라데이션)을 깔고, 내려앉으면 종이색으로 — 로고 위에
 *    갈색 띠가 남지 않게. 상태 판정은 rect.bottom 이 뷰포트 바닥에 붙었는지로.
 */
export function StickyApplyButton() {
  const ref = useRef<HTMLDivElement>(null)
  const [docked, setDocked] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const check = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // 스티키가 풀려 제 자리에 앉으면 바닥에서 떨어진다 (1px 허용 오차).
        // ⚠ 거북이 레인 때문에 CTA 가 `bottom: 18px` 만큼 들려 있으므로(.ctaLift)
        //   기준선도 그만큼 올려야 한다 — 안 그러면 떠 있는 내내 docked 로 오판해
        //   스크림이 사라지고 하단 패딩이 40px 로 벌어진다 (2026-08-12 실측 확인)
        const lift = parseFloat(getComputedStyle(el).bottom) || 0
        setDocked(el.getBoundingClientRect().bottom < window.innerHeight - lift - 1)
      })
    }
    check()
    window.addEventListener("scroll", check, { passive: true })
    window.addEventListener("resize", check)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
    }
  }, [])

  return (
    // data-lz-chrome: 진입 홀드 동안 셸이 내비·푸터와 함께 감추는 표식
    // (셸 CSS 는 다른 모듈이라 해시 클래스로 못 잡는다 — useChromeIntro 주석 참고)
    <div
      ref={ref}
      className={styles.fixedButtonContainer}
      data-docked={docked ? "true" : undefined}
      data-lz-chrome="cta"
    >
      <ApplyButton />
    </div>
  )
}
