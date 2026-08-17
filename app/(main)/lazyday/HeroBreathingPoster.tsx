"use client"

import { memo, useEffect, useRef } from "react"
import {
  POSTER_GLYPHS,
  POSTER_GLYPH_DY,
  POSTER_GLYPH_FIT,
  SAYU_P1,
  SAYU_P2,
  SAYU_P3,
} from "./poster-thread"
import { POSTER_CHAR_ADV, POSTER_FONT_SIZE, POSTER_LOOP_LEN } from "./poster-metrics"
import { fillLists, listStr } from "./poster-place"
import styles from "./HeroBreathingPoster.module.css"

/**
 * 숨 쉬는 포스터 — 히어로 채택본 (2026-08-11, hero-motion 시안 ③ 이식).
 *
 * 실 = 원본 디자인 PDF 좌표의 한붓 경로(poster-thread.ts), 큰 글자 12자는 실측
 * 좌표에 정적. 〈사유의 기슭〉 전문이 실을 따라 흐른다.
 * ① 실 위 본문이 2.2초에 걸쳐 스스로 그어진다 (붓끝 순서 = draw 이징 역함수의
 *    글자별 딜레이. 첫 벌만 tspan 분해, CSS 스태거라 페인트부터 돈다)
 * ② 다 그어지면 0.3초 등가속 → 정상 속도의 무한 흐름
 *
 * ⚠ **2026-08-17 — 글자 배치를 빌드 타임으로 옮겼다 (운영자 "각각 텍스트가 또 확
 *    튀어 위치가"). 이 파일에서 사라진 것들:**
 *      fitToPath · tuneSeam · countOnPath · measurePitch · watchLateFont ·
 *      arcOf(경로 질의) · 폭 프로브 · 이음매 측정 사본 · 오버런 경로 · `<textPath>`
 *    전부 "브라우저에게 물어서 맞추는" 코드였고, 답이 엔진·회선·서체 도착 시각마다
 *    달라 그동안의 결함(로드별 크기 편차·iOS 겹침·고갈·이음매 구멍)을 만들었다.
 *    이제 글자 좌표는 `poster-metrics.ts`(빌드 산출물) + `poster-place.ts`(순수 계산)
 *    가 정한다. 엔진은 **지정한 자리에 글자 하나 그리기**만 한다.
 *    · 경로에 시작·끝이 없으니 잘림·쌓임·이음매가 **존재할 수 없다**
 *    · 호길이를 둘레로 나머지 연산하므로 실이 **진짜 루프**로 돈다
 *    · 서체가 늦게 와도 자리는 그대로다 (글자 모양만 뒤늦게 바뀔 뿐이고,
 *      그마저 font-display: block + 프리로드 + 진입 홀드가 가린다)
 *
 * 진입 애니메이션은 채택 당시 구조(글자별 tspan 스태거, 페인트부터 재생, 정지·재개
 * 없음) 그대로다. 모션 원칙 M2의 허용 유형. reduced-motion 이면 진입 스킵·흐름 없음.
 */

/** 문단 사이는 **한 칸** (세 칸의 13.5u 빈 구간이 이음매에서 생성/소멸로 보였다) */
const SAYU_FULL = `${SAYU_P1} ${SAYU_P2} ${SAYU_P3}`
/** 흐름의 반복 단위 — 마지막 한 칸이 전문 끝과 처음 사이의 숨이다.
 *  ⚠ 이 문자열이 곧 배치표의 기준이다 (gen_poster_layout.py 의 `unit` 과 같아야 한다). */
const UNIT = `${SAYU_FULL} `
const CHARS = UNIT.split("")
const N = CHARS.length
/** 큰 글자 12자 — 서체 로드 대기에 같이 건다 (같은 서브셋 파일의 900 굵기) */
const POSTER_GLYPH_TEXT = POSTER_GLYPHS.map((g) => g.ch).join("")
const SPEED = 10 // px/s (viewBox 단위) — 존재만 하는 배경 속도 (데모 ③ 확정값)

/** 글자별 진행거리(u)와 그 누적 — 배치표에서 바로 나온다 (측정 없음) */
const ADV = new Float64Array(N)
const CUM = new Float64Array(N)
{
  let acc = 0
  for (let i = 0; i < N; i++) {
    ADV[i] = POSTER_CHAR_ADV[CHARS[i]] ?? 0
    CUM[i] = acc
    acc += ADV[i]
  }
}

