"use client"

/**
 * 거북이 트랙 프로그레스 (라운드 87, 운영자) —
 * 직선 바 폐기, **도보 트랙(스타디움) 형태**로 재설계. 레퍼런스: 육상 트랙 톱뷰.
 *
 * · 진행 = 2027년 1월 1일(KST)까지의 실시간 카운트다운. 거북이 위치 = 2026년이 흘러간
 *   비율 — 1년짜리 트랙이라 아주 천천히 꾸역꾸역 간다 (다리는 계속 젓는다).
 * · 결승 = 출발 (닫힌 루프, 하단 중앙 출발선). 회색 트랙 밴드 위에 주황 루트가
 *   거북이가 달려온 위치까지 경로를 따라 차오른다 (stroke-dashoffset).
 * · 거북이와 채움 선두는 같은 비율(frac)에서 유도 — 앞서지도 늦지도 않는다.
 * · 거북이는 트랙 **속**에 산다: 경로 접선을 따라 회전(발이 항상 트랙 바깥쪽) —
 *   상단 직선에선 뒤집혀 보이는 것이 루프의 정직한 표현 (보드게임 말 문법).
 * · 반응형: SVG viewBox 스케일 — 거북이도 트랙과 같이 줄어든다 (모바일 ~34px).
 * · 트랙 **안쪽 빈 자리**에 문구 2행 (라운드 108, 운영자 사양). 원래 비어 있던 공간이라
 *   섹션 높이는 1px 도 늘지 않는다. 문구는 운영자 지정 원문 그대로, 무표정한 톤 —
 *   이모지·느낌표·강조색 금지 (라운드 89의 '2027년' 주황 강조는 이 규칙으로 해제).
 *   2행은 **보이는 동안만** 쌓인 체류 시간이며 10초에 페이드로 붙는다.
 * · ?frac=0.x 로 위치 고정(검증용), ?speed=<배속> 은 시연 가속,
 *   ?stay=<초> 는 체류 시간 고정 (2행 노출·분 표기 검증용).
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useToast } from "../Shell"
import styles from "./turtle.module.css"

const START = new Date("2026-01-01T00:00:00+09:00").getTime()
const END = new Date("2027-01-01T00:00:00+09:00").getTime()

/** 스타디움 경로 — 반시계(육상 방향), 출발선 = 하단 직선 중앙. dr 로 차선 확장.
 *  라운드 89: 캘린더 아래 배치를 위한 세로 슬림화 — 곡선 반경 110→70.
 *  라운드 119(운영자 "전체 비율 맞춰 키우지 말고 **트랙의 가로만** 늘려"):
 *  viewBox 폭을 컨테이너에 맞춰 가변으로. 세로 렌더 스케일은 모바일(390 뷰포트)과
 *  같은 SCALE 로 고정 — 넓은 화면에서 트랙이 통째로 커지지 않고 옆으로만 길어진다.
 *  (밴드 폭·거북이·글자 렌더 크기 = 모바일과 동일, 높이 ≈130px) */
const CY = 107
const VB_H = 196
/** 렌더 px / viewBox 유닛 — 390 뷰포트(컨테이너 359px)에서의 값을 전 폭 공통으로 */
const SCALE = 0.665
function stadiumPath(dr: number, vbw: number) {
  const r = 70 + dr
  const top = CY - r
  const bottom = CY + r
  const cx = vbw / 2
  const right = vbw - 88
  return `M ${cx} ${bottom} H ${right} A ${r} ${r} 0 0 0 ${right} ${top} H 88 A ${r} ${r} 0 0 0 88 ${bottom} H ${cx}`
}

// 라운드 88: 거북이가 트랙 **위에 올라서는** 디자인으로 — 밴드 슬림화(44→26),
// 차선은 가운데 파선 하나만. 거북이 속은 오트로 채워 몸이 비치지 않는다
const BAND = 26

/** 2행이 붙기 시작하는 체류 시간(초) — 그 전엔 아예 렌더하지 않는다.
 *  라운드 111: 10 → 30. 10초는 1행을 읽는 도중에 끼어들고 "10초"라는 숫자가 너무 작아
 *  농담이 서지 않았다. 30초면 1행을 다 읽은 뒤라 "굳이 세어보면"이 회수된다 */
const STAY_REVEAL = 30
/** 이 초부터 분 단위 문장으로 전환. 라운드 113: 600 → 300.
 *  10분은 거의 아무도 못 보는 이스터에그였다("너무 못 보면 아쉽잖아").
 *  5분 = 의도적으로 머문 사람만 도달하는 선 — "당신을 위해"라는 헌정의 과장이 성립하는
 *  최소치이면서, 30초 문장("올해의 N초")이 세 자리 초까지 익을 시간도 남긴다 */
