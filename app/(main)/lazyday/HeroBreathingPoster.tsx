"use client"

import { memo, useEffect, useRef } from "react"
import {
  POSTER_THREAD_D,
  POSTER_GLYPHS,
  POSTER_GLYPH_DY,
  scalePosterThreadD,
  SAYU_P1,
  SAYU_P2,
  SAYU_P3,
} from "./poster-thread"
import styles from "./HeroBreathingPoster.module.css"

/**
 * 숨 쉬는 포스터 — 히어로 채택본 (2026-08-11, hero-motion 시안 ③ 이식).
 *
 * 실 = 원본 디자인 PDF 좌표의 한붓 경로(poster-thread.ts), 큰 글자 12자는 실측
 * 좌표에 정적. 〈사유의 기슭〉 전문이 실을 따라 흐른다.
 * ① 실 위 본문이 2.2초에 걸쳐 스스로 그어진다 (붓끝 순서 = draw 이징 역함수의
 *    글자별 딜레이. 첫 벌만 tspan 분해, CSS 스태거라 페인트부터 돈다)
 * ② 다 그어지면 0.3초 등가속 → 정상 속도의 SMIL 무한 흐름
 *
 * ⚠ **2026-08-14 원상복구 (운영자): "이전처럼 애니메이션 살려야하지만 경로만
 *    바뀌었다 한 가지 문제만 추가 해결하면 돼."** — 진입 애니메이션은 채택 당시
 *    구조(글자별 tspan 스태거, 페인트부터 재생, 정지·재개 없음) 그대로다.
 *    중간에 시도했던 SSR 정지 출생·정지→재개·선형 등속·마스크 스윕은 전부 철회.
 *    남긴 것은 **화면에 안 보이는 교정 4건**뿐:
 *    ⓐ 흐름 전환(통짜 교체)을 **서체 폭이 안정된 뒤에만** — fonts.ready 는 동적
 *       서브셋에서 일찍 resolve 되어, 폴백 폭으로 전환하면 뒤쪽 28%가 경로 밖으로
 *       밀리고 이웃 줄이 겹친다 (운영자가 확인한 "넘치거나 겹치고")
 *    ⓑ **이음매 런타임 튜닝** — 피치는 엔진마다 달라 경로 길이를 δ 만큼 미세
 *       스케일해야 시작 구간의 겹침/사라짐이 없다 ("시작구간 텍스트 겹침/사라짐")
 *    ⓒ 폭 측정 3단 폴백(웹킷은 textPath 품은 <text> 폭을 0 으로 줌) + 1% 초과
 *       이탈 시에만 크기 구제(fitToPath)
 *    ⓓ 램프는 통짜 교체 리플로우가 끝난 다음 프레임에 발화 (가속이 실제로 보이게)
 *    전부 전환 시점(그어짐이 끝난 정적인 순간)에 몰아 두어 스태거를 건드리지 않는다.
 *
 * 모션 원칙 M2의 허용 유형. reduced-motion 이면 진입 스킵(즉시 노출)·흐름 없음.
 */

/** 문단 사이는 **한 칸** (세 칸의 13.5u 빈 구간이 이음매에서 생성/소멸로 보였다) */
const SAYU_FULL = `${SAYU_P1} ${SAYU_P2} ${SAYU_P3}`
const SPEED = 10 // px/s (viewBox 단위) — 존재만 하는 배경 속도 (데모 ③ 확정값)

// ── 진입 타이밍 = hero-motion 시안 ①(실선 인트로)의 값 그대로 ────────────────
const DRAW_MS = 2200
const CHAR_DUR_MS = 200 // 그어지는 인상 — 글자 하나의 페이드는 짧게

/** 글자 i(위치 p)가 뜨는 정규화 시각 — 붓끝이 그 자리에 닿는 순간.
 *  easeInOutQuad 역함수를 선형과 섞어 끝 꼬리만 완화한 채택본 원형. */
