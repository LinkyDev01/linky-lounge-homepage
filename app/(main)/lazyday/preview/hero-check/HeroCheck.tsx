"use client"

import { useEffect, useRef, useState } from "react"
import { HeroBreathingPoster } from "../../HeroBreathingPoster"
import { HeroSummary } from "../HeroSummary"
import { LandingShell } from "../../LandingShell"
import { StickyApplyButton } from "../../sticky-apply-button"
import { SeasonCountCta, BrandCloseV2 } from "../../SeasonCountCta"
import shell from "../../landing-shell.module.css"
import page from "../../page.module.css"
import styles from "./hero-check.module.css"

/** 히어로 검수대 — **실사이트 컴포넌트를 그대로 import** 한다.
 *  V2 사본을 두지 않는 이유: 사본을 검수하면 이식 과정에서 값이 어긋나
 *  "프리뷰에선 멀쩡했는데 랜딩에서 깨지는" 사고가 난다. 여기서 통과한 화면이
 *  곧 랜딩 화면이고, 랜딩 반영은 HeroParallax 의 <Image> 를 이 컴포넌트로
 *  되돌리는 한 줄뿐이다.
 *
 *  2026-08-14 운영자: "네비와 푸터 숨겼다가 노출되는 그 모든 과정까지 프리뷰에 다
 *  실어" → 포스터만 떼어 보여주는 게 아니라 **랜딩과 같은 셸**(LandingShell)로 감싸
 *  진입 안무 전체를 재생한다: 포스터만 → (그어짐 종료 −0.2초) 내비·푸터·본문 →
 *  그로부터 3초 뒤 스티키 CTA. 랜딩이 정적 이미지인 동안 홀드가 꺼져 있으므로
 *  (useChromeIntro 의 HOLD_ENABLED=false) 여기서만 `holdIntro` 로 강제로 켠다. */
