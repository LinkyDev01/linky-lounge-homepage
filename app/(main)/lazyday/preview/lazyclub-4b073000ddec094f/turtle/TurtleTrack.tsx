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
  const fillRef = useRef<SVGPathElement>(null)
  const measureRef = useRef<SVGPathElement>(null)
  const turtleRef = useRef<SVGGElement>(null)

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
    return () => {
      clearInterval(t)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  return (
    <div className={styles.stage}>
      <div className={styles.trackBox}>
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
          {/* 거북이 — 트랙 속, 채움 선두와 같은 지점 */}
          <g ref={turtleRef} style={{ visibility: secs === null ? "hidden" : "visible" }}>
            <foreignObject width={140} height={81}>
              <div className={styles.turtle} />
            </foreignObject>
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
                  {/* 라운드 114: 모바일에선 "당신을 위해" 뒤에서 줄을 못 박는다 —
                      자연 줄바꿈은 "완주를 / 서두르고"처럼 어중간한 곳에서 꺾였다 */}
                  <span className={styles.stayNum}>{Math.floor(stay / 60).toLocaleString("ko-KR")}분</span>째 보고
                  있는 당신을 위해<br className={styles.brMobile} /> 거북이가 완주를 서두르고 있습니다.
                </>
              ) : (
                <>
                  올해의 <span className={styles.stayNum}>{stay.toLocaleString("ko-KR")}초</span>를 거북이 보는 데
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