/** 첫 화면(위상 0)의 좌표 — 모듈 로드 때 한 번. SSR 마크업이 이 값을 그대로 싣는다.
 *  덕분에 서버가 그린 첫 페인트부터 글자가 제자리에 있다 (하이드레이션 대기 없음). */
const PHASE0 = (() => {
  const xs = new Float64Array(N)
  const ys = new Float64Array(N)
  const rs = new Float64Array(N)
  fillLists(CUM, ADV, N, 0, xs, ys, rs)
  return { x: listStr(xs, N), y: listStr(ys, N), r: listStr(rs, N, 1) }
})()

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
    let cancelled = false
    let raf = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const textEl = root.querySelector<SVGTextElement>("text[data-stream]")
    if (!textEl) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const xs = new Float64Array(N)
    const ys = new Float64Array(N)
    const rs = new Float64Array(N)
    /** 위상(u) → 474자 재배치. 이 함수가 이 컴포넌트의 유일한 '레이아웃' 이다. */
    const place = (phase: number) => {
      fillLists(CUM, ADV, N, phase, xs, ys, rs)
      textEl.setAttribute("x", listStr(xs, N))
      textEl.setAttribute("y", listStr(ys, N))
      textEl.setAttribute("rotate", listStr(rs, N, 1))
    }

    /** 서체를 기다린다 — **크기를 정하려는 게 아니라**(이젠 상수다) 폴백 글자가
     *  잠깐 보였다 바뀌는 걸 막으려는 것뿐이다. 실패해도 자리는 옳다. */
    const fontReady = () =>
      Promise.all([
        (document as Document).fonts.load(`400 ${POSTER_FONT_SIZE}px "Pretendard Poster"`, SAYU_FULL),
        (document as Document).fonts.load(`900 36px "Pretendard Poster"`, POSTER_GLYPH_TEXT),
      ]).catch(() => undefined)

    /** 흐름 개시 — 통짜 교체 후 rAF 구동.
     *  ⚠ 진입용 tspan(474개)을 남긴 채 굴리면 30fps 로 반토막 난다 — 통짜로 되돌린다. */
    const fireFlow = () => {
      if (cancelled) return
      textEl.textContent = UNIT

      /** 경과 t(ms) → 이동 거리(u). 등가속 ½at² (a = SPEED/tr) 로 300ms 에 SPEED 도달
       *  — 종전 SMIL keySplines 등가속과 같은 곡선, 이후 등속. */
      const dist = (tMs: number) => {
        const t = tMs / 1000
        const tr = RAMP_MS / 1000
        return t < tr ? (SPEED / (2 * tr)) * t * t : RAMP_DIST + SPEED * (t - tr)
      }
      // 통짜 교체 리플로우가 끝난 다음 프레임에 시작 (같은 블록에서 시작하면 가속
      // 300ms 가 멈춘 프레임 안에서 소모돼 "가속이 없어" 보인다)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (cancelled) return
          const t0 = performance.now()
          const step = (now: number) => {
            if (cancelled) return
            // ⚠ 나머지 연산 하나가 이음매를 대신한다 — 둘레를 넘은 글자는 그냥
            //   경로 앞쪽으로 돌아간다. 사라지지도, 쌓이지도 않는다.
            place(dist(now - t0) % POSTER_LOOP_LEN)
            raf = requestAnimationFrame(step)
          }
          raf = requestAnimationFrame(step)
        }),
      )
    }

    /** 노출 — 홀드를 떼고 스태거를 처음부터 한 번 건다.
     *  ⚠ 홀드 중 CSS 가 스태거를 `animation-play-state: paused` 로 시각 0 에 세워
     *  두므로, 속성을 떼는 순간 처음부터 그어진다 (웹킷에서 `animation:none`
     *  리스타트 수법이 안 먹어 일시정지 방식으로 바꾼 것). */
    const revealOnce = () => {
      if (!textEl.hasAttribute("data-hold")) return
      textEl.removeAttribute("data-hold")
      // 셸(내비·푸터)은 마운트 기준 벽시계로 도는데 그어짐이 늦게 시작할 수 있으므로
      // 실제 시작 시각을 알려 리빌 타이머를 다시 걸게 한다
      window.dispatchEvent(
        new CustomEvent("lz:hero-draw-start", { detail: { revealInMs: CHROME_REVEAL_MS } }),
      )
      if (reduced) return // 모션 최소화: 흐름 없이 완성 상태로 둔다
      timer = setTimeout(() => {
        if (cancelled) return
        // 그어짐이 아직 덜 끝났으면 남은 만큼 더 기다린다 — 스태거가 늦게 시작한
        // 경우(느린 하이드레이션) 벽시계로 자르면 마지막 글자들이 페이드 없이 덮인다
        const lastChar = textEl.querySelector<SVGElement>("tspan:last-of-type")
        const a = lastChar?.getAnimations?.()[0]
        const played =
          typeof a?.currentTime === "number" ? Math.max(0, a.currentTime as number) : FLOW_START_MS
        const remain = FLOW_START_MS - played
        if (remain > 30) {
          timer = setTimeout(fireFlow, remain)
          return
        }
        fireFlow()
      }, FLOW_START_MS)
    }

    // ⚠ **안전핀.** 홀드는 "서체가 붙을 때까지 안 보인다"는 약속이라, 대기가 어디서든
    //   막히면 본문이 영영 안 보인다. 무슨 일이 있어도 이 시각엔 노출한다
    //   (revealOnce 는 멱등이라 정상 경로와 충돌하지 않는다).
    //   ⚠ 종전 6초에서 **2초로 줄였다** — 기다릴 대상이 같은 오리진 35KB 한 개뿐이라
    //   그보다 늦으면 사실상 실패한 것이고, 그 경우 폴백 글자로라도 제자리에 그리는
    //   편이 낫다 (자리는 서체와 무관하게 옳다).
    const pin = setTimeout(revealOnce, 2000)
    void fontReady().then(() => {
      if (!cancelled) revealOnce()
    })

    return () => {
      cancelled = true
      clearTimeout(pin)
      if (timer) clearTimeout(timer)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      {/* 포스터 전용 서브셋 서체 — **가장 먼저** 받게 한다 (module.css 의 @font-face 주석).
          ⚠ 동일 오리진이어도 서체 프리로드는 `crossOrigin` 없이는 재사용되지 않고 두 번
          받는다 (CORS 모드가 달라 캐시 항목이 갈린다). */}
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href="/fonts/pretendard-poster-subset.woff2"
        crossOrigin="anonymous"
      />
      {/* JS 가 없으면 data-hold 를 뗄 수 없다 — 그 경우 그대로 보이게 (좌표는 SSR 이
          이미 심어 두었으므로 JS 없이도 글자가 제자리에 있다) */}
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
        {/* 실 위 본문 — 글자마다 좌표·각도를 **직접** 준다.
            x/y 는 글자의 베이스라인 원점, rotate 는 그 자리에서의 접선 각도(도).
            ⚠ `dominant-baseline` 은 쓰지 않는다 — 엔진마다 적용 지점이 다르다
            (실측: 크롬은 <text> 에서 무시, 웹킷은 자식 tspan 유무로 갈림).
            중심 정렬은 poster-place 가 법선 방향으로 직접 밀어 넣는다.
            ⚠ 리스트는 **부모 <text> 에 붙인다** — 자식 tspan 들의 글자가 순서대로
            소비한다(두 엔진 실측 확인). 그래서 스태거용 tspan 분해와 공존한다. */}
        <text
          className={styles.threadText}
          data-stream
          data-hold="1"
          xmlSpace="preserve"
          x={PHASE0.x}
          y={PHASE0.y}
          rotate={PHASE0.r}
        >
          {/* 첫 벌 — 글자별 tspan. 딜레이를 draw 이징의 역함수로 깔아, 붓끝이 그
              자리에 닿는 순간 글자가 뜬다 = 시안 ①의 선 긋기와 같은 리듬·속도.
              CSS 애니라 JS 하이드레이션 전·실패 시에도 페인트부터 돈다 */}
          {CHARS.map((c, i) => (
            <tspan
              key={i}
              className={styles.introChar}
              style={{ ["--d" as string]: `${(DRAW_MS * drawTimeAt(i / (N - 1))).toFixed(1)}ms` }}
            >
              {c}
            </tspan>
          ))}
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
      </svg>
    </>
  )
})
