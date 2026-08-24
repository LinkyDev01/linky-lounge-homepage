"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import s from "./intro-rule.module.css"
import shell from "../landing-shell.module.css"
import { IntroRuleBlock, ProcessSection, INTRO_VARIANTS, type IntroVariant } from "./IntroRuleBlock"

/**
 * 자기소개 규칙 — 시안 실배치 랩 (프리뷰 전용, 2026-08-24).
 *
 * 모임소개 밴드 전체(모임소개 + 자기소개 규칙 + 진행 순서)를 감싸고,
 * 좌상단 스위처로 시안 6개를 **실제 랜딩 안에서** 갈아 끼운다.
 * 운영자 "6가지 안은 하나도 적용해볼 수 없잖아" 에 대한 응답 —
 * 쇼케이스(`preview/intro-rule-designs`)의 가짜 밴드를 대체한다.
 *
 * `feature`·`brief` 는 서버 컴포넌트를 그대로 받아 배치만 바꾼다
 * (실사이트 HowToBrief 는 손대지 않는다 — V2 없음 = 공유, §4).
 *
 * 채택 후에는 이 랩과 스위처를 걷어내고 선택된 시안만 고정한다.
 */
const STORAGE_KEY = "lz-intro-variant"

export function IntroRuleLab({ feature, brief }: { feature: ReactNode; brief: ReactNode }) {
  const [variant, setVariant] = useState<IntroVariant>("off")
  const [panelOpen, setPanelOpen] = useState(false)
  // 진행 순서 접기 — 운영자 "클릭한 사람만 명시화해서 볼 수 있고"
  const [foldBrief, setFoldBrief] = useState(true)
  const [briefOpen, setBriefOpen] = useState(false)

  // 선택 유지 — 초깃값이 아니라 마운트 후 복원 (하이드레이션 불일치 방지)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as IntroVariant | null
      if (saved && INTRO_VARIANTS.some((v) => v.id === saved)) setVariant(saved)
    } catch { /* 저장소 차단 환경 무시 */ }
  }, [])

  function pick(v: IntroVariant) {
    setVariant(v)
    try { localStorage.setItem(STORAGE_KEY, v) } catch { /* 무시 */ }
  }

  const meta = INTRO_VARIANTS.find((v) => v.id === variant)!
  // 0안(현행)은 정의상 실사이트 배치 그대로 — 접기 토글도 적용하지 않는다
  const folded = variant !== "off" && foldBrief

  const briefNode = folded ? (
    <>
      <button
        type="button"
        className={s.foldLine}
        onClick={() => setBriefOpen((v) => !v)}
        aria-expanded={briefOpen}
      >
        <span className={s.foldTitle}>진행 순서</span>
        <span className={`${s.foldPlus} ${briefOpen ? s.foldPlusOpen : ""}`} aria-hidden>+</span>
      </button>
      <div className={`${s.fold} ${briefOpen ? s.foldOpen : ""}`}>
        <div className={s.foldInner}>{brief}</div>
      </div>
    </>
  ) : (
    brief
  )

  return (
    <>
      {/* ── 모임소개 밴드 ── */}
      <div className={shell.featureBand}>
        {feature}
        <IntroRuleBlock variant={variant} />
        {variant !== "process" && <div className={shell.briefWrap}>{briefNode}</div>}
      </div>

      {/* 5안 — 진행 순서를 밴드에서 빼내 독립 섹션으로 */}
      {variant === "process" && <ProcessSection />}

      {/* ── 시안 스위처 ── */}
      {!panelOpen ? (
        <button type="button" className={s.labToggle} onClick={() => setPanelOpen(true)}>
          자기소개 시안: {meta.name.replace(/^\d+\.\s*/, "")}
        </button>
      ) : (
        <div className={s.labPanel} role="dialog" aria-label="자기소개 규칙 시안 전환">
          <div className={s.labHead}>
            <span className={s.labTitle}>자기소개 규칙 — 시안 비교</span>
            <button type="button" className={s.labClose} onClick={() => setPanelOpen(false)} aria-label="닫기">×</button>
          </div>
          {INTRO_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`${s.labOpt} ${variant === v.id ? s.labOptOn : ""}`}
              onClick={() => pick(v.id)}
            >
              {v.name}
              <br />
              <span style={{ opacity: 0.72, fontSize: "10.5px" }}>{v.hint}</span>
            </button>
          ))}
          <label className={s.labHint} style={{ display: "flex", gap: "6px", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={foldBrief}
              onChange={(e) => setFoldBrief(e.target.checked)}
              style={{ accentColor: "#d2691e" }}
            />
            진행 순서 접기 (0안 제외)
          </label>
          <p className={s.labHint}>
            시안을 고르면 이 페이지 안에서 바로 바뀝니다. 선택은 브라우저에 저장돼
            새로고침해도 유지됩니다.
          </p>
        </div>
      )}
    </>
  )
}
