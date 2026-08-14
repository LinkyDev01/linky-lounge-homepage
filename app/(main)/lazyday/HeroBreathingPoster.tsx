"use client"

import { useEffect, useRef } from "react"
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
 * 실 = 4기 포스터에서 골격 추출한 실측 한붓 경로(poster-thread.ts), 큰 글자 12자는
 * 실측 좌표에 정적. 〈사유의 기슭〉 전문이 실을 따라 흐른다 — 한쪽 끝에서
 * 글자가 태어나고 반대쪽 끝에서 사라지는 무한 순환 (실이 비는 구간 없음:
 * 본문을 K벌 이어붙여 오프셋을 한 벌 길이로 순환).
 *
 * 2026-08-12 운영자(최종): **큰 글자 12자는 처음부터 떠 있다** — "레이지데이 북클럽
 * 4기 모집 텍스트는 처음부터 뜨고", 생기는 절차만 뺀다.
 * ① 실 위 본문만 2.2초에 걸쳐 스스로 그어진다 (붓끝이 닿는 순서 = draw 이징의
 *    역함수로 깐 글자별 딜레이. 첫 벌만 tspan 분해, CSS 스태거라 JS 없이도 동작).
 *    480자 전부가 경로 위에 렌더된다 (글자 단위 getBBox 실측)
 * ② 실이 다 그어지면(2.4초) **대기 없이 곧바로** 0.3초 등가속 → 정상 속도의 SMIL 무한 흐름
 * 같은 textPath 하나로 진입→흐름을 잇는다 — 첫 벌은 tspan, 이후 벌은 JS가
 * 폰트 로드 후 통짜로 이어붙이고 SMIL(begin=indefinite)을 시각에 맞춰 발화.
 *
 * 모션 원칙 M2의 허용 유형(존재만 하는 배경 루프 + 진입 1회). reduced-motion 이면
 * 진입 스킵(즉시 노출)·흐름 없음 — 한 벌이 경로보다 길어 정지여도 실이 가득 차 보인다.
 */

/** 문단 사이는 **한 칸**. 종전 세 칸(`   `)이었는데, 그 13.5u 짜리 빈 구간이 루프를 돌며
 *  이음매에서 "글자가 사라졌다 생긴다"로 보였다 (운영자 2026-08-14). 원본 실측: 경로 위
 *  잉크 공백은 전 구간 최대 4.75u(=보통 낱말 사이)뿐이고 이음매에도 큰 틈이 없다. */
const SAYU_FULL = `${SAYU_P1} ${SAYU_P2} ${SAYU_P3}`
const SPEED = 10 // px/s (viewBox 단위) — 존재만 하는 배경 속도 (데모 ③ 확정값)

// ── 진입 타이밍 = hero-motion 시안 ①(실선 인트로)의 값 그대로 ────────────────
// 운영자 2026-08-12: "1번 시안처럼 그 속도와 애니메이션으로… 꼬불꼬불 선 대신
// 꼬불꼬불 텍스트가 같은 애니메이션과 속도로 반응하면 되겠어."
// ①은 실을 draw(2200ms, ease inOut(2))로 긋고, 1300ms 부터 큰 글자를 60ms 간격·
// 520ms·out-expo 로 하나씩 띄운다. 여기선 '선' 대신 '문장'이 같은 리듬으로 그어진다.
const DRAW_MS = 2200
const CHAR_DUR_MS = 200 // 그어지는 인상 — 글자 하나의 페이드는 짧게

/** 글자 i(위치 p)가 뜨는 정규화 시각 — 붓끝이 그 자리에 닿는 순간.
 *  기본은 easeInOutQuad(=anime 의 inOut(2))의 역함수지만, 그대로 쓰면 **끝 감속의
 *  꼬리가 길어** 마지막 10% 가 중간 대비 4배 느리게 떠 "다 안 찼는데 멈춘" 인상을 준다
 *  (운영자 "조금 대기가 있어 보인다"). 선형과 섞어 그 꼬리만 완화한다 —
 *  시작의 가속감은 남기고 끝은 등속에 가깝게. */
const TAIL_BLEND = 0.45
function drawTimeAt(p: number) {
  const quad = p < 0.5 ? Math.sqrt(p / 2) : 1 - Math.sqrt((1 - p) / 2)
  return quad * (1 - TAIL_BLEND) + p * TAIL_BLEND
}

