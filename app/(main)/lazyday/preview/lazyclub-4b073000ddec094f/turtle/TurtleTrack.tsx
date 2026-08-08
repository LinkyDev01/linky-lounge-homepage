"use client"

/**
 * 거북이 트랙 프로그레스 (라운드 87, 운영자) —
 * 직선 바 폐기, **도보 트랙(스타디움) 형태**로 재설계. 레퍼런스: 육상 트랙 톱뷰.
 *
 * · 진행 = 2027년 1월 1일(KST)까지의 실시간 카운트다운. 중앙에 "2027년까지 N초"
 *   (초로만, 1초마다 갱신). 거북이 위치 = 2026년이 흘러간 비율 — 1년짜리 트랙이라
 *   아주 천천히 꾸역꾸역 간다 (다리는 계속 젓는다).
 * · 결승 = 출발 (닫힌 루프, 하단 중앙 출발선). 회색 트랙 밴드 위에 주황 루트가
 *   거북이가 달려온 위치까지 경로를 따라 차오른다 (stroke-dashoffset).
 * · 거북이와 채움 선두는 같은 비율(frac)에서 유도 — 앞서지도 늦지도 않는다.
 * · 거북이는 트랙 **속**에 산다: 경로 접선을 따라 회전(발이 항상 트랙 바깥쪽) —
 *   상단 직선에선 뒤집혀 보이는 것이 루프의 정직한 표현 (보드게임 말 문법).
 * · 반응형: SVG viewBox 스케일 — 거북이도 트랙과 같이 줄어든다 (모바일 ~34px).
 * · ?frac=0.x 로 위치 고정(검증용), ?speed=<배속> 은 시연 가속.
 */

import { useEffect, useRef, useState } from "react"
import styles from "./turtle.module.css"

const START = new Date("2026-01-01T00:00:00+09:00").getTime()
const END = new Date("2027-01-01T00:00:00+09:00").getTime()

/** 스타디움 경로 — 반시계(육상 방향), 출발선 = 하단 직선 중앙. dr 로 차선 확장.
 *  라운드 89: 캘린더 아래 배치를 위한 세로 슬림화 — 곡선 반경 110→70,
 *  직선을 좌우로 늘려(88↔452) 납작한 타원 + viewBox 를 내용에 딱 맞게 크롭.
 *  모바일(뷰포트 366px)에서 높이 ≈133px */
const CY = 107
function stadiumPath(dr: number) {
  const r = 70 + dr
  const top = CY - r
  const bottom = CY + r
  return `M 270 ${bottom} H 452 A ${r} ${r} 0 0 0 452 ${top} H 88 A ${r} ${r} 0 0 0 88 ${bottom} H 270`
}

// 라운드 88: 거북이가 트랙 **위에 올라서는** 디자인으로 — 밴드 슬림화(44→26),
// 차선은 가운데 파선 하나만. 거북이 속은 오트로 채워 몸이 비치지 않는다
const BAND = 26