const TAIL_BLEND = 0.45
function drawTimeAt(p: number) {
  const quad = p < 0.5 ? Math.sqrt(p / 2) : 1 - Math.sqrt((1 - p) / 2)
  return quad * (1 - TAIL_BLEND) + p * TAIL_BLEND
}

const INTRO_DONE_MS = DRAW_MS + CHAR_DUR_MS // 큰 글자는 정적이라 실 그어짐이 곧 진입 전체

const RAMP_MS = 300
const RAMP_DIST = (SPEED * (RAMP_MS / 1000)) / 2
const FLOW_START_MS = INTRO_DONE_MS // 대기 없이 가속 구간으로 이어 붙인다

/** 크롬이 경로 양 끝에서 글리프를 안 그리는 가장자리 여백의 합(u, 실측 1.46) —
 *  **폭을 못 재는 브라우저용 폴백**. 실제 정합은 tuneSeam 이 δ 를 직접 재서 맞춘다. */
const SEAM_MARGIN = 1.46

/** 내비·푸터·스티키 CTA 가 나타나는 시각 — 그어짐 종료(FLOW_START_MS) 기준 −200ms.
 *  LandingShell/DraftShell 이 이 값을 읽어 같은 시계로 움직인다. */
export const CHROME_REVEAL_MS = Math.max(0, FLOW_START_MS - 200)

/** memo — 셸 리빌(내비·푸터 노출)의 리렌더가 그리기 끝 무렵에 오는데, 포스터까지
 *  리렌더되면 474개 tspan 재조정이 프레임을 블록해 마지막 글자들이 뭉텅이로 뜬다. */