/* ⚠ 폐기된 가정 — "한 벌(P) 이 경로(L) 보다 길어 뒤쪽 19% 는 렌더되지 않는다".
   getComputedTextLength(3193) > getTotalLength(2612) 를 근거로 잡았으나, **글자 단위
   getBBox 실측 결과 480자 전부 렌더된다**(경로 밖 글자 0). 그 잘못된 가정으로 넣은
   clamp 가 388번째부터 92자를 2200ms 한 시각에 몰아, 운영자가 지적한
   "'결국 내 기준이'(411번째) 부근부터 끝이 한 번에 생기는" 현상을 만들었다.
   → clamp 제거. 길이 비교는 textPath 배치 폭과 일치하지 않으니 근거로 쓰지 말 것. */

const INTRO_DONE_MS = DRAW_MS + CHAR_DUR_MS // 큰 글자는 정적이라 실 그어짐이 곧 진입 전체

// 흐름 — 정지에서 툭 시작하지 않고 등가속으로 정상 속도까지 올린다.
// 진입 완료 직후 **대기 0** 이므로(운영자 확인 2026-08-12) 가속 자체를 더 빠르게:
// 0.5초 → **0.3초**. 등가속이면 이동 거리는 평균속도 × 시간 = (SPEED/2) × 0.3.
/** 이음매 여유의 **설계 기준값**(u) — 크롬이 경로 양 끝에서 글리프를 안 그리는
 *  가장자리 여백의 합. 이음매가 안 보이려면 한 벌의 advance(피치 P)가
 *  `경로길이 − 이 값` 과 **정확히** 같아야 한다. 그래야 끝에서 사라지는 글자와
 *  시작에서 나타나는 글자가 늘 같은 글자라 화면에서는 아무 일도 일어나지 않는다.
 *  δ = (L − 여백) − P 가 어긋난 양이고, δ<0 이면 **구멍**(글자가 한 자씩 사라진다),
 *  δ>0 이면 **중첩**(같은 글자가 양 끝에 동시에 그려진다). 둘 다 깜빡임으로 보인다.
 *  ⚠ 이 상수는 **폭을 못 재는 브라우저용 폴백**일 뿐이다. 실제 값은 엔진마다 다르고,
 *  피치 P 도 엔진마다 다르므로(같은 서체·크기라도 advance 를 다르게 눌러 담는다)
 *  런타임에 `tuneSeam` 이 δ 를 직접 재서 **경로 길이**로 0 을 맞춘다.
 *  ⚠ CSS 로는 못 맞춘다 — font-size·letter-spacing·word-spacing 이 전부 1/64px 로
 *  양자화돼 474자 기준 최소 조정 폭이 5~7u 다(실측). `textLength` 는 크롬이 textPath
 *  에서 무시한다(실측). 그래서 아래 fitToPath 는 **폴백 서체 구제용**으로만 돈다. */
const SEAM_MARGIN = 1.46

const RAMP_MS = 300
const RAMP_DIST = (SPEED * (RAMP_MS / 1000)) / 2
const FLOW_START_MS = INTRO_DONE_MS // 대기 없이 가속 구간으로 이어 붙인다

/** 내비·푸터·스티키 CTA 가 나타나는 시각. **그어짐 종료(FLOW_START_MS) 기준 오프셋**으로
 *  잡는다 — 운영자가 늘 "애니메이션 종료 기준"으로 지시하므로 그 축을 그대로 쓴다.
 *  변천: +300 → 0 → **−500** (2026-08-12 "0.5초 더 당겨") → **−200** (같은 날
 *  "애니메이션 종료 기준으로 그 푸터와 본문 노출되는 시점을 0.3초 더 늦게").
 *  여전히 그어지는 도중이라 '끝 → 그다음 사건' 이라는 단절은 생기지 않는다.
 *  ⚠ 0 이하로 내려가지 않게 max 로 막는다 (DRAW_MS 를 줄이는 날을 대비)
 *  LandingShell/DraftShell 이 이 값을 읽어 같은 시계로 움직인다 — 두 곳에 숫자를
 *  따로 두면 히어로 타이밍을 고칠 때마다 어긋난다 */
export const CHROME_REVEAL_MS = Math.max(0, FLOW_START_MS - 200)

