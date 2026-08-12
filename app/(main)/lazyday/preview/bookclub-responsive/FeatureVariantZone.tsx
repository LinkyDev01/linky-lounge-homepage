"use client"

import { useState } from "react"
import s from "./draft.module.css"

/**
 * 모임소개 데스크톱 시안 전환 (운영자 2026-08-12 "2×2 그리드 또는 사진 풀블리드
 * → 각각 프리뷰 필요") — 철칙 1의 인터랙티브 전환 문법. 실사이트 컴포넌트는
 * 그대로 두고 CSS 변수(--lz-qt-*)만 zone 에서 갈아끼운다. ≤720px 은 두 시안 모두
 * 현행 모바일과 동일.
 */
export function FeatureVariantZone({ children }: { children: React.ReactNode }) {
  const [variant, setVariant] = useState<"grid" | "full">("grid")
  return (
    <div className={s.qtZone} data-variant={variant}>
      <div className={s.qtSwitch} role="tablist" aria-label="모임소개 데스크톱 시안">
        <button
          type="button"
          role="tab"
          aria-selected={variant === "grid"}
          className={`${s.qtSwitchBtn} ${variant === "grid" ? s.qtSwitchOn : ""}`}
          onClick={() => setVariant("grid")}
        >
          A · 2×2 그리드
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={variant === "full"}
          className={`${s.qtSwitchBtn} ${variant === "full" ? s.qtSwitchOn : ""}`}
          onClick={() => setVariant("full")}
        >
          B · 사진 풀블리드
        </button>
      </div>
      {children}
    </div>
  )
}