export function HeroCheck() {
  const [runId, setRunId] = useState(0)
  // ⚠ 겹쳐 보기는 **꺼진 채로 시작**한다. 켠 채 열면 반투명 원본이 실 위에 얹혀
  //   그어짐이 묻혀 "애니메이션이 안 보인다"로 읽힌다 (운영자 2026-08-14).
  const [overlay, setOverlay] = useState(false)
  const [alpha, setAlpha] = useState(0.45)
  const stageRef = useRef<HTMLDivElement>(null)
  const [diag, setDiag] = useState("")
  const [marks, setMarks] = useState<string[]>([])

  // 진단 — "안 보인다"가 브라우저별 문제일 때 원인을 화면에서 바로 읽는다
  useEffect(() => {
    const t = setTimeout(() => {
      const svg = stageRef.current?.querySelector("svg[data-lz-poster]")
      if (!svg) return setDiag("SVG 없음")
      // ⚠ `querySelector("text")` 는 앞에 놓인 측정 프로브를 집는다 — 실 위 본문은
      //   textPath 를 품은 <text> 다
      const textEl = (svg.querySelector("textPath")?.closest("text") ?? null) as SVGTextElement | null
      const probe = svg.querySelector("text[data-probe]") as SVGTextElement | null
      const path = svg.querySelector("#heroSayuThread") as SVGPathElement | null
      const play = getComputedStyle(svg).getPropertyValue("--lz-play").trim() || "(미설정=running)"
      const w = textEl?.getComputedTextLength?.() ?? -1
      const pw = probe?.getComputedTextLength?.() ?? -1
      const L = path?.getTotalLength?.() ?? -1
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      setDiag(
        `--lz-play ${play} · 본문폭 ${w.toFixed(0)} · 프로브 ${pw.toFixed(0)} · 경로 ${L.toFixed(0)} · ` +
          `크기 ${textEl ? getComputedStyle(textEl).fontSize : "?"} · 모션최소화 ${reduce ? "켜짐" : "꺼짐"}`,
      )
    }, 5000)
    return () => clearTimeout(t)
  }, [runId])

  /** 안무 시각 기록 — 내비·푸터가 실제로 언제 떴는지, CTA 는 몇 초 뒤인지를
   *  눈대중이 아니라 숫자로 남긴다 (data-intro / data-cta 속성 변화를 관찰) */
  useEffect(() => {
    const root = document.querySelector("[data-intro]")
    if (!root) return
    const t0 = performance.now()
    const log: string[] = []
    const push = (s: string) => {
      log.push(s)
      setMarks([...log])
    }
    push("0.00초 — 포스터만 (내비·푸터·본문 가림)")
    const mo = new MutationObserver(() => {
      const intro = root.getAttribute("data-intro")
      const cta = root.getAttribute("data-cta")
      const at = ((performance.now() - t0) / 1000).toFixed(2)
      if (intro === "show" && !log.some((l) => l.includes("내비·푸터"))) push(`${at}초 — 내비·푸터·본문 노출`)
      if (cta === "show" && !log.some((l) => l.includes("스티키"))) push(`${at}초 — 스티키 CTA 노출`)
    })
    mo.observe(root, { attributes: true, attributeFilter: ["data-intro", "data-cta"] })
    return () => mo.disconnect()
  }, [runId])

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            // 안무까지 처음부터 — 셸의 홀드는 마운트 시각 기준이라 스크롤도 되돌린다
            window.scrollTo(0, 0)
            setMarks([])
            setRunId((n) => n + 1)
          }}
        >
          처음부터 다시 재생
        </button>
        <label className={styles.check}>
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />
          원본 포스터 겹쳐 보기
        </label>
        <label className={styles.range}>
          투명도
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            disabled={!overlay}
          />
          <span className={styles.num}>{alpha.toFixed(2)}</span>
        </label>
      </div>

      <p className={styles.hint}>
        ⚠ 진입 홀드는 <b>아무 입력(클릭·스크롤·휠)에도 즉시 풀린다</b> — 안무 전체를 보려면
        재생 후 <b>화면을 건드리지 말고</b> 2.2초를 기다리세요.
      </p>

      {/* 랜딩과 같은 셸. key 로 통째 remount 하면 안무가 처음부터 다시 돈다 */}
      <div className={styles.shellFrame}>
        <LandingShell holdIntro key={runId}>
          <main className={`${page.container} ${shell.body}`}>
            <div className={shell.heroRow} ref={stageRef}>
              <div className={styles.stage}>
                <HeroBreathingPoster />
                {overlay && (
                  /* 원본을 위에 반투명으로 얹어 **수치가 아니라 눈으로** 어긋남을 본다.
                     pointer-events 없음 — 아래 SVG 조작을 막지 않는다 */
                  <img
                    src="/linky-lounge/book-club/4th-poster-typo.webp"
                    alt=""
                    aria-hidden
                    className={styles.ghost}
                    style={{ opacity: alpha }}
                  />
                )}
              </div>
              <HeroSummary />
            </div>
            {/* 본문은 안무 확인에 필요한 만큼만 — 스티키 CTA 가 흐름상 내려앉을
                자리를 만들어 주는 클로징 두 블록 (랜딩과 같은 순서) */}
            <SeasonCountCta />
            <StickyApplyButton />
            <BrandCloseV2 />
          </main>
        </LandingShell>
      </div>

      {marks.length > 0 && (
        <ol className={styles.marks}>
          {marks.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ol>
      )}

      {diag && <p className={styles.diag}>{diag}</p>}

      <p className={styles.note}>
        검수 항목 — ① 진입 중 <b>초기화·되감기</b>가 보이지 않을 것 ② 전문이 「서성였을
        뿐이다」로 끝나며 실을 <b>정확히 한 바퀴</b> 채울 것(뒤쪽 누락 없음) ③ 이웃 줄끼리
        <b>겹치지 않을 것</b> ④ 흐름 중 이음매에서 글자가 <b>깜빡이지 않을 것</b> ⑤ 겹쳐
        보기에서 큰 글자 12자와 실 경로가 원본과 <b>포개질 것</b> ⑥ <b>내비·푸터·본문</b>이
        가려졌다가 그어짐 끝 무렵에, <b>스티키 CTA</b>가 그로부터 3초 뒤에 뜰 것.
      </p>
    </div>
  )
}
