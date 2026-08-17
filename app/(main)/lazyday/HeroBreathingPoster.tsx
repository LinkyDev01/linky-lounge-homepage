"use client"

import { memo, useEffect, useRef } from "react"
import {
  POSTER_THREAD_D,
  POSTER_GLYPHS,
  POSTER_GLYPH_DY,
  POSTER_GLYPH_FIT,
  scalePosterThreadD,
  overrunPosterThreadD,
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
/** 큰 글자 12자 — 서체 로드 대기에 같이 건다 (같은 서브셋 파일의 900 굵기) */
const POSTER_GLYPH_TEXT = POSTER_GLYPHS.map((g) => g.ch).join("")
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

/** 오버런 세그먼트 수 — 경로를 루프보다 이만큼 더 길게 만든다(≈8세그먼트 ≈ 52u ≈ 9글자).
 *  글자 한 칸(≈6u)만 넘으면 충분하지만, 서체가 달라 한 벌이 조금 길어져도 버티도록 넉넉히. */
const OVERRUN_SEGS = 8 // = 52.0u (노드 간격 6.5u 기준). 필요량 ≈ 7.2u 이므로 7배 여유

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
    /** 늦은 서체 구제 전용 타이머 — 흐름 예약(timer)과 겹치면 서로의 손잡이를 잃는다 */
    let settleTimer: ReturnType<typeof setTimeout> | null = null

    const tp = root.querySelector<SVGTextPathElement>("textPath[data-stream]")
    const pathEl = root.querySelector<SVGPathElement>("#heroSayuThread")
    if (!tp || !pathEl) return
    const textEl = tp.closest("text") as SVGTextElement
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

    /** 측정 전용 **순수 루프** — 크기·이음매 정합은 여기서만 잰다.
     *  보이는 경로(#heroSayuThread)는 오버런이 붙어 루프보다 길어서 기준이 못 된다. */
    const loopEl = root.querySelector<SVGPathElement>("#heroSayuLoop")
    /** 실의 둘레(u) — 흐름의 주기이자 한 벌이 채워야 할 길이 */
    const loopLen = () => loopEl?.getTotalLength() ?? pathEl.getTotalLength()
    /** 경로 스케일은 **보이는 경로와 측정용 루프에 같이** 걸어야 한다 */
    const setScale = (k: number) => {
      pathEl.dataset.lzScale = String(k)
      pathEl.setAttribute("d", overrunPosterThreadD(OVERRUN_SEGS, k))
      loopEl?.setAttribute("d", scalePosterThreadD(k))
    }

    /** 서체가 **제 폭으로 안정**될 때까지 기다린다 (교정 ⓐ). fonts.ready 는 동적
     *  서브셋에서 조각 로드가 비는 순간 먼저 resolve 되어 못 믿는다 — 폭이 경로의
     *  ±4% 안에 들고 **직전 측정과 동일**할 때(조각 수신 완료)를 안정으로 본다.
     *  스태거는 이 대기와 무관하게 페인트부터 돌고 있다 (원형 유지). */
    const fontSettled = async () => {
      let loaded = false
      // 실 위 본문(400)과 큰 글자(900)가 **같은 서브셋 파일**에서 나온다 — 둘 다 건다.
      // ⚠ 대상은 자체 호스팅 서브셋(`Pretendard Poster`)이다. 종전엔 CDN 동적 서브셋
      //   (`Pretendard Variable`)을 기다렸는데, 조각이 수십 개라 실기기에서 언제 끝날지
      //   알 수 없었다 (module.css @font-face 주석 — 로드별 크기 편차의 원인).
      Promise.all([
        (document as Document).fonts.load(`400 8.28px "Pretendard Poster"`, SAYU_FULL),
        (document as Document).fonts.load(`900 36px "Pretendard Poster"`, POSTER_GLYPH_TEXT),
      ])
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
      // ⚠ 상한은 **안전핀(6초)보다 짧되 충분히** 길어야 한다. 12회(1.44초)로는 모바일
      //   회선에서 사실상 항상 폴백 폭으로 크기가 굳고, 뒤늦게 온 진짜 서체를
      //   watchLateFont 가 고치느라 **보이는 보정**이 한 번 생긴다. 홀드 중에는 아무것도
      //   안 보이므로 더 기다리는 비용이 없다 — 40회(4.8초)로 늘려 정상 경로에서
      //   보정이 아예 일어나지 않게 한다.
      // ⚠ 폭이 두 번 같다고 다 온 게 아니다 — CDN 동적 서브셋 시절엔 조각 도착 사이의
      //   **잠깐의 소강**이 그대로 '안정'으로 읽혀, 절반만 온 서체로 크기가 굳고 나머지
      //   조각이 뒤늦게 오면 watchLateFont 가 화면에서 크기를 고쳤다(= 로드마다 다른
      //   결과 + 한 번의 점프). 서체 자체의 준비 여부를 함께 묻는다.
      const faceReady = () => {
        try {
          return (document as Document).fonts.check(`400 8.28px "Pretendard Poster"`, SAYU_FULL)
        } catch {
          return true
        }
      }
      let prev = -1
      for (let i = 0; i < 40 && !cancelled; i++) {
        const w = unitWidth()
        if (w > 0 && w === prev && loaded && faceReady()) return
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
        const base = parseFloat(getComputedStyle(el).fontSize) || 8.28
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
    const arcOf = (pt: { x: number; y: number }, lo: number, hi: number) =>
      arcOfOn(loopEl ?? pathEl, pt, lo, hi)

    /** 평문 프로브의 누적 advance — 회전 구동이 "지금 몇 번째 글자인가"를 알아야 한다 */
    const probeX = (i: number) => {
      try {
        return probe ? probe.getStartPositionOfChar(i).x : 0
      } catch {
        return 0
      }
    }

    /** **한 벌의 경로상 진행거리 A(u) — 직접 측정.**
     *  오버런 경로 덕분에 마지막 글자까지 경로 위에 얹히므로, 그 **끝점**을 호길이로
     *  환산하면 그게 곧 A 다 (추정·외삽 없음).
     *  ⚠ 종전의 비례 외삽은 과대 평가돼 **경로를 키우고 → 글자를 키우고 → 다시 경로를
     *  키우는 되먹임**을 만들었다 — 실측에서 실이 원본보다 4% 커졌다. */
    const measurePitch = () => {
      if (PER < 10) return 0
      const txt = tp.textContent ?? ""
      if (txt.length < PER) return 0
      const prevOff = tp.getAttribute("startOffset")
      tp.setAttribute("startOffset", "0")
      let end: { x: number; y: number } | null = null
      let tailPlain = 0
      for (let t = PER - 1; t >= PER - 6; t--) {
        try {
          const e = tp.getExtentOfChar(t)
          if (e.width > 0.01) {
            end = { x: e.x + e.width, y: e.y + e.height / 2 }
            tailPlain = (unitWidth() || 0) - (probeX(t) - probeX(0)) - e.width
            break
          }
        } catch {
          /* 다음 글자 */
        }
      }
      if (prevOff !== null) tp.setAttribute("startOffset", prevOff)
      else tp.removeAttribute("startOffset")
      if (!end) return 0
      const L = loopLen()
      const A = arcOfOn(pathEl, end, Math.max(0, L - 60), L + 60) + Math.max(0, tailPlain)
      return A > L * 0.9 && A < L * 1.1 ? A : 0
    }

    /** 이음매 정합 — **경로 길이를 한 벌의 진행거리에 맞춘다.** 회전 구동에서 이음매가
     *  안 보일 조건은 단순하다: 닫힌 루프의 둘레 L 과 한 벌의 진행거리 A 가 같을 것.
     *  font-size 는 1/64px 양자화라 A 를 미세 조정할 수 없으니, 손잡이는 경로 쪽이다.
     *  ⚠ 종전 구현(음수 오프셋 이분 탐색으로 δ 측정)은 **웹킷에서 원리적으로 불가**했다
     *  — 웹킷은 경로 용량을 넘는 글자를 아예 렌더하지 않아 음수 오프셋을 주면 글자가
     *  사라지기만 한다. 좌표 기반 측정은 두 엔진에서 같은 뜻이다. */
    const tuneSeam = () => {
      // ⚠ **한 번만**, 그리고 **±1% 안에서만**. 크기 맞춤(글자)과 둘레 맞춤(경로)은 같은
      //   등식을 서로 다른 손잡이로 좇기 때문에, 번갈아 여러 번 돌리면 **서로를 밀어
      //   올린다** — 실측에서 경로가 4% 커져 실 자체가 원본보다 커졌다. 오버런 경로가
      //   들어온 뒤로는 경계에서 글자가 잘리지 않으므로 경로 보정은 잔차 흡수용일 뿐이다.
      for (let pass = 0; pass < 1; pass++) {
        const A = measurePitch()
        if (!(A > 0)) return
        const L = loopLen()
        // ⚠ 루프를 한 벌보다 **반 글자만큼 길게** 잡는다. 딱 맞추면 엔진의 가장자리
        //   컷오프가 위상에 따라 오락가락해 이음매가 **겹침 ↔ 빈틈을 번갈아** 한다
        //   (실제 WebKit 실측 −7.6u ~ +6.8u 진동 = 운영자 "아이폰으로 보니 겹쳐").
        //   살짝 여유를 두면 겹침 쪽으로는 절대 넘어가지 않고 항상 작은 빈틈만 남는다
        //   — 크롬이 원래 보이던 상태(빈틈 9~14u)와 같은 성격이다.
        const goal = A + SEAM_BIAS
        if (Math.abs(goal - L) < 0.05) return
        const applied = Number(pathEl.dataset.lzScale || 1) || 1
        const next = applied * (goal / L)
        if (!(next > 0.97 && next < 1.03)) return
        setScale(next)
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
      const TWICE = UNIT + UNIT
      // ⚠ 성능: 진입용 tspan(474개)을 남긴 채 굴리면 30fps 로 반토막 난다 — 통짜로 되돌린다.
      // ⚠ **여기서 크기도 경로도 건드리지 않는다** — 둘 다 노출 전에 확정돼 있다
      //   (운영자 "이번에도 바뀌어" / "폰트사이즈도 변경이 되어보여").
      let rotM = -1
      const setRot = (m: number) => {
        if (m === rotM) return
        rotM = m
        tp.textContent = TWICE.slice(m, m + N)
      }
      setRot(0)

      /** 글자별 누적 진행거리 — 평문 프로브의 누적치를 **실 둘레**에 맞춰 환산한다.
       *  전체 배율만 맞추면 남는 건 글자별 커닝 차이(0.1% 미만)뿐이고, 그건 한 바퀴 내내
       *  고르게 퍼져 눈에 띄지 않는다.
       *  ⚠ 글자마다 경로 좌표를 호길이로 환산하는 정공법은 **크롬에서 8.8초를 블록**했다
       *  (경로 질의가 호출당 0.5ms). 환산은 곱셈 한 번이다. */
      const cum: number[] = []
      {
        const raw: number[] = []
        for (let i = 0; i < N; i++) raw.push(probeX(i) - probeX(0))
        const rawTotal = unitWidth() || raw[N - 1]
        const L = loopLen()
        const k = rawTotal > 0 ? L / rawTotal : 1
        for (let i = 0; i < N; i++) cum.push(raw[i] * k)
        cum.push(L)
      }
      const total = cum[N]
      const usable = total > 0 && cum[1] > 0

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
          let m = 0
          let last = 0
          const step = (now: number) => {
            if (cancelled) return
            const d = usable ? dist(now - t0) % total : 0
            if (d < last) m = 0 // 한 바퀴 돌았다
            last = d
            // 실 위 글자 i 는 호길이 (cum[i] − d) 에 놓인다. 그 값이 음수가 되는 글자들은
            // **한 바퀴 뒤로 돌아가** 문자열 끝에 붙는다 — 그래서 표시 문자열은 원문을
            // m 글자 회전시킨 한 벌이고, 오프셋은 첫 글자의 호길이 하나면 된다.
            // ⚠ 상한은 **N**(N−1 아님). N−1 에 묶으면 마지막 글자(후행 공백 2.1u)를
            //   소비하지 못해 랩 끝에서 s 가 음수→0 으로 클램프되고, 실이 잠깐 멈췄다
            //   2.1u 뒤로 튄다(랩 주기 ≈ 4분 34초). cum[N]=total 이 이미 있고
            //   TWICE.slice(N, 2N) 도 정확히 한 벌이라 안전하다.
            while (m < N && cum[m] < d) m++
            setRot(m)
            // ⚠ 오프셋은 **항상 0 이상, 글자 한 칸 이하**다. 음수로 두면 웹킷이 밀려난
            //   글자를 버리지 않고 경로 시작에 쌓아 겹친다(실제 WebKit 확대 캡처).
            //   그리고 마지막 글자는 s + 한 벌 ≤ 둘레 + 오버런 안에 들어와 **잘리지 않는다**
            //   — 경로 끝이 글자가 닿지 않는 곳에 있기 때문이다(오버런 경로).
            //   ⚠ 이 `max(0, …)` 은 **시작단의 유일한 방어선**이다. 오버런은 경로
            //   **끝단** 전용이라, 음수 오프셋을 주면 웹킷이 밀려난 글자를 버리지 않고
            //   경로 시작에 쌓는 성질은 그대로다 — 걷어내면 즉시 겹침이 재발한다.
            tp.setAttribute("startOffset", Math.max(0, cum[m] - d).toFixed(3))
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
        // ⚠ **보이는 채로 고치지 않는다.** 그러면 글자가 제자리에서 크기·간격만 바뀌어
        //   화면에서 한 번 확 튄다 (운영자 2026-08-17 "각각 텍스트가 또 확 튀어 위치가").
        //   짧게 지웠다가(0.16s 페이드) 고친 뒤 되살리면 '자리를 잡는' 것으로 읽힌다.
        //   자체 호스팅 전환(2026-08-17) 뒤로는 사실상 도달하지 않는 경로다 — 서체가
        //   같은 오리진 35KB 한 개라 프리로드로 첫 페인트 전후에 붙는다.
        textEl.dataset.settling = "1"
        settleTimer = setTimeout(() => {
          if (cancelled) return
          fitToPath(textEl)
          tuneSeam()
          textEl.dataset.settling = "0"
        }, 180)
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
        if (settleTimer) clearTimeout(settleTimer)
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
      if (settleTimer) clearTimeout(settleTimer)
      if (timer) clearTimeout(timer)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      {/* 포스터 전용 서브셋 서체 — **가장 먼저** 받게 한다 (module.css 의 @font-face 주석).
          글자 크기가 이 서체의 폭으로 확정되므로, 도착이 늦으면 로드마다 크기가 달라진다
          (운영자 2026-08-17 "각각 텍스트가 또 확 튀어 위치가"). 같은 오리진 35KB 한 개라
          프리로드 한 줄이면 첫 페인트 전후로 붙는다.
          ⚠ 동일 오리진이어도 서체 프리로드는 `crossOrigin` 없이는 재사용되지 않고 두 번
          받는다 (CORS 모드가 달라 캐시 항목이 갈린다). */}
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href="/fonts/pretendard-poster-subset.woff2"
        crossOrigin="anonymous"
      />
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
        {/* **오버런 경로** — 닫힌 루프 + 앞부분 8세그먼트를 다시 이어 붙였다. 글자가 경로
            끝에 닿을 일이 없어 잘림·쌓임이 원리적으로 사라진다 (poster-thread.ts 주석). */}
        <path id="heroSayuThread" d={overrunPosterThreadD(OVERRUN_SEGS)} />
        {/* 측정 전용 **순수 루프** — 크기·이음매 정합은 반드시 여기서 잰다.
            오버런 경로에서 재면 한 벌보다 더 들어가 기준이 통째로 틀어진다. */}
        <path id="heroSayuLoop" d={POSTER_THREAD_D} />
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
        <textPath href="#heroSayuLoop" dominantBaseline="central">
          {`${SAYU_FULL} `.repeat(2)}
        </textPath>
      </text>
    </svg>
    </>
  )
})