export function TurtleTrack() {
  const [secs, setSecs] = useState<number | null>(null)
  const fillRef = useRef<SVGPathElement>(null)
  const measureRef = useRef<SVGPathElement>(null)
  const turtleRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const fracQ = Number(q.get("frac"))
    const speedQ = Number(q.get("speed"))
    const mounted = Date.now()

    const update = () => {
      const now = Date.now()
      const simNow = q.get("speed") && Number.isFinite(speedQ) && speedQ > 0 ? now + (now - mounted) * speedQ : now
      const frac =
        q.get("frac") && Number.isFinite(fracQ)
          ? Math.min(1, Math.max(0, fracQ))
          : Math.min(1, Math.max(0, (simNow - START) / (END - START)))
      setSecs(Math.max(0, Math.ceil((END - simNow) / 1000)))

      const path = measureRef.current
      const turtle = turtleRef.current
      if (!path || !turtle) return
      const L = path.getTotalLength()
      const p = path.getPointAtLength(L * frac)
      const p2 = path.getPointAtLength(Math.min(L, L * frac + 1.5))
      const ang = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI
      // 라운드 88: 뒤집힘 금지 — 왼쪽으로 갈 때는 회전 180° 대신 **좌우 미러**로
      // 진행 방향을 보게 한다 (기울기는 ±90° 이내로만). 발(-76)은 경로선 위에 얹혀
      // 거북이가 항상 트랙 위에 서 있다.
      // 라운드 89: 가로 앵커 = 몸 중심이 아니라 **앞다리 끝(셀 x≈106 실측)** —
      // 채움 경계가 앞발 끝선과 일치하고 머리(x≈136)만 회색 쪽으로 살짝 나간다
      const S = 0.457 // 140×81 셀 → ≈64유닛 폭
      const tf =
        Math.abs(ang) <= 90
          ? `translate(${p.x} ${p.y}) rotate(${ang}) scale(${S}) translate(-106 -76)`
          : `translate(${p.x} ${p.y}) rotate(${ang - 180}) scale(${-S} ${S}) translate(-106 -76)`
      turtle.setAttribute("transform", tf)
      if (fillRef.current) fillRef.current.style.strokeDashoffset = String(1000 * (1 - frac))
    }

    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={styles.stage}>
      <svg className={styles.track} viewBox="0 0 540 196" role="img" aria-label="2027년까지의 거북이 트랙 카운트다운">
        {/* 회색 트랙 밴드 (바탕) */}
        <path d={stadiumPath(0)} fill="none" stroke="#e5dfd6" strokeWidth={BAND} />
        {/* 주황 진행 루트 — 출발선부터 거북이 위치까지 경로를 따라 차오른다 */}
        <path
          ref={fillRef}
          d={stadiumPath(0)}
          fill="none"
          stroke="#d2691e"
          strokeWidth={BAND}
          pathLength={1000}
          strokeDasharray={1000}
          strokeDashoffset={1000}
        />
        {/* 차선 — 가운데 파선 하나만 (라운드 88 슬림화) */}
        <path d={stadiumPath(0)} fill="none" stroke="#f7f3ee" strokeWidth={1.6} strokeDasharray="10 12" />
        {/* 트랙 안팎 테두리 */}
        <path d={stadiumPath(-(BAND / 2))} fill="none" stroke="#cfc7bb" strokeWidth={1.5} />
        <path d={stadiumPath(BAND / 2)} fill="none" stroke="#cfc7bb" strokeWidth={1.5} />
        {/* 출발선 = 결승선 (하단 중앙) — 체크 무늬 느낌의 이중선 */}
        <line x1={270} y1={CY + 70 - BAND / 2} x2={270} y2={CY + 70 + BAND / 2} stroke="#f7f3ee" strokeWidth={6} />
        <line
          x1={270}
          y1={CY + 70 - BAND / 2}
          x2={270}
          y2={CY + 70 + BAND / 2}
          stroke="#1a1208"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
        {/* 진행률 측정용 (비표시) */}
        <path ref={measureRef} d={stadiumPath(0)} fill="none" stroke="none" />
        {/* 중앙 카운트다운 */}
        {/* 라운드 89: '2027년' 강조 — 브랜드 주황 800 */}
        <text x={270} y={92} textAnchor="middle" className={styles.centerSmall}>
          <tspan className={styles.centerYear}>2027년</tspan>
          <tspan dx={3}>까지</tspan>
        </text>
        <text x={270} y={128} textAnchor="middle" className={styles.centerBig}>
          {secs === null ? "" : `${secs.toLocaleString("ko-KR")}초`}
        </text>
        {/* 거북이 — 트랙 속, 채움 선두와 같은 지점 */}
        <g ref={turtleRef} style={{ visibility: secs === null ? "hidden" : "visible" }}>
          <foreignObject width={140} height={81}>
            <div className={styles.turtle} />
          </foreignObject>
        </g>
      </svg>
      <p className={styles.caption}>2026년이 지나간 만큼 트랙이 차오릅니다 — 결승선은 출발선, 2027년 1월 1일.</p>
    </div>
  )
}
