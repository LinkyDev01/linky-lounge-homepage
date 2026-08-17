"use client"

import { memo, useEffect, useRef } from "react"
import {
  POSTER_THREAD_D,
  POSTER_GLYPHS,
  POSTER_GLYPH_DY,
  POSTER_GLYPH_FIT,
  scalePosterThreadD,
  rotatePosterThreadD,
  partialPosterThreadD,
  THREAD_SEG_COUNT,
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

/** 이음매를 **겹침이 아니라 빈틈 쪽으로** 밀어 두는 여유(u, 반 글자).
 *  운영자는 겹침을 결함으로 본다("아이폰으로 보니 겹쳐") — 같은 크기의 빈틈보다
 *  겹침이 훨씬 눈에 띄기 때문. 0 으로 두면 엔진 컷오프 차이로 둘 사이를 진동한다. */
const SEAM_BIAS = 0.5

/** 내비·푸터·스티키 CTA 가 나타나는 시각 — 그어짐 종료(FLOW_START_MS) 기준 −200ms.
 *  LandingShell/DraftShell 이 이 값을 읽어 같은 시계로 움직인다. */
export const CHROME_REVEAL_MS = Math.max(0, FLOW_START_MS - 200)

/** memo — 셸 리빌(내비·푸터 노출)의 리렌더가 그리기 끝 무렵에 오는데, 포스터까지
 *  리렌더되면 474개 tspan 재조정이 프레임을 블록해 마지막 글자들이 뭉텅이로 뜬다. */
export const HeroBreathingPoster = memo(function HeroBreathingPoster() {
  const rootRef = useRef<SVGSVGElement>(null)

  /** ⚠ 크기 확정·노출 경로는 **아래 useEffect 하나뿐이다.**
   *  종전엔 "서체가 이미 준비됐으면 첫 페인트 전에 맞추고 바로 노출"하는 지름길을
   *  useLayoutEffect 에 뒀는데, 그 길은 **평문 폭으로만** 재서 웹킷에서 1.5% 큰 값을
   *  확정하고 그대로 노출해 버렸다(이음매에 글자 7자 구멍). 홀드 중에는 어차피 아무것도
   *  안 보이므로 지름길의 이득이 없다 — 경로 위 실측을 거치는 한 길로 합쳤다. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const mounted = performance.now()
    let cancelled = false
    let raf = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const tp = root.querySelector<SVGTextPathElement>("textPath[data-stream]")
    const pathEl = root.querySelector<SVGPathElement>("#heroSayuThread")
    if (!tp || !pathEl) return
    const textEl = tp.closest("text") as SVGTextElement
    const L0 = pathEl.getTotalLength()
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    /** 본문 **한 벌**의 실제 폭(u) — **화면 밖 평문 프로브 한 곳에서만** 잰다.
     *
     *  ⚠ **경로를 품은 요소의 폭은 엔진마다 뜻이 다르다** (2026-08-15 실제 WebKit
     *  으로 확정. 그전까지는 크롬 흉내로 추정만 했다):
     *    · 크롬  `<text>` = K벌 **전체 advance**  / `<textPath>` = 경로에 실린 만큼
     *    · 웹킷  `<text>`·`<textPath>` **둘 다 경로에 실린 만큼** (벌 수와 무관)
     *  그래서 "0 이면 폴백" 식의 분기가 웹킷에서 **조용히 틀린 값을 통과시켰다** —
     *  4벌 전체로 알고 4로 나눠 한 벌 폭을 1/4 로 재고(흐름 피치가 1/4 → 되감김이
     *  4배 자주 = 운영자가 본 "텍스트의 비약"), 크기 구제는 16% 확대로 오작동했다.
     *
     *  → 경로를 품은 요소는 **측정원에서 통째로 뺀다.** 프로브는 딱 한 벌짜리
     *  평문이라 어느 엔진에서든 뜻이 하나뿐이다(= advance 합). 경로 배치와의
     *  0.03~0.4% 차이는 fitToPath 1% 가드 안이고, 남은 오차는 tuneSeam 이 경로
     *  길이로 턴다. */
    const probe = root.querySelector<SVGTextElement>("text[data-probe]")
    const unitWidth = () => probe?.getComputedTextLength() ?? 0

    // ── 이음매 덮개 경로 (시작점이 반 바퀴 돌아간 같은 실) ────────────────────
    const pathB = root.querySelector<SVGPathElement>("#heroSayuThreadB")
    const pathTmp = root.querySelector<SVGPathElement>("#heroSayuThreadTmp")
    const tpB = root.querySelector<SVGTextPathElement>("textPath[data-stream-b]")
    const textB = (tpB?.closest("text") ?? null) as SVGTextElement | null
    /** 회전 지점 — 세그먼트 목록의 한가운데(≈ 반 바퀴). 첫 경로의 경계가 여기 한복판에 온다 */
    const SEG_B = Math.floor(THREAD_SEG_COUNT / 2)
    /** 두 경로의 오프셋(u): 원래 경로에서 B 의 시작이 놓인 호길이 */
    let offB = 0
    /** 첫 경로가 스케일될 때마다 B 도 같은 배율로 다시 만든다 */
    const syncPathB = () => {
      if (!pathB || !pathTmp) return
      const scale = Number(pathEl.dataset.lzScale || 1) || 1
      pathB.setAttribute("d", rotatePosterThreadD(SEG_B, scale))
      pathTmp.setAttribute("d", partialPosterThreadD(SEG_B, scale))
      offB = pathTmp.getTotalLength()
      if (textB) textB.style.fontSize = getComputedStyle(textEl).fontSize
    }

    /** 서체가 **제 폭으로 안정**될 때까지 기다린다 (교정 ⓐ). fonts.ready 는 동적
     *  서브셋에서 조각 로드가 비는 순간 먼저 resolve 되어 못 믿는다 — 폭이 경로의
     *  ±4% 안에 들고 **직전 측정과 동일**할 때(조각 수신 완료)를 안정으로 본다.
     *  스태거는 이 대기와 무관하게 페인트부터 돌고 있다 (원형 유지). */
    const fontSettled = async () => {
      let loaded = false
      ;(document as Document).fonts
        .load(`400 7.2px "Pretendard Variable"`, SAYU_FULL)
        .then(() => {
          loaded = true
        })
        .catch(() => {
          loaded = true /* 로드 실패 확정도 '더 기다릴 것 없음' — 구제로 넘어간다 */
        })
      // ⚠ **크기 보정은 그어짐이 눈에 보이기 전에, 최대 한 번만** 한다.
      //   그어지는 도중에 바꾸면 글자 크기가 화면에서 바뀌는 게 보인다
      //   (운영자 2026-08-14 "폰트 바뀌는 것 봐봐 왜그래?" — 실기기 iOS 는 서체 폭이
      //   달라 보정이 실제로 일어나므로 그 점프가 눈에 띈다). 이미 그어지기 시작했으면
      //   **미루고**, 흐름 전환(통짜 교체로 어차피 전면 재배치되는 순간)에 맞춘다.
      //   웜 캐시(재방문)면 첫 프레임 전에 끝나 아무도 못 본다.
      let prev = -1
      for (let i = 0; i < 12 && !cancelled; i++) {
        const w = unitWidth()
        if (w > 0 && w === prev && loaded) return
        prev = w
        await new Promise((r) => setTimeout(r, 120))
      }
    }

    const seamEl = root.querySelector<SVGTextElement>("text[data-seam]")
    const seamTp = (seamEl?.querySelector("textPath") ?? null) as SVGTextPathElement | null
    const seamText = seamTp?.textContent ?? ""
    const PER = Math.round(seamText.length / 2) // 한 벌의 글자 수 (474)
    /** 공백은 extent 폭이 0 이라 렌더 판정에 못 쓴다 — 비공백 인덱스만 걸러 둔다 */
    const seamIdx: number[] = []
    for (let i = 0; i < seamText.length; i++) if (seamText[i] !== " ") seamIdx.push(i)

    /** **경로에 실제로 얹히는 글자 수.** 폭이 아니라 개수로 재는 이유:
     *  폭 반환값은 엔진마다 뜻이 달라(크롬=전체 advance, 웹킷=경로에 실린 만큼) 그
     *  해석을 한 번이라도 틀리면 조용히 통과한 채 화면이 깨진다 — 이번 라운드에만
     *  같은 함정에 두 번 빠졌다(1/4 피치, 1.5% 과대). **개수는 해석의 여지가 없다.**
     *  글자는 앞에서부터 순서대로 얹히다 경로 끝에서 잘리므로 "그려짐"은 접두사
     *  성질을 갖는다 → 이분 탐색 10여 회면 끝난다(재배치 1회 + extent 호출 십여 번). */
    const countOnPath = () => {
      if (!seamEl || !seamTp || PER < 10 || seamIdx.length < 20) return 0
      seamEl.style.fontSize = getComputedStyle(textEl).fontSize
      seamTp.setAttribute("startOffset", "0")
      const drawn = (k: number) => {
        try {
          return seamTp.getExtentOfChar(seamIdx[k]).width > 0.01
        } catch {
          return false
        }
      }
      if (!drawn(0)) return 0
      let lo = 0
      let hi = seamIdx.length - 1
      if (drawn(hi)) return seamText.length
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (drawn(mid)) lo = mid
        else hi = mid
      }
      return seamIdx[lo] + 1
    }

    /** 크기 구제 — **한 벌이 경로를 정확히 한 바퀴 채우도록** 맞춘다.
     *  얹힌 글자 수 N 과 한 벌 PER 의 비가 곧 필요한 배율이다(advance ∝ font-size).
     *  잔차(글자 1자 = 0.21%)는 font-size 가 1/64px 양자화라 어차피 못 잡고,
     *  tuneSeam 이 경로 길이로 턴다. */
    const fitToPath = (el: SVGTextElement) => {
      for (let pass = 0; pass < 3; pass++) {
        const n = countOnPath()
        if (!n) return
        const ratio = n / PER
        if (Math.abs(ratio - 1) < 0.004) return // 글자 2자 이내면 충분
        const base = parseFloat(getComputedStyle(el).fontSize) || 7.2
        // ⚠ **절대 상하한 [5.0, 9.6]px** — 측정이 어떤 방식으로 틀려도 크기 폭발
        //   (실기기 iOS ×3 사고)은 막되, 정당한 구제는 양방향 다 허용한다.
        const size = Math.min(9.6, Math.max(5.0, base * ratio))
        if (Math.abs(size - base) < 0.0005) return
        el.style.fontSize = `${size.toFixed(4)}px`
        if (probe) probe.style.fontSize = el.style.fontSize
      }
    }

    /** 경로 위 점 → 호길이. **반드시 좁은 창**(수십 u)만 준다 —
     *  ① 경로가 9곳에서 자기교차하므로 넓게 주면 엉뚱한 곳을 짚고
     *  ② `getPointAtLength` 는 421 세그먼트 경로에서 호출당 0.5ms 라 넓게 훑으면
     *     메인스레드를 통째로 잡는다 (실측: 전 구간 표본표 3벌 = 크롬 8.8초 블록). */
    const arcOfOn = (el: SVGPathElement, pt: { x: number; y: number }, lo: number, hi: number) => {
      const d2 = (t: number) => {
        const q = el.getPointAtLength(t)
        return (q.x - pt.x) ** 2 + (q.y - pt.y) ** 2
      }
      let best = lo
      let bd = Infinity
      for (let t = lo; t <= hi; t += 0.5) {
        const d = d2(t)
        if (d < bd) {
          bd = d
          best = t
        }
      }
      let a = best - 0.5
      let b = best + 0.5
      for (let n = 0; n < 16; n++) {
        const m1 = a + (b - a) / 3
        const m2 = b - (b - a) / 3
        if (d2(m1) < d2(m2)) b = m2
        else a = m1
      }
      return (a + b) / 2
    }
    const arcOf = (pt: { x: number; y: number }, lo: number, hi: number) => arcOfOn(pathEl, pt, lo, hi)

    /** 평문 프로브의 누적 advance — 회전 구동이 "지금 몇 번째 글자인가"를 알아야 한다 */
    const probeX = (i: number) => {
      try {
        return probe ? probe.getStartPositionOfChar(i).x : 0
      } catch {
        return 0
      }
    }

    /** **경로 위 한 벌의 진행거리 A(u)** — 마지막 글자의 시작점을 호길이로 환산하고,
     *  남은 꼬리(2자)만 평문 advance 로 더한다. 경로에 실린 글자만 좌표가 나오므로
     *  끝에서 두 번째 글자를 쓴다. */
    const measurePitch = () => {
      if (!seamEl || !seamTp || PER < 10) return 0
      seamEl.style.fontSize = getComputedStyle(textEl).fontSize
      seamTp.setAttribute("startOffset", "0")
      // ⚠ 끝에서 12번째 글자를 쓴다 — 마지막 글자는 경로 끝에 걸쳐 있어, 정합이 조금만
      //   어긋나도 경로 밖으로 떨어져 좌표가 못 나온다(그러면 측정이 아래로 발산해
      //   경로가 계속 줄어든다: 실측 L 2736 → 2720, 이음매에 글자 2자 구멍).
      const j = Math.max(1, PER - 12)
      let pt: { x: number; y: number } | null = null
      try {
        pt = seamTp.getStartPositionOfChar(j)
      } catch {
        return 0
      }
      if (!pt || (pt.x === 0 && pt.y === 0)) return 0
      const L = pathEl.getTotalLength()
      // 창은 **평문 비율로 예측한 지점 ±25u** 만 — `getPointAtLength` 가 호출당 0.5ms 라
      // 220u 창(440 표본)을 두 번 돌면 전환 프레임이 1.1초로 늘어난다(크롬 실측).
      const guessPlain = probeX(j) - probeX(0)
      const guessTotal = unitWidth() || 1
      const guess = (guessPlain / guessTotal) * L
      const arc = arcOf(pt, Math.max(0, guess - 25), Math.min(L, guess + 25))
      // ⚠ 평문 폭과 경로 폭을 **더하지 않는다**(웹킷에선 단위가 다르다) — j 까지의 비로
      //   전체를 외삽한다. 비례식이라 두 단위가 섞이지 않는다.
      const plainJ = probeX(j) - probeX(0)
      const plainTotal = unitWidth()
      if (!(plainJ > 0 && plainTotal > 0)) return 0
      const A = (arc * plainTotal) / plainJ
      return A > L * 0.85 && A < L * 1.15 ? A : 0
    }

    /** 이음매 정합 — **경로 길이를 한 벌의 진행거리에 맞춘다.** 회전 구동에서 이음매가
     *  안 보일 조건은 단순하다: 닫힌 루프의 둘레 L 과 한 벌의 진행거리 A 가 같을 것.
     *  font-size 는 1/64px 양자화라 A 를 미세 조정할 수 없으니, 손잡이는 경로 쪽이다.
     *  ⚠ 종전 구현(음수 오프셋 이분 탐색으로 δ 측정)은 **웹킷에서 원리적으로 불가**했다
     *  — 웹킷은 경로 용량을 넘는 글자를 아예 렌더하지 않아 음수 오프셋을 주면 글자가
     *  사라지기만 한다. 좌표 기반 측정은 두 엔진에서 같은 뜻이다. */
    const tuneSeam = () => {
      for (let pass = 0; pass < 2; pass++) {
        const A = measurePitch()
        if (!(A > 0)) return
        const L = pathEl.getTotalLength()
        // ⚠ 루프를 한 벌보다 **반 글자만큼 길게** 잡는다. 딱 맞추면 엔진의 가장자리
        //   컷오프가 위상에 따라 오락가락해 이음매가 **겹침 ↔ 빈틈을 번갈아** 한다
        //   (실제 WebKit 실측 −7.6u ~ +6.8u 진동 = 운영자 "아이폰으로 보니 겹쳐").
        //   살짝 여유를 두면 겹침 쪽으로는 절대 넘어가지 않고 항상 작은 빈틈만 남는다
        //   — 크롬이 원래 보이던 상태(빈틈 9~14u)와 같은 성격이다.
        const goal = A + SEAM_BIAS
        if (Math.abs(goal - L) < 0.05) return
        const applied = Number(pathEl.dataset.lzScale || 1) || 1
        const next = applied * (goal / L)
        if (!(next > 0.9 && next < 1.1)) return
        pathEl.dataset.lzScale = String(next)
        pathEl.setAttribute("d", scalePosterThreadD(next))
      }
    }

    /** 흐름 개시 — 이음매 정합 → 통짜 교체 → rAF 구동. 전부 그어짐이 끝난 **정적인
     *  순간**에 치른다 (경로 d 재작성·통짜 재배치의 리플로우가 스태거 중에 오면 끊겨 보인다).
     *
     *  ⚠ **구동 방식 전환 (2026-08-15, 실제 WebKit 실측).** 종전엔 본문을 K벌 이어
     *  붙여 두고 `startOffset` 을 음수로 계속 밀었다. 크롬에선 앞 벌이 빠진 만큼 뒷 벌이
     *  들어와 늘 474자가 유지되지만, **웹킷은 경로 용량을 넘는 글자를 아예 렌더하지
     *  않는다** — 뒷 벌이 영영 안 들어와 실이 앞에서부터 비어 간다
     *  (실측: +20초 450자 → +40초 412자 → +70초 359자, 시작점인 「레」 왼쪽부터 사라짐).
     *  운영자 "ios 미리보기에선 이상하고 크롬은 괜찮아" 의 정체다.
     *
     *  → **오프셋 대신 글자열을 회전시킨다.** 표시 문자열은 늘 한 벌 + 꼬리 3자이고,
     *  `startOffset` 은 **글자 한 칸 안(−6u ~ 0)** 에서만 논다. 한 칸을 넘어가면 문자열을
     *  한 글자 돌리고 오프셋을 되돌린다 — 화면상 움직임은 완전히 동일한 등속 흐름이고,
     *  두 엔진 모두 경로가 늘 꽉 찬다. 회전은 0.58초에 한 번(10u/s ÷ 5.8u)뿐이다. */
    const fireFlow = () => {
      if (cancelled) return
      const UNIT = `${SAYU_FULL} `
      const N = UNIT.length
      const TWICE = UNIT + UNIT + UNIT
      // ⚠ 성능: 진입용 tspan(474개)을 남긴 채 굴리면 30fps 로 반토막 난다 — 통짜로 되돌린다.
      // ⚠ **여기서 크기를 바꾸지 않는다** (운영자 2026-08-14 "이번에도 바뀌어").
      // ⚠ **경로 밖으로 나가는 글자를 아예 주지 않는다.** 웹킷은 경로를 벗어난 글자를
      //   버리지 않고 **양 끝에 눌러 쌓아** 글자가 포개진다 (실제 WebKit 확대 캡처로 확인
      //   — 운영자 "아이폰으로 보니 겹쳐"). 크롬은 버린다. 그래서 매 프레임 **실을
      //   채우는 만큼만** 잘라 넘긴다: 시작 글자 m 과 글자 수 c 를 누적표에서 바로 계산.
      let rotM = -1
      let rotC = -1
      let rotBM = -1
      let rotBC = -1
      let offBFix = 0
      const setRotB = (m: number, c: number) => {
        if (m === rotBM && c === rotBC) return
        rotBM = m
        rotBC = c
        if (tpB) tpB.textContent = TWICE.slice(m, m + c)
      }
      const setRot = (m: number, c: number) => {
        if (m === rotM && c === rotC) return
        rotM = m
        rotC = c
        tp.textContent = TWICE.slice(m, m + c)
      }
      setRot(0, N)
      // ⚠ **여기서 경로를 건드리지 않는다.** tuneSeam 은 경로를 0.5% 안팎으로 스케일하는데,
      //   그러면 실 위 글자가 **전부 조금씩 움직인다** — 흐름이 시작되는 순간 글자가
      //   커졌다/자리가 바뀐 것처럼 보인다 (운영자 "폰트사이즈도 변경이 되어보여 …
      //   정확히 말하면 폰트사이즈인지 위치와 간격인지 모르겠어"). 크롬은 배율이 1 에
      //   가까워 티가 안 나고 iOS 는 0.994 라 보였다 — "어떨 땐 변경되고 어떨 땐 안 돼"의
      //   정체. 크기도 경로도 **노출 전에 이미 확정**돼 있다(revealOnce).
      if (cancelled) return

      /** 글자별 누적 진행거리 — **평문 프로브의 누적치를 경로 실측 피치에 맞춰 환산**한다.
       *  회전 보정이 정확하려면 자의 전체 길이가 경로와 같아야 한다: 평문 advance 를 그냥
       *  쓰면 웹킷에서 1.5% 씩 어긋나 한 바퀴에 40u 를 밀렸다가 되돌아오는 미끄러짐이 생긴다.
       *  전체 배율만 맞추면 남는 건 글자별 커닝 차이(0.1% 미만)뿐이고, 그건 한 바퀴 내내
       *  고르게 퍼져 눈에 띄지 않는다.
       *  ⚠ 글자마다 경로 좌표를 호길이로 환산하는 정공법은 **크롬에서 8.8초를 블록**했다
       *  (경로 질의가 호출당 0.5ms). 환산은 곱셈 한 번이다. */
      const cum: number[] = []
      {
        const raw: number[] = []
        for (let i = 0; i < N; i++) raw.push(probeX(i) - probeX(0))
        const rawTotal = unitWidth() || raw[N - 1]
        const L = pathEl.getTotalLength()
        const k = rawTotal > 0 ? L / rawTotal : 1
        for (let i = 0; i < N; i++) cum.push(raw[i] * k)
        cum.push(L)
      }
      const total = cum[N]
      const usable = total > 0 && cum[1] > 0
      /** 누적표를 한 바퀴 넘어서까지 이어 읽는다 (회전한 문자열의 꼬리 계산용) */
      const cumAt = (i: number) => (i <= N ? cum[i] : total + cum[i - N])

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
          let k = 0
          let c = N
          let last = 0
          const step = (now: number) => {
            if (cancelled) return
            const d = usable ? dist(now - t0) % total : 0
            if (d < last) k = 0 // 한 바퀴 돌았다
            last = d
            while (k + 1 < N && cum[k + 1] <= d) k++
            // ⚠ **오프셋을 음수로 두지 않는다.** 크롬은 경로 앞으로 밀려난 글자를 버리지만
            //   **웹킷은 경로 시작에 그대로 쌓아** 두 글자가 포개진다 (실제 WebKit 확대
            //   캡처로 확인 — 운영자 "아이폰으로 보니 겹쳐"). 그래서 한 글자 더 회전시켜
            //   **양수 오프셋**(0 ~ 한 글자)으로 같은 위치를 표현한다: 글자 m 은 어차피
            //   arc = cum[m] − d 에 놓여야 하고, 그 값이 양수가 되도록 m = k+1 을 쓴다.
            //   결과는 크롬과 같은 성격 — 이음매에 한 글자 이하의 작은 빈틈만 남는다.
            const m = k + 1
            const off = Math.max(0, cum[m] - d)
            // 이 오프셋에서 실에 **완전히** 들어가는 글자 수만 넘긴다 (위 주석)
            // 직전 값에서 ±1 만 조정한다 — 0 부터 세면 매 프레임 수백 번 도는 데다,
            // 그 결과가 한 글자라도 달라지면 474자 재배치가 다시 걸린다
            //   ⚠ 여유 한 글자를 더 뺀다 — 엔진은 advance 가 아니라 **글리프 상자**가
            //   경로 안에 들어와야 그리는데, 그 상자는 advance 보다 클 수 있다. 딱 맞춰
            //   넘기면 마지막 글자가 경로 끝에 눌려 앞 글자와 포개진다(웹킷 확대 캡처).
            //   ⚠ 여유는 **두 글자 반**. 엔진의 경로상 advance 는 누적표(평문 기준)와
            //   미세하게 달라, 딱 맞춰 넘기면 웹킷이 마지막 한두 글자를 경로 끝에 눌러
            //   쌓는다(확대 캡처로 확인). 넉넉히 잘라도 **잘린 몫은 덮개 경로가 그대로
            //   이어 그리므로** 화면에는 아무 차이가 없다 — 안전한 쪽으로 크게 잡는다.
            const room = total - off - (3.5 * total) / N
            while (c > 1 && cumAt(m + c) - cum[m] > room) c--
            while (c < N && cumAt(m + c + 1) - cum[m] <= room) c++
            setRot(m, c)
            tp.setAttribute("startOffset", off.toFixed(3))
            // 첫 경로 끝에서 잘려 나간 글자들을 **덮개 경로**에 얹는다 — 이게 있어야
            // 실이 진짜 한 바퀴 도는 것처럼 보인다 (경계가 상대 경로 한복판에 숨는다)
            if (tpB) {
              const bCount = N - c
              if (bCount > 0 && offB > 0) {
                // 덮개는 **A 와 두 글자를 겹쳐서** 시작한다. 같은 글자가 같은 자리에
                // 포개지므로 화면상 차이가 없고, 그 두 글자가 곧 **정렬 기준자**가 된다.
                const OVER = 2
                const bStartIdx = m + c - OVER
                const arcS = off + (cumAt(bStartIdx) - cum[m])
                setRotB(bStartIdx, bCount + OVER)
                const base = Math.max(0, arcS - offB)
                tpB.setAttribute("startOffset", Math.max(0, base + offBFix).toFixed(3))
                // ⚠ 두 경로의 오프셋은 **계산이 아니라 실측**으로, 그것도 **매 프레임**
                //   맞춘다. 세그먼트를 돌려 만든 경로라 이론상 오차가 없어야 하고 크롬은
                //   실제로 맞았지만, 웹킷의 호길이 계산은 근사라 한 글자 가까이 어긋났고
                //   그 오차가 위치마다 조금씩 달라 **한 번 맞춘 상수로는 유지되지 않았다**.
                //   → 겹쳐 놓은 기준 글자가 A 쪽 같은 글자에 포개지도록, 어긋난 양을
                //   경로 접선 방향으로 투영해 그만큼 되민다(1스텝 뉴턴, 한 프레임에 수렴).
                //   비용은 프레임당 getExtentOfChar 세 번뿐이다.
                //   ⚠ **한 프레임에 최대 3스텝**. 회전(문자열 교체)이 일어난 프레임에는
                //   기준점이 한 글자만큼 튀는데, 1스텝만 돌리면 그 프레임이 어긋난 채로
                //   그려진다 — 웹킷은 프레임이 길어(헤드리스 ~85ms) 그 한 프레임이
                //   눈에 띈다. 수렴하면 즉시 빠져나오므로 평상시 비용은 그대로다.
                for (let step2 = 0; step2 < 3; step2++) {
                  let moved = false
                  for (let k2 = 0; k2 < OVER + 2; k2++) {
                    try {
                      const ae = tp.getExtentOfChar(c - OVER + k2)
                      const be = tpB.getExtentOfChar(k2)
                      const be2 = tpB.getExtentOfChar(k2 + 1)
                      if (!(ae.width > 0.01 && be.width > 0.01 && be2.width > 0.01)) continue
                      const tx = be2.x - be.x
                      const ty = be2.y - be.y
                      const tl = Math.hypot(tx, ty)
                      if (!(tl > 0.1)) continue
                      const delta = ((ae.x - be.x) * tx + (ae.y - be.y) * ty) / tl
                      if (Math.abs(delta) > 0.03 && Math.abs(delta) < 20) {
                        offBFix += delta
                        tpB.setAttribute("startOffset", Math.max(0, base + offBFix).toFixed(3))
                        moved = true
                      }
                      break
                    } catch {
                      /* 다음 후보 글자 */
                    }
                  }
                  if (!moved) break
                }
              } else if (rotBM !== -1) {
                rotBM = -1
                tpB.textContent = ""
              }
            }
            raf = requestAnimationFrame(step)
          }
          raf = requestAnimationFrame(step)
        }),
      )
    }

    /** 크기를 확정하고 **한 번만** 노출한다. 홀드 중에는 CSS 가 스태거를
     *  `animation-play-state: paused` 로 **시각 0 에 세워 두므로**, 속성을 떼는
     *  순간 처음부터 그어진다.
     *  ⚠ 종전엔 `animation: none` 클래스를 붙였다 떼는 리스타트 수법을 썼는데
     *  **웹킷에서 안 먹었다** (실제 WebKit 실측: 노출 시점에 이미 458/474 가 떠
     *  있어 그어짐 없이 통짜로 나타났다 — 운영자 "ios 미리보기에선 이상하고").
     *  일시정지는 어느 엔진에서든 규격대로 동작한다.
     *  @returns 그어짐이 실제로 시작한 시각 */
    const revealOnce = () => {
      if (!textEl.hasAttribute("data-hold")) return mounted
      // 크기(글자)와 둘레(경로)를 **여기서 다 확정**한다. 둘은 서로를 바꾸므로 두 번
      // 번갈아 돌린다. 노출 후에는 어느 쪽도 다시 건드리지 않는다 — 흐름이 시작될 때
      // 경로를 스케일하면 글자가 전부 조금씩 움직여 "크기가 바뀐 것처럼" 보인다
      // (운영자 2026-08-15 "폰트사이즈도 변경이 되어보여 … 어떨 땐 변경되고 어떨 땐 안 돼").
      fitToPath(textEl)
      tuneSeam()
      fitToPath(textEl)
      tuneSeam()
      syncPathB()
      textEl.removeAttribute("data-hold")
      watchLateFont()
      // 셸(내비·푸터)은 마운트 기준 벽시계로 도는데 그어짐이 늦게 시작했으므로,
      // 실제 시작 시각을 알려 리빌 타이머를 다시 걸게 한다 (없으면 내비가 먼저 뜬다)
      window.dispatchEvent(
        new CustomEvent("lz:hero-draw-start", { detail: { revealInMs: CHROME_REVEAL_MS } }),
      )
      return performance.now()
    }

    /** **늦게 도착한 서체 구제** (2026-08-15, 운영자 실기기 "이음부분 누락").
     *  안전핀이 먼저 터지면 폴백 서체 기준으로 크기가 확정된 채 노출되는데, 그 뒤에
     *  진짜 서체(Pretendard, 폴백보다 14% 좁다)가 들어오면 한 벌이 실보다 **훨씬 짧아져
     *  실 끝에 수십 글자 길이의 빈 구간**이 남는다 — 실기기 스크린샷의 그 공백이다.
     *  로컬(localhost)에서는 서체가 1초 안에 와서 재현되지 않았다.
     *  ⚠ 노출 뒤 크기를 바꾸는 건 원칙적으로 금지지만(운영자 "이번에도 바뀌어"),
     *  **실이 통째로 비는 것보다는 한 번의 보정이 낫다.** 그래서 **2% 넘게 어긋난
     *  경우에만** 한 번 고치고 감시를 끝낸다. 정상 경로(서체가 제때 도착)에서는
     *  폭이 그대로라 아무 일도 일어나지 않는다. */
    let lateWatch: ReturnType<typeof setInterval> | null = null
    const watchLateFont = () => {
      const base = unitWidth()
      if (!(base > 0) || lateWatch) return
      let ticks = 0
      lateWatch = setInterval(() => {
        if (cancelled || ++ticks > 30) {
          if (lateWatch) clearInterval(lateWatch)
          lateWatch = null
          return
        }
        const now = unitWidth()
        if (!(now > 0) || Math.abs(now - base) / base < 0.02) return
        if (lateWatch) clearInterval(lateWatch)
        lateWatch = null
        fitToPath(textEl)
        tuneSeam()
        fitToPath(textEl)
        tuneSeam()
        syncPathB()
      }, 500)
    }

    // ⚠ **안전핀.** 홀드는 "확정될 때까지 안 보인다"는 약속이라, 확정 경로가 어디서든
    //   막히면 본문이 **영영 안 보인다** (2026-08-14 정지 사고와 같은 부류). 무슨 일이
    //   있어도 이 시각엔 노출한다 — revealOnce 는 멱등이라 정상 경로와 충돌하지 않는다.
    //   ⚠ 3초는 **실기기 모바일 회선에 짧았다** — Pretendard 동적 서브셋은 요청이 수십
    //   개라 3초를 넘기기 쉽고, 그러면 폴백 기준으로 크기가 굳는다(위 watchLateFont).
    //   6초로 늘려 정상 도착 확률을 높이고, 그래도 늦으면 구제가 받는다.
    const pin = setTimeout(() => {
      if (!cancelled) revealOnce()
    }, 6000)

    // 모션 최소화: 흐름·서체 대기 없이 그 자리에서 노출 (CSS 가 스태거를 끈다).
    // ⚠ 종전엔 여기서 그냥 return 해 **data-hold 가 남아 본문이 통째로 안 보였다.**
    if (reduced) {
      revealOnce()
      return () => {
        cancelled = true
        clearTimeout(pin)
        if (lateWatch) clearInterval(lateWatch)
      }
    }

    fontSettled().then(() => {
      if (cancelled) return
      const drawFrom = revealOnce()
      const wait = Math.max(0, FLOW_START_MS - (performance.now() - drawFrom))
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
      clearTimeout(pin)
      if (lateWatch) clearInterval(lateWatch)
      if (timer) clearTimeout(timer)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      {/* JS 가 없으면 data-hold 를 뗄 수 없다 — 그 경우 기본 크기로라도 보이게 */}
      <noscript>
        <style>{`svg[data-lz-poster] text[data-hold]{opacity:1!important}`}</style>
      </noscript>
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
        {/* **이음매를 덮는 두 번째 경로** — 같은 실인데 시작점만 반 바퀴 돌아가 있다.
            `<textPath>` 에는 루프 개념이 없어 경로 끝에서 글자가 잘리고 시작에서 다시
            얹히는데(= "종료 위치에서 삭제되고 시작 위치에서 생성"), 그 경계를 없앨 수는
            없어도 **다른 데로 옮길 수는 있다**. 이 경로의 한복판이 곧 첫 경로의 경계라,
            거기서 잘려 나간 두어 글자를 여기에 얹으면 화면엔 경계가 남지 않는다.
            d 는 런타임에 채운다(첫 경로가 스케일될 때마다 같이 갱신). */}
        <path id="heroSayuThreadB" data-thread-b d="" />
        {/* 두 경로의 오프셋(= 회전 지점까지의 호길이)을 재는 용도 */}
        <path id="heroSayuThreadTmp" data-thread-tmp d="" />
      </defs>
      {/* data-hold — 크기 확정 전까지 안 보인다 (CSS). 확정 즉시 TSX 가 떼고, 그때
          스태거를 처음부터 한 번 건다. JS 가 죽으면? 아래 noscript 가 걷어 준다. */}
      <text className={styles.threadText} data-hold="1" xmlSpace="preserve">
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
      {/* 이음매 덮개 본문 — 첫 경로 끝에서 잘린 두어 글자만 여기에 얹힌다 (위 defs 주석) */}
      <text className={styles.threadText} data-seam-cover xmlSpace="preserve">
        <textPath href="#heroSayuThreadB" dominantBaseline="central" data-stream-b />
      </text>
      {POSTER_GLYPHS.map((g, i) => (
        <text
          key={i}
          // 글자별 미세 보정 fx/fy — 원본 서체와 Pretendard Black 의 좌우 여백 차이를
          // 겹쳐 보기 실측으로 상쇄한다 (poster-thread.ts 의 POSTER_GLYPH_FIT 주석)
          x={g.x + (POSTER_GLYPH_FIT[i]?.fx ?? 0)}
          y={g.y + POSTER_GLYPH_DY + (POSTER_GLYPH_FIT[i]?.fy ?? 0)}
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
      {/* ⚠ 두 측정 사본은 `visibility:hidden` 이 아니라 **opacity 0 + 화면 밖**이다.
          웹킷은 visibility:hidden 요소의 텍스트 측정 API 를 신뢰할 수 없게 만들 수
          있어(레이아웃 생략), 그러면 iOS 에서 이음매 튜닝이 통째로 불발한다 —
          경로 시작점이 「레」 왼쪽이라 그 실패가 곧 "레 왼쪽 텍스트 겹침"으로 보인다
          (운영자 2026-08-14). opacity 0 은 레이아웃이 반드시 돌아 어느 엔진에서든 잰다. */}
      <text
        className={styles.threadText}
        data-probe
        x={0}
        y={-999}
        opacity={0}
        pointerEvents="none"
        aria-hidden
        xmlSpace="preserve"
      >
        {SAYU_FULL}{" "}
      </text>
      {/* 이음매 측정용 사본 — 같은 경로 위 2벌 (교정 ⓑ 전용). 경로 위라 화면 밖으로
          뺄 수 없어 opacity 0 으로만 감춘다 */}
      <text className={styles.threadText} data-seam opacity={0} pointerEvents="none" aria-hidden xmlSpace="preserve">
        <textPath href="#heroSayuThread" dominantBaseline="central">
          {`${SAYU_FULL} `.repeat(2)}
        </textPath>
      </text>
    </svg>
    </>
  )
})