const STAY_TO_MIN = 300

export function TurtleTrack() {
  const [secs, setSecs] = useState<number | null>(null)
  /** 체류 시간(초) — **화면에 실제로 보이는 동안만** 쌓인다. 새로고침하면 0부터 */
  const [stay, setStay] = useState(0)
  /** viewBox 폭 — 컨테이너 폭 / SCALE (라운드 119, 가로만 늘어나는 트랙) */
  const [vbw, setVbw] = useState(540)
  const stageRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<SVGPathElement>(null)
  const measureRef = useRef<SVGPathElement>(null)
  const turtleRef = useRef<SVGGElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // ── 거북이 드래그 (2026-08-21, 장식 전용) ───────────────────────────────
  // ⚠ 카운트다운(secs)·진행률(frac)·주황 채움은 **절대 건드리지 않는다**. 거북이만
  //   경로 위를 이탈했다가 실제 위치로 튕겨 돌아온다 — 시간은 제자리라는 그림이 농담.
  const { notify } = useToast()
  /** 드래그·복귀 중에는 1초 틱이 거북이 transform 을 덮어쓰지 못하게 한다 */
  const busyRef = useRef(false)
  const draggingRef = useRef(false)
  /** 1초 틱이 갱신하는 **실제** 진행률 — 복귀 목표 지점의 출처 */
  const fracRef = useRef(0)
  const dragLenRef = useRef(0)
  /** 드래그 목표(포인터 투영 지점) — 실제 이동은 rAF 가 경로를 따라 쫓아간다 */
  const dragTargetRef = useRef(0)
  const rafRef = useRef(0)
  /** 최근접 경로점 탐색용 좌표 캐시 — getPointAtLength 는 비싸서 폭이 바뀔 때만 다시 뜬다 */
  const samplesRef = useRef<{ x: number; y: number; len: number }[]>([])

  /** 경로 길이 len 지점에 거북이를 놓는다 — 기존 update() 의 좌표·각도·미러 로직을
   *  그대로 뽑아낸 것(값 무변경). 닫힌 루프라 len 은 모듈로로 감싼다 */
  const place = useCallback((len: number) => {
    const path = measureRef.current
    const turtle = turtleRef.current
    if (!path || !turtle) return
    const L = path.getTotalLength()
    const l = ((len % L) + L) % L
    const p = path.getPointAtLength(l)
    const p2 = path.getPointAtLength((l + 1.5) % L)
    const ang = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI
    const S = 0.457
    const tf =
      Math.abs(ang) <= 90
        ? `translate(${p.x} ${p.y}) rotate(${ang}) scale(${S}) translate(-106 -76)`
        : `translate(${p.x} ${p.y}) rotate(${ang - 180}) scale(${-S} ${S}) translate(-106 -76)`
    turtle.setAttribute("transform", tf)
  }, [])

  /** 화면 좌표 → SVG viewBox 좌표 */
  const toSvg = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current
    const m = svg?.getScreenCTM()
    if (!svg || !m) return null
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    return pt.matrixTransform(m.inverse())
  }, [])

  /** 포인터 좌표를 경로에 투영 — 캐시된 샘플에서 대충 찾고 그 주변만 정밀 탐색한다.
   *  (전 구간을 getPointAtLength 로 훑으면 pointermove 마다 수십 ms 가 나간다) */
  const nearestLength = useCallback((x: number, y: number) => {
    const path = measureRef.current
    const s = samplesRef.current
    if (!path || s.length === 0) return 0
    let best = 0
    let bd = Infinity
    for (const q of s) {
      const d = (q.x - x) ** 2 + (q.y - y) ** 2
      if (d < bd) { bd = d; best = q.len }
    }
    const L = path.getTotalLength()
    const step = L / (s.length - 1)
    for (let lo = best - step, hi = best + step, i = 0; i < 3; i++) {
      let bl = best
      let bdd = Infinity
      for (let k = 0; k <= 8; k++) {
        const len = lo + ((hi - lo) * k) / 8
        const p = path.getPointAtLength(((len % L) + L) % L)
        const d = (p.x - x) ** 2 + (p.y - y) ** 2
        if (d < bdd) { bdd = d; bl = len }
      }
      best = bl
      const w = (hi - lo) / 8
      lo = best - w
      hi = best + w
    }
    return ((best % L) + L) % L
  }, [])

  // 폭이 바뀌면 경로도 바뀐다 → 좌표 캐시 재생성
  useEffect(() => {
    const path = measureRef.current
    if (!path) return
    const L = path.getTotalLength()
    const N = 240
    samplesRef.current = Array.from({ length: N + 1 }, (_, i) => {
      const len = (L * i) / N
      const p = path.getPointAtLength(len)
      return { x: p.x, y: p.y, len }
    })
  }, [vbw])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      // 540 미만이면 기존처럼 통째로 축소 (320px 급 초소형)
      setVbw(Math.max(540, Math.round(el.clientWidth / SCALE)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const fracQ = Number(q.get("frac"))
    const speedQ = Number(q.get("speed"))
    const stayQ = Number(q.get("stay"))
    const mounted = Date.now()

    // 체류 시간은 setInterval 횟수가 아니라 **실경과 시간의 누적**으로 잰다 —
    // 백그라운드 탭에서 타이머를 조이거나 몰아서 도는 브라우저가 있어서.
    // 숨은 동안(visibilityState === 'hidden')은 그 구간을 통째로 버린다 →
    // 돌아오면 멈춘 지점부터 이어진다 ("이 페이지에서 쓰셨습니다"가 거짓이 되지 않게)
    let acc = 0
    let last = Date.now()
    const onVis = () => {
      const now = Date.now()
      if (document.visibilityState !== "visible") acc += now - last
      last = now
    }
    document.addEventListener("visibilitychange", onVis)

    const update = () => {
      const now = Date.now()
      if (document.visibilityState === "visible") acc += now - last
      last = now
      setStay(q.get("stay") && Number.isFinite(stayQ) ? Math.max(0, stayQ) : Math.floor(acc / 1000))

      const simNow = q.get("speed") && Number.isFinite(speedQ) && speedQ > 0 ? now + (now - mounted) * speedQ : now
      const frac =
        q.get("frac") && Number.isFinite(fracQ)
          ? Math.min(1, Math.max(0, fracQ))
          : Math.min(1, Math.max(0, (simNow - START) / (END - START)))
      setSecs(Math.max(0, Math.ceil((END - simNow) / 1000)))

      fracRef.current = frac
      const path = measureRef.current
      const turtle = turtleRef.current
      if (!path || !turtle) return
      // 거북이 좌표·각도·미러는 place() 가 맡는다 (로직 동일, 값 무변경).
      // ⚠ 드래그·복귀 중에는 건너뛴다 — 아니면 1초마다 손에서 튕겨 나간다.
      //    채움·초 갱신은 그대로 돈다 (시간은 거북이와 무관하게 흐른다)
      if (!busyRef.current) place(path.getTotalLength() * frac)
      if (fillRef.current) fillRef.current.style.strokeDashoffset = String(1000 * (1 - frac))
    }

    update()
    const t = setInterval(update, 1000)
    return () => {
      clearInterval(t)
      document.removeEventListener("visibilitychange", onVis)
    }
    // vbw 변경 시 경로가 바뀌므로 즉시 재계산 (아니면 다음 초까지 거북이가 옛 위치에 뜬다)
  }, [vbw, place])

  // 언마운트 시 복귀 애니메이션 정리
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const onTurtleDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    cancelAnimationFrame(rafRef.current) // 복귀 중에 다시 집으면 그 자리에서 이어받는다
    const path = measureRef.current
    // 집는 순간의 현재 위치에서 출발 — 복귀 중이었다면 dragLenRef 가 그 지점을 들고 있다
    if (!busyRef.current && path) dragLenRef.current = path.getTotalLength() * fracRef.current
    dragTargetRef.current = dragLenRef.current
    busyRef.current = true
    draggingRef.current = true
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    // 드래그 추종 루프 — 포인터 투영 지점(target)을 **경로를 따라** 쫓아간다.
    // 투영을 그대로 찍으면(place(target)) 포인터가 트랙 안쪽 빈 밭을 가로지를 때
    // 최근접점이 위 직선 ↔ 아래 직선으로 홱 뒤집혀 거북이가 순간이동한다
    // (운영자 2026-08-21 "거북이는 순간이동할 수 없어") — 짧은 호 방향으로
    // 프레임당 28% 씩 접근시켜 항상 트랙 위를 미끄러지게 한다
    const chase = () => {
      if (!draggingRef.current) return
      const pth = measureRef.current
      if (pth) {
        const L = pth.getTotalLength()
        let d = (((dragTargetRef.current - dragLenRef.current) % L) + L) % L
        if (d > L / 2) d -= L
        // 비례 접근(28%)만으로는 목표가 멀 때(밭을 가로질러 반대편 직선으로 투영이
        // 뒤집힐 때) 한 프레임에 수백 유닛을 건너뛴다(실측 314u) — **속도 상한**을
        // 함께 건다. 18u/프레임 ≈ 1080u/s: 빠르게 미끄러지되 이동이 눈에 보인다
        const step = Math.max(-18, Math.min(18, d * 0.28))
        dragLenRef.current = dragLenRef.current + step
        place(dragLenRef.current)
      }
      rafRef.current = requestAnimationFrame(chase)
    }
    rafRef.current = requestAnimationFrame(chase)
  }

  const onTurtleMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    const p = toSvg(e)
    if (!p) return
    dragTargetRef.current = nearestLength(p.x, p.y) // 실제 이동은 chase 루프가
  }

  /** 놓으면 **경로를 따라** 실제 위치로 미끄러져 돌아온다 (직선 이동 금지).
   *  감쇠 스프링(k=170, c=20 → ζ≈0.77 부족감쇠)이라 한 번 지나쳤다가 되돌아와 안착한다.
   *  닫힌 루프이므로 두 지점 차이는 **짧은 쪽 방향**으로 보간한다 */
  const onTurtleUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    cancelAnimationFrame(rafRef.current) // 추종 루프 정지 — 복귀 스프링으로 교대
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId) } catch {}

    notify("우리는 거북이를 옮길 순 있지만, 시간을 통제할 수는 없습니다.", 4000)

    const path = measureRef.current
    if (!path) { busyRef.current = false; return }
    const L = path.getTotalLength()
    const from = dragLenRef.current
    const to = L * fracRef.current
    let d = (((to - from) % L) + L) % L
    if (d > L / 2) d -= L // 짧은 쪽으로

    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || Math.abs(d) < 0.5) {
      place(to)
      busyRef.current = false
      return
    }

    let x = 0
    let v = 0
    let last = performance.now()
    // 실측 튜닝(2026-08-21). 시작값 K=170·C=20(ζ≈0.77)은 오버슈트 1.95u·정착 554ms 로
    // 튕김이 거의 안 보이고 지시한 정착 0.6~0.9초보다 빨랐다. 감쇠비는 0.65 근처로 두되
    // (오버슈트 1회) 고유진동수를 낮춰 시간을 늘린다 — 정착시간 ≈ 4/(ζω) 이므로
    // ω=√K 를 13.0 → 8.4 로. 결과 실측: 오버슈트 ≈4.6%, 정착 ≈0.75초
    const K = 70
    const C = 11
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000) // 탭 복귀 시 한 번에 튀는 것 방지
      last = now
      v += (K * (d - x) - C * v) * dt
      x += v * dt
      dragLenRef.current = from + x // 복귀 중 다시 집으면 이 지점에서 이어받는다
      place(from + x)
      if (Math.abs(d - x) < 0.4 && Math.abs(v) < 4) {
        place(to)
        busyRef.current = false
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  return (
    <div className={styles.stage} ref={stageRef}>
      <div className={styles.trackBox}>
        <svg ref={svgRef} className={styles.track} viewBox={`0 0 ${vbw} ${VB_H}`} role="img" aria-label="2027년까지의 거북이 트랙 카운트다운">
          {/* 회색 트랙 밴드 (바탕) */}
          <path d={stadiumPath(0, vbw)} fill="none" stroke="#e5dfd6" strokeWidth={BAND} />
          {/* 주황 진행 루트 — 출발선부터 거북이 위치까지 경로를 따라 차오른다 */}
          <path
            ref={fillRef}
            d={stadiumPath(0, vbw)}
            fill="none"
            stroke="#d2691e"
            strokeWidth={BAND}
            pathLength={1000}
            strokeDasharray={1000}
            strokeDashoffset={1000}
          />
          {/* 차선 — 가운데 파선 하나만 (라운드 88 슬림화) */}
          <path d={stadiumPath(0, vbw)} fill="none" stroke="#f7f3ee" strokeWidth={1.6} strokeDasharray="10 12" />
          {/* 트랙 안팎 테두리 */}
          <path d={stadiumPath(-(BAND / 2), vbw)} fill="none" stroke="#cfc7bb" strokeWidth={1.5} />
          <path d={stadiumPath(BAND / 2, vbw)} fill="none" stroke="#cfc7bb" strokeWidth={1.5} />
          {/* 출발선 = 결승선 (하단 중앙) — 체크 무늬 느낌의 이중선 */}
          <line x1={vbw / 2} y1={CY + 70 - BAND / 2} x2={vbw / 2} y2={CY + 70 + BAND / 2} stroke="#f7f3ee" strokeWidth={6} />
          <line
            x1={vbw / 2}
            y1={CY + 70 - BAND / 2}
            x2={vbw / 2}
            y2={CY + 70 + BAND / 2}
            stroke="#1a1208"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          {/* 진행률 측정용 (비표시) */}
          <path ref={measureRef} d={stadiumPath(0, vbw)} fill="none" stroke="none" />
          {/* 거북이 — 트랙 속, 채움 선두와 같은 지점 */}
          {/* 거북이 — 트랙 속, 채움 선두와 같은 지점.
              2026-08-21: 드래그 가능(장식). 스프라이트가 작아 **투명 원**을 얹어 히트
              영역을 넉넉히 준다 — 셀 좌표계라 r=95 는 화면에서 ≈43유닛(스케일 0.457).
              다리 애니메이션(.turtle gait)은 드래그·복귀 중에도 그대로 돈다 */}
          <g
            ref={turtleRef}
            style={{ visibility: secs === null ? "hidden" : "visible", cursor: "grab", touchAction: "none" }}
            onPointerDown={onTurtleDown}
            onPointerMove={onTurtleMove}
            onPointerUp={onTurtleUp}
            onPointerCancel={onTurtleUp}
          >
            <foreignObject width={140} height={81} style={{ pointerEvents: "none" }}>
              <div className={styles.turtle} />
            </foreignObject>
            {/* ⚠ 히트 영역은 **foreignObject 뒤**에 둔다 — 앞에 두면 SSR HTML 을
                파싱할 때 하이드레이션 불일치가 났다(실측). 투명이라 순서가 보이지도 않는다 */}
            <circle cx={106} cy={76} r={95} fill="transparent" />
          </g>
        </svg>

        {/* 트랙 안쪽 문구 (라운드 108) — SVG <text> 가 아니라 HTML 이다.
            viewBox 스케일을 타면 모바일에서 10px 남짓으로 쪼그라들어 읽히지 않는다.
            문구는 운영자 지정 원문 고정 — 임의 수정 금지.
            마운트 전에는 통째로 감춘다 ("…까지 초가 남아 있습니다"가 한 프레임 스치는 걸 막음) */}
        <div className={styles.readout} style={{ visibility: secs === null ? "hidden" : "visible" }}>
          {/* 라운드 109: 한 문장이 두 줄로 흘러 김이 빠지던 걸 폐기.
              "굳이 세어보면 … 남았습니다."만 문장으로 남기고, 년·초는 **라운드 89 서식으로
              복귀**(2027년 주황 800 / 큰 숫자). 줄바꿈은 자연 흐름이 아니라 **못 박은 2행** —
              위 행은 조건, 아래 행은 답. 큰 숫자가 초점이 된다 */}
          <p className={styles.line1}>
            <span className={styles.rowTop}>
              <span className={styles.lead}>굳이 세어보면 </span>
              <span className={styles.year}>2027년</span>
              <span className={styles.lead}>까지</span>
            </span>
            <span className={styles.rowMain}>
              <span className={styles.big}>
                <span className={styles.num}>{secs === null ? "" : secs.toLocaleString("ko-KR")}</span>초
              </span>
              <span className={styles.lead}> 남았습니다.</span>
            </span>
          </p>
          {stay >= STAY_REVEAL && (
            <p className={styles.line2}>
              {/* 라운드 113 문구 (운영자 확정) — 볼드는 수치까지만(라운드 112 규칙 유지).
                  · 30초~: "올해의 N초" — 1행이 세는 1년치 초와 같은 단위계로 묶인다
                  · 5분~: 화면의 거북이는 명백히 기어가는 중인데 "서두르고 있습니다"라고
                    정색하는 무표정 거짓말. 부연 없이 한 문장으로 끝낸다 */}
              {stay >= STAY_TO_MIN ? (
                <>
                  {/* 라운드 116: 모바일도 **한 줄** — 두 줄의 원인은 구멍이 아니라 문구 박스
                      폭(74%)이었다. 실측 390px: 한 줄 280 ≤ 구멍 304.9. 라운드 114 의
                      brMobile 줄바꿈은 폐기 */}
                  <span className={styles.stayNum}>{Math.floor(stay / 60).toLocaleString("ko-KR")}분</span>째 보고
                  있는 당신을 위해 거북이가 완주를 서두르고 있습니다.
                </>
              ) : (
                <>
                  올해의 <span className={styles.stayNum}>{stay.toLocaleString("ko-KR")}초</span>를 거북이를 보는 데
                  쓰셨습니다.
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