export const HeroBreathingPoster = memo(function HeroBreathingPoster() {
  const rootRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const mounted = performance.now()
    let cancelled = false
    let raf = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const tp = root.querySelector<SVGTextPathElement>("textPath[data-stream]")
    const pathEl = root.querySelector<SVGPathElement>("#heroSayuThread")
    if (!tp || !pathEl) return
    const textEl = tp.closest("text") as SVGTextElement
    const L0 = pathEl.getTotalLength()

    /** 본문 **한 벌**의 실제 폭(u). ⚠ 실기기 iOS 검증(2026-08-14 스크린샷)으로 확정된
     *  웹킷 반환값: `<text>` 는 **0**, `<textPath>` 는 **경로에 실린 글자만**의 폭
     *  (≈ 경로 길이 — 벌 수와 무관!). 종전 코드가 textPath 폭을 "K벌 전체 폭"으로
     *  오해해 한 벌 폭을 1/K 로 잘못 재고 **글자를 K배로 키웠다**(운영자 "폰트가
     *  깨졌어 사이즈와 폰트, 굵기 모든 게" — 실기기에서 3배 폭발).
     *  → textPath 는 측정원에서 **제외**한다. ① <text>(크롬 — 전체 advance 를 벌
     *  수로 나눔) ② 화면 밖 평문 프로브(웹킷 — 딱 한 벌이라 나누지 않음, 경로 배치와
     *  0.4% 차이는 fitToPath 1% 가드 안). */
    const probe = root.querySelector<SVGTextElement>("text[data-probe]")
    const unitWidth = (unitCount: number) => {
      const w = textEl.getComputedTextLength()
      if (w > 0) return w / unitCount
      return probe?.getComputedTextLength() ?? 0
    }

    /** 서체가 **제 폭으로 안정**될 때까지 기다린다 (교정 ⓐ). fonts.ready 는 동적
     *  서브셋에서 조각 로드가 비는 순간 먼저 resolve 되어 못 믿는다 — 폭이 경로의
     *  ±4% 안에 들고 **직전 측정과 동일**할 때(조각 수신 완료)를 안정으로 본다.
     *  스태거는 이 대기와 무관하게 페인트부터 돌고 있다 (원형 유지). */
    const fontSettled = async () => {
      try {
        await (document as Document).fonts.load(`400 7.2px "Pretendard Variable"`, SAYU_FULL)
      } catch {
        /* 로드 실패면 아래 상한까지 기다린 뒤 fitToPath 가 구제한다 */
      }
      let prev = -1
      for (let i = 0; i < 20 && !cancelled; i++) {
        const w = unitWidth(1)
        if (w > 0 && Math.abs(w - L0) / L0 < 0.04 && w === prev) return
        prev = w
        await new Promise((r) => setTimeout(r, 120))
      }
    }

    /** 폴백 서체 **구제 전용** (교정 ⓒ) — 1% 넘게 어긋난 비상시에만 크기 보정.
     *  1% 안쪽 정합은 tuneSeam(경로) 몫: font-size 는 1/64px 양자화라 미세 조정 불능.
     *  ⚠ 목표는 **살아 있는 경로 길이** — 옛 값을 쓰면 튜닝을 도로 부순다. */
    const fitToPath = (el: SVGTextElement, unitCount: number) => {
      const w = unitWidth(unitCount)
      if (!(w > 0)) return
      const goal = pathEl.getTotalLength() - SEAM_MARGIN
      if (Math.abs(w - goal) / goal < 0.01) return
      const base = parseFloat(getComputedStyle(el).fontSize) || 7.2
      // ⚠ **절대 상하한** — 측정이 어떤 방식으로 틀리더라도 크기 폭발은 막는다.
      //   구제의 존재 이유는 "넓은 폴백 서체를 줄이는 것"뿐: 7.2px 를 넘겨 키울
      //   일은 설계상 없고(+2% 는 엔진 오차 허용), 4.5px 밑은 어떤 폴백에도 없다.
      //   (실기기 iOS 에서 측정 오해가 21.6px 를 만든 사고의 마지막 방어선)
      const size = Math.min(7.35, Math.max(4.5, (base * goal) / w))
      el.style.fontSize = `${size.toFixed(4)}px`
      if (probe) probe.style.fontSize = el.style.fontSize
    }

    /** 이음매 런타임 튜닝 (교정 ⓑ) — δ = (경로에서 사라지는 오프셋) − (나타나는
     *  오프셋). δ>0 이면 같은 글자가 양 끝에 겹치고, δ<0 이면 한 자씩 사라진다.
     *  피치는 엔진마다 달라 CSS 로는 못 맞추고(전부 1/64px 양자화) **경로 길이**를
     *  δ 만큼 스케일한다. 측정은 화면 밖 2벌 사본으로, 4회마다 rAF 양보. */
    const tuneSeam = async (): Promise<void> => {
      const seam = root.querySelector<SVGTextElement>("text[data-seam]")
      const stp = seam?.querySelector("textPath") as SVGTextPathElement | null
      if (!seam || !stp) return
      const txt = stp.textContent ?? ""
      const per = Math.round(txt.length / 2)
      if (per < 10) return
      let j = per + 10
      while (j < txt.length && txt[j] === " ") j++
      const jj = j - per
      if (jj < 0 || j >= txt.length) return
      seam.style.fontSize = getComputedStyle(textEl).fontSize

      let budget = 0
      const frame = () => new Promise((r) => requestAnimationFrame(r))
      const visible = async (i: number, off: number) => {
        stp.setAttribute("startOffset", String(off))
        let v = false
        try {
          v = stp.getExtentOfChar(i).width > 0.01
        } catch {
          v = false
        }
        if (++budget % 4 === 0) await frame()
        return v
      }
      const edge = async (i: number, lo: number, hi: number) => {
        for (let n = 0; n < 20 && !cancelled; n++) {
          const mid = (lo + hi) / 2
          if (await visible(i, mid)) lo = mid
          else hi = mid
        }
        return (lo + hi) / 2
      }

      // ⚠ 사본의 textPath 폭도 웹킷에선 "경로에 실린 만큼"이라 2벌 폭이 아니다 —
      //   <text> 가 0 이면 프로브(딱 한 벌)로 잰다
      const seamW = seam.getComputedTextLength()
      const P = seamW > 0 ? seamW / 2 : (probe?.getComputedTextLength() ?? 0)
      if (!(P > 0)) return
      for (let pass = 0; pass < 2 && !cancelled; pass++) {
        const Lnow = pathEl.getTotalLength()
        const delta = (await edge(j, -P, 0)) - (await edge(jj, 0, -P))
        if (cancelled || Math.abs(delta) < 0.005 || Math.abs(delta) > Lnow * 0.05) break
        const applied = Number(pathEl.dataset.lzScale || 1) || 1
        const next = applied * ((Lnow - delta) / Lnow)
        pathEl.dataset.lzScale = String(next)
        pathEl.setAttribute("d", scalePosterThreadD(next))
      }
    }

    /** 흐름 개시 — 이음매 튜닝 → 통짜 교체 → rAF 구동. 전부 그어짐이 끝난 **정적인
     *  순간**에 치른다 (경로 d 재작성·통짜 재배치의 리플로우가 스태거 중에 오면
     *  끊겨 보인다).
     *
     *  ⚠ **SMIL 을 버리고 rAF 로 직접 구동한다 (2026-08-14, 실기기 iOS "텍스트의
     *  비약" — 오프셋이 순간이동).** 종전엔 <animate> 2개(램프 freeze → 루프
     *  syncbase 연결)였는데, 이 freeze·syncbase 의 우선순위 처리가 엔진마다 달라
     *  사파리에서 오프셋이 두 애니 사이를 튀었다. rAF 는 어느 엔진에서든 같은 수식
     *  하나로 돈다: offset(t) = −(이동거리(t) mod P) — 모듈러라 루프 재시작 스냅도
     *  원리적으로 없다(피치 측정이 살짝 틀려도 매끄럽게 위상만 밀린다). 프레임당
     *  비용은 SMIL 과 동일 — 어차피 둘 다 textPath 재배치가 지배한다(크롬 60fps 실측). */
    const fireFlow = async () => {
      if (cancelled) return
      await tuneSeam()
      if (cancelled) return
      // ⚠ 성능: 진입용 tspan(474개)을 남긴 채 startOffset 을 굴리면 30fps 로
      // 반토막 난다 — 흐름 직전에 통짜 텍스트로 되돌린다 (원형 그대로)
      const P0 = unitWidth(1) || pathEl.getTotalLength() - SEAM_MARGIN
      const K = Math.max(2, Math.ceil((P0 + pathEl.getTotalLength()) / P0) + 1)
      tp.textContent = `${SAYU_FULL} `.repeat(K)
      fitToPath(textEl, K) // 통짜 기준 재확인 (제 서체면 no-op)
      const P = unitWidth(K) || pathEl.getTotalLength() - SEAM_MARGIN
      /** 경과 t(ms) → 이동 거리(u). 등가속 ½at² (a = SPEED/tr) 로 300ms 에 SPEED 도달
       *  — 종전 SMIL keySplines 등가속과 같은 곡선, 이후 등속. */
      const dist = (tMs: number) => {
        const t = tMs / 1000
        const tr = RAMP_MS / 1000
        return t < tr ? (SPEED / (2 * tr)) * t * t : RAMP_DIST + SPEED * (t - tr)
      }
      // 흐름 시작은 통짜 교체 리플로우가 끝난 다음 프레임 (교정 ⓓ) — 같은 블록에서
      // 시작하면 가속 300ms 가 멈춘 프레임 안에서 소모돼 "가속이 없어" 보인다
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (cancelled) return
          const t0 = performance.now()
          const step = (now: number) => {
            if (cancelled) return
            tp.setAttribute("startOffset", (-(dist(now - t0) % P)).toFixed(3))
            raf = requestAnimationFrame(step)
          }
          raf = requestAnimationFrame(step)
        }),
      )
    }

    fontSettled().then(() => {
      if (cancelled) return
      const wait = Math.max(0, FLOW_START_MS - (performance.now() - mounted))
      timer = setTimeout(() => {
        if (cancelled) return
        // ⚠ 그어짐이 아직 덜 끝났으면 남은 만큼 더 기다린다 — 스태거가 벽시계보다
        //   늦게 시작한 경우(느린 하이드레이션) 벽시계로 자르면 마지막 글자들이
        //   페이드 없이 통짜에 덮인다 (실측 430/474). 시계 = 마지막 tspan 의 CSS 애니.
        const lastChar = tp.querySelector<SVGElement>("tspan:last-of-type")
        const a = lastChar?.getAnimations?.()[0]
        const played = typeof a?.currentTime === "number" ? Math.max(0, a.currentTime as number) : FLOW_START_MS
        const remain = FLOW_START_MS - played
        if (remain > 30) {
          timer = setTimeout(() => void fireFlow(), remain)
          return
        }
        void fireFlow()
      }, wait)
    })
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <svg
      ref={rootRef}
      className={styles.poster}
      viewBox="0 0 400 500"
      role="img"
      aria-label="레이지데이 북클럽 4기 모집"
      // 진입 홀드 동안 덮개 위로 올라오는 유일한 요소 (셸 CSS 가 이 표식을 잡는다)
      data-lz-poster=""
    >
      <defs>
        <path id="heroSayuThread" d={POSTER_THREAD_D} />
      </defs>
      <text className={styles.threadText} xmlSpace="preserve">
        {/* dominantBaseline="central" — 경로는 원본 **글자줄의 중심**(잉크 능선)에 맞춰
            추출돼 있는데 textPath 기본값은 글자를 **베이스라인**에 얹는다. 그대로 두면
            글자가 경로 한쪽으로 2.5u 치우친다 (창 226개 상호상관 실측).
            ⚠ textPath 의 dy 는 크롬에서 무시되고, CSS `.class{dominant-baseline}` 도
            <text> 에만 걸려 안 먹는다 — **textPath 요소의 속성**이어야 한다. */}
        <textPath href="#heroSayuThread" dominantBaseline="central" data-stream>
          {/* 첫 벌 — 글자별 tspan. 딜레이를 draw 이징의 역함수로 깔아, 붓끝이 그
              자리에 닿는 순간 글자가 뜬다 = 시안 ①의 선 긋기와 같은 리듬·속도.
              CSS 애니라 JS 하이드레이션 전·실패 시에도 페인트부터 돈다 */}
          {(() => {
            const chars = `${SAYU_FULL} `.split("")
            const last = chars.length - 1
            return chars.map((c, i) => (
              <tspan
                key={i}
                className={styles.introChar}
                style={{
                  ["--d" as string]: `${(DRAW_MS * drawTimeAt(i / last)).toFixed(1)}ms`,
                }}
              >
                {c}
              </tspan>
            ))
          })()}
        </textPath>
      </text>
      {POSTER_GLYPHS.map((g, i) => (
        <text
          key={i}
          x={g.x}
          y={g.y + POSTER_GLYPH_DY}
          fontSize={g.s}
          textAnchor="middle"
          dominantBaseline="central"
          // 등장 애니 없음 — 처음부터 완성 상태 (운영자 2026-08-12 최종)
          className={styles.glyph}
        >
          {g.ch}
        </text>
      ))}
      {/* 폭 측정용 프로브 — 화면 밖 평문 한 벌 (웹킷의 <text> 폭 0 대비, 교정 ⓒ).
          ⚠ 보이는 본문 **뒤**에 둘 것 — 앞에 두면 검사 도구의 querySelector 가 집는다 */}
      <text className={styles.threadText} data-probe x={0} y={-999} visibility="hidden" aria-hidden xmlSpace="preserve">
        {SAYU_FULL}{" "}
      </text>
      {/* 이음매 측정용 사본 — 같은 경로 위 2벌, 화면 밖 (교정 ⓑ 전용) */}
      <text className={styles.threadText} data-seam visibility="hidden" aria-hidden xmlSpace="preserve">
        <textPath href="#heroSayuThread" dominantBaseline="central">
          {`${SAYU_FULL} `.repeat(2)}
        </textPath>
      </text>
    </svg>
  )
})