export function HeroBreathingPoster() {
  const rootRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let cancelled = false
    let anim: SVGAnimateElement | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    const tp0 = root.querySelector<SVGTextPathElement>("textPath[data-stream]")
    const pathEl0 = root.querySelector<SVGPathElement>("#heroSayuThread")
    if (!tp0 || !pathEl0) return
    const textEl0 = tp0.closest("text") as SVGTextElement
    const L = pathEl0.getTotalLength()

    // 서체가 확정될 때까지 그어짐을 **일시정지**한다 (재시작이 아니라 정지 → 재개라
    // 화면에는 "중간에 초기화"가 보이지 않는다. 운영자 2026-08-14 "중간에 한 번
    // 초기화되고 다시 시작되는 부분이 있어"). CSS 는 기본 running 이라 JS 가 죽어도
    // 진입은 그대로 돈다.
    // ⚠ 이미 재생된 양은 **CSS 애니의 currentTime** 으로 읽는다. performance.now() 로
    //   대신하면 안 된다 — 그건 내비게이션 기준이라 번들 로드가 느린 순간(dev 실측
    //   14.5초) 진입이 다 끝난 것으로 오판해 흐름이 **12% 에서 곧장 통짜로 전환**된다
    //   (= 운영자 "완결을 향해가다 갑자기 완성돼").
    // ⚠ **마지막** 글자의 애니를 시계로 쓴다 — currentTime 은 지연(delay) 구간까지 포함해
    //   재는데, 첫 글자는 지연 0·길이 0.2s 라 200ms 에서 멈춰 진입 전체를 못 잰다.
    //   마지막 글자는 지연이 DRAW_MS 라 currentTime 이 곧 '진입 경과 시간'이다.
    const chars = root.querySelectorAll<SVGElement>("textPath[data-stream] > *")
    const clock = chars[chars.length - 1]?.getAnimations?.()[0]
    const played = () => (typeof clock?.currentTime === "number" ? Math.max(0, clock.currentTime) : 0)
    const playedAtPause = played()
    const resume = () => root.style.setProperty("--lz-play", "running")
    root.style.setProperty("--lz-play", "paused")
    // ⚠ **정지에는 반드시 되풀이 못 할 안전핀이 붙어야 한다.** 아래 어느 단계에서 막히든
    //   `--lz-play` 가 paused 로 남으면 실 위 본문이 **영원히 안 보인다**(큰 글자만 뜬
    //   포스터 = 운영자 "애니메이션이 안 보이는데?"). 3초면 어떤 서체 로드보다 길다.
    const failsafe = setTimeout(resume, 3000)

    /** 본문 **한 벌**의 실제 폭(u)을 세 단계로 잰다. ⚠ 크롬은 `<text>` 가 자식
     *  `<textPath>` 안에 글을 담고 있어도 배치 폭을 돌려주지만 **웹킷(iOS·사파리)은
     *  0 을 돌려준다** — 그 0 을 그대로 믿으면 아래 로직이 통째로 불발하고, 실 위
     *  본문이 영원히 안 보인다. 순서: ① `<text>` ② `<textPath>` 자체(둘 다 경로 위
     *  실측이라 정확) ③ 화면 밖 평문 프로브(경로 배치 폭과 0.4% 쯤 다르다). */
    const probe = root.querySelector<SVGTextElement>("text[data-probe]")
    const unitWidth = (unitCount: number) => {
      const w = textEl0.getComputedTextLength() || tp0.getComputedTextLength()
      if (w > 0) return w / unitCount
      return probe?.getComputedTextLength() ?? 0
    }

    /** 본문이 **제 서체로, 실 길이에 맞게** 앉을 때까지 기다린다.
     *  ⚠ `document.fonts.ready` 는 못 믿는다 — 동적 서브셋 CSS 는 글리프가 필요할 때
     *  조각을 늦게 받아오므로 로딩이 잠깐 비는 순간 먼저 resolve 된다. 그 상태의 폭은
     *  **폴백 서체(실측 9.8u, Pretendard 7.1u)** 라, 본문이 실보다 38% 길어져 뒤쪽
     *  28%(「문장 사이에」 이후 전부)가 경로 밖으로 밀려 **아예 안 그려진다**
     *  (운영자 "'서성였을 뿐이다'까지가 전체 길이에 해당하지 않는 건가?"). 게다가 폭이
     *  넓으니 이웃한 줄끼리 겹쳐 보인다. → **길이가 실 길이의 ±4% 안에 들어올 때**
     *  까지(= 진짜 서체가 붙을 때까지) 기다린다. */
    const fontSettled = async () => {
      try {
        await (document as Document).fonts.load(`400 7.2px "Pretendard Variable"`, SAYU_FULL)
      } catch {
        /* 조각 로드가 실패해도 아래 루프의 상한까지 기다린 뒤 크기 보정으로 살린다 */
      }
      // 상한 2.4초 — 이보다 오래 기다리면 실이 빈 포스터가 눈에 띄게 오래 남는다
      for (let i = 0; i < 20 && !cancelled; i++) {
        const w = unitWidth(1)
        if (w > 0 && Math.abs(w - L) / L < 0.04) return
        await new Promise((r) => setTimeout(r, 120))
      }
    }

    /** 본문 한 벌이 실을 **정확히 한 바퀴** 채우도록 글자 크기를 미세 보정한다.
     *  서체 버전이 다르거나 끝내 폴백으로 남더라도 전문이 잘리거나 남지 않는다.
     *  목표 길이는 L − SEAM_SLACK — 이음매에 여유를 남겨야 글자가 깜빡이지 않는다
     *  (구멍 대신 미세 중첩. poster-thread.ts 주석 참조). */
    const fitToPath = (el: SVGTextElement, unitCount: number) => {
      const w = unitWidth(unitCount)
      if (!(w > 0)) return
      const goal = L - SEAM_MARGIN
      // ⚠ **제 서체로 잘 앉아 있으면 손대지 않는다.** 크롬의 font-size 양자화(1/64px =
      //   474자 기준 7.4u) 때문에 미세 보정은 무효이거나 되레 이음매를 7.4u 어긋나게
      //   한다 — 경로 길이 쪽이 이미 P 에 맞춰져 있으므로 그대로 두는 게 정답이다.
      //   1% 넘게 어긋난 때(= 폴백 서체가 남은 비상시)만 크기로 구제한다.
      if (Math.abs(w - goal) / goal < 0.01) return
      const base = parseFloat(getComputedStyle(el).fontSize) || 7.2
      const size = `${((base * goal) / w).toFixed(4)}px`
      el.style.fontSize = size
      if (probe) probe.style.fontSize = size // 프로브도 같이 — 다음 측정이 어긋나지 않게
    }

    /** 이음매를 **엔진에 맞춰 스스로** 맞춘다. 통짜 텍스트가 들어간 뒤 한 번 돈다.
     *
     *  δ = (같은 글자가 경로 끝에서 사라지는 오프셋) − (경로 시작에서 나타나는 오프셋).
     *  δ > 0 이면 그 구간만큼 **두 곳에 동시에** 그려지고(겹쳐 찍힘), δ < 0 이면
     *  **아무 데도 없다**(글자가 한 자씩 사라진다 — 운영자 2026-08-14). δ 는 곧
     *  `(L − 2m) − P` 이므로 **경로를 δ 만큼 줄이면** 0 이 된다.
     *
     *  ⚠ 이 자동 보정이 필요한 이유: 피치 P 는 엔진마다 다른데(같은 서체·크기라도
     *    advance 를 다르게 눌러 담는다) **CSS 로는 P 를 못 고친다** — font-size·
     *    letter-spacing·word-spacing 이 전부 1/64px 로 양자화돼 474자 기준 최소
     *    조정 폭이 5~7u 다(실측). 그래서 **경로 쪽**을 움직인다.
     *
     *  ⚠ **측정은 화면에 없는 사본(`text[data-seam]`, 2벌)으로 한다.** 보이는 본문의
     *    startOffset 을 흔들면 그어짐 도중 글자가 튄다. 게다가 사본이 짧아(950자 대
     *    1900자) 재배치 비용도 절반이다.
     *  ⚠ **프레임을 나눠 쓴다.** 한 번의 재배치가 ~2.6ms 라, 40회를 한 프레임에 몰면
     *    **417ms 짜리 멈춤**이 생겨 흐름이 시작하는 순간 툭 끊긴다(실측). 4회마다
     *    rAF 로 양보하면 어떤 프레임도 16ms 를 넘지 않는다.
     *  ⚠ 한 번이면 수학적으로 충분하다 — 경로를 (L−δ)/L 로 줄이면 L 이 정확히 δ 만큼
     *    줄고 P 는 그대로라 δ 가 0 이 된다. 잔차는 이분 탐색 정밀도(0.003u)뿐. */
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
      // 보이는 본문과 같은 조판이어야 같은 피치가 나온다 (fitToPath 가 크기를 바꿨을 수도)
      seam.style.fontSize = getComputedStyle(textEl0).fontSize

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
        if (++budget % 4 === 0) await frame() // 한 프레임에 4회까지만
        return v
      }
      /** 보임 → 안 보임 경계. 20회면 P/2^20 ≈ 0.003u 까지 좁혀진다 */
      const edge = async (i: number, lo: number, hi: number) => {
        for (let n = 0; n < 20 && !cancelled; n++) {
          const mid = (lo + hi) / 2
          if (await visible(i, mid)) lo = mid
          else hi = mid
        }
        return (lo + hi) / 2
      }

      const P = seam.getComputedTextLength() / 2
      if (!(P > 0)) return
      // 한 번이면 이론상 끝나지만, 이분 탐색 정밀도(0.003u)와 경로 스케일의 비선형성이
      // 0.02u 쯤 잔차를 남긴다 — 그만큼도 위상의 0.3% 에서 글자 하나를 흔든다. 2회.
      for (let pass = 0; pass < 2 && !cancelled; pass++) {
        const Lnow = pathEl0.getTotalLength()
        const delta = (await edge(j, -P, 0)) - (await edge(jj, 0, -P))
        if (cancelled || Math.abs(delta) < 0.005 || Math.abs(delta) > Lnow * 0.05) break
        // scalePosterThreadD 는 **원본 d** 를 기준으로 배율을 매기므로, 이미 보정된
        // 상태(2회차·개발 중 이펙트 재실행)에서는 그 배율에 곱해야 한다
        const applied = Number(pathEl0.dataset.lzScale || 1) || 1
        const next = applied * ((Lnow - delta) / Lnow)
        pathEl0.dataset.lzScale = String(next)
        pathEl0.setAttribute("d", scalePosterThreadD(next))
      }
    }

    fontSettled().then(async () => {
      if (cancelled) return
      // ⚠ **이음매 보정은 그어짐을 재개하기 전에 끝낸다.** 경로 `d` 를 다시 쓰면
      //   textPath 전체가 재배치돼 한 프레임이 0.2~0.4초까지 늘어난다(실측). 흐름
      //   중이나 그어짐 중에 하면 그 순간 툭 끊겨 보이지만, 아직 정지 상태라
      //   화면에서는 아무것도 움직이지 않아 티가 나지 않는다 — 진입 시작만
      //   그만큼 늦어질 뿐이다. (안전핀 3초가 이 대기의 상한을 겸한다)
      await tuneSeam()
      if (cancelled) return
      // ⚠ **무엇보다 먼저 재개한다.** 아래 어느 계산이 실패해 빠져나가더라도 본문은
      //   보여야 한다 — 예전엔 폭 측정이 0 인 브라우저에서 여기서 return 해 버려
      //   실이 영영 정지 상태로 남았다 (운영자 "애니메이션이 안 보이는데?").
      clearTimeout(failsafe)
      resume()
      const tp = tp0
      const textEl = textEl0
      fitToPath(textEl, 1)
      // 크기를 맞췄으므로 한 벌 = L − SEAM_SLACK 이다. 폭을 못 재는 브라우저에선
      // 이 설계값을 그대로 쓴다(측정 불가 = 보정도 없었다는 뜻이라 오차는 서체 차이뿐)
      const P0 = unitWidth(1) || L - SEAM_MARGIN
      // 오프셋이 [-P, 0] 사이를 돌 때 경로 [0, L]이 항상 덮이도록: K×P ≥ P + L.
      // +1벌은 폰트 스왑으로 실측치가 미세하게 달라져도 끝이 비지 않게 하는 보험
      const K = Math.max(2, Math.ceil((P0 + L) / P0) + 1)
      // 남은 진입 시간 = 전체 − (정지 시점까지 재생된 양). 정지 중에는 시계가 멈추므로
      // 재개 직후의 played() 도 같은 값이다 — 어느 쪽으로 읽어도 어긋나지 않는다.
      const wait = Math.max(0, FLOW_START_MS - Math.min(playedAtPause, FLOW_START_MS))
      timer = setTimeout(() => {
        if (cancelled) return
        // ⚠ 성능: 진입용 tspan(480개)을 남긴 채 startOffset 을 굴리면 매 프레임
        // 글자마다 경로 재배치가 일어나 **30fps 로 반토막** 난다 (실측 33.3ms/frame,
        // 운영자 "뻣뻣해 보여"). 흐름 직전에 통짜 텍스트 노드 한 개로 되돌리면
        // 60fps 회복 — 진입이 끝난 시점이라 시각적으로는 같은 화면이다
        tp.textContent = `${SAYU_FULL} `.repeat(K)
        // ⚠ **반복 피치는 통짜로 바꾼 뒤에 다시 잰다.** tspan 474개로 잰 값과 통짜 텍스트의
        //   실제 advance 는 tspan 경계마다 생기는 반올림 때문에 다르다(실측 차 0.008u,
        //   폴백 서체가 끼면 수 u). SMIL 이동량이 실제 피치와 어긋나면 이음매에서
        //   무늬가 매 주기 밀린다 — 반드시 통짜 실측값으로 돌린다.
        fitToPath(textEl, K) // 통짜 기준으로 한 번 더 맞춘다 (tspan 보정분 흡수)
        const P = unitWidth(K) || pathEl0.getTotalLength() - SEAM_MARGIN
        // SMIL 2단 — ① 0.3초 가속 램프 ② 등속 무한 반복. 둘 다 네이티브 타임라인이라
        // 메인 스레드와 무관하게 이어지고, 램프 끝 속도와 등속 속도가 정확히 같아
        // 이음매가 보이지 않는다 (t² 곡선의 끝 기울기 2 × 평균속도 = SPEED).
        const mk = (attrs: Record<string, string>) => {
          const el = document.createElementNS("http://www.w3.org/2000/svg", "animate") as SVGAnimateElement
          el.setAttribute("attributeName", "startOffset")
          for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
          tp.appendChild(el)
          return el
        }
        const rampId = "lzHeroRamp"
        // keySplines "0.333 0 0.667 0.333" = s ∝ t² 의 정확한 3차 베지어 표현 (등가속)
        const ramp = mk({
          id: rampId,
          values: `0;${-RAMP_DIST}`,
          dur: `${RAMP_MS / 1000}s`,
          calcMode: "spline",
          keyTimes: "0;1",
          keySplines: "0.333 0 0.667 0.333",
          fill: "freeze",
          begin: "indefinite",
        })
        mk({
          values: `${-RAMP_DIST};${-(RAMP_DIST + P)}`,
          dur: `${P / SPEED}s`,
          repeatCount: "indefinite",
          begin: `${rampId}.end`,
        })
        ramp.beginElement()
        anim = ramp
      }, wait)
    })
    return () => {
      cancelled = true
      clearTimeout(failsafe)
      if (timer) clearTimeout(timer)
      anim?.remove()
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
            글자가 경로 한쪽으로 2.5u 치우쳐, 원본 대비 전 구간이 그만큼 어긋난다
            (창 226개 상호상관 실측: 수직 편차 평균 +2.53u → central 적용 후 −0.10u).
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
      {/* 폭 측정용 프로브 — 화면 밖 평문 한 벌. 웹킷(iOS·사파리)은 `<text>` 의 글이
          `<textPath>` 안에 있으면 getComputedTextLength() 가 **0** 이라, 이 프로브가
          없으면 서체 판별·크기 보정이 통째로 불발한다. 렌더 비용은 한 줄뿐 */}
      <text className={styles.threadText} data-probe x={0} y={-999} visibility="hidden" aria-hidden xmlSpace="preserve">
        {SAYU_FULL}{" "}
      </text>
      {/* 이음매 측정용 사본 — 같은 경로 위에 **2벌**만. 보이는 본문의 startOffset 을
          흔들면 그어짐 도중 글자가 튀므로 측정은 여기서만 한다. 2벌이면 '한 벌 떨어진
          같은 글자' 쌍을 만들 수 있고, 길이가 절반이라 재배치 비용도 절반이다. */}
      <text className={styles.threadText} data-seam visibility="hidden" aria-hidden xmlSpace="preserve">
        <textPath href="#heroSayuThread" dominantBaseline="central">
          {`${SAYU_FULL} `.repeat(2)}
        </textPath>
      </text>
    </svg>
  )
}
