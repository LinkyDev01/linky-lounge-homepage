"use client"

/**
 * Coming Soon 타이포 이펙트 시안 4종 — 둥근모꼴(DungGeunMo) (라운드 29 제안)
 * 채택 시 coming soon 홈(워드서치 마크 아래)에 이식. 시안 전용 페이지.
 */

import { useEffect, useState } from "react"
import styles from "./effects.module.css"

const VARIANTS = [
  {
    key: "circle",
    name: "A. 워드서치 서클",
    desc: "브랜드 마크의 오벌(단어 찾기 동그라미) 문법을 그대로 잇습니다. COMING SOON 둘레에 캡슐 선이 손으로 긋듯 그려졌다 사라지기를 반복 — 마크 바로 아래 놓였을 때 한 몸처럼 보입니다.",
    reco: "추천안 — 유일하게 '우리 마크의 문법'인 모션이라 장식이 아니라 아이덴티티로 읽힙니다.",
  },
  {
    key: "typing",
    name: "B. 타이핑",
    desc: "고정폭 픽셀 서체의 결을 살린 터미널 타이핑. 글자가 한 자씩 나타나고 블록 커서(▮)가 점멸합니다.",
    reco: "차선 — 레트로 감성은 확실하지만 범용 효과라 브랜드 고유성은 A보다 약합니다.",
  },
  {
    key: "blink",
    name: "C. 점멸",
    desc: "아케이드 'INSERT COIN' 점멸. 중간 단계 없이 스텝으로 켜졌다 꺼지는 8비트 감성 — 가장 조용하고 구현이 가벼운 안.",
    reco: "미니멀이 최우선이면 이 안. 단, 점멸 속도가 시선을 계속 끌어 호불호가 있습니다.",
  },
  {
    key: "marquee",
    name: "D. 전광판",
    desc: "상하 괘선 사이를 좌로 흐르는 LED 전광판. 워크룸 계열의 괘선 문법과 어울리고 정보(오픈 시점 등)를 이어 붙이기 좋습니다.",
    reco: "추후 '2026.09 OPEN' 같은 문구를 함께 흘릴 계획이면 이 안이 유리합니다.",
  },
] as const

type VariantKey = (typeof VARIANTS)[number]["key"]

export function EffectsShowcase() {
  const [active, setActive] = useState<VariantKey>("circle")
  const v = VARIANTS.find((x) => x.key === active)!

  // 레이지클럽 트리 공통 — 프리뷰 이동 바 숨김 (Shell.tsx와 동일 규칙)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[class*="previewBar"]'))
    els.forEach((el) => {
      el.style.display = "none"
    })
    return () =>
      els.forEach((el) => {
        el.style.display = ""
      })
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.head}>COMING SOON 타이포 이펙트 시안 — 둥근모꼴</div>
      <p className={styles.sub}>탭을 눌러 4가지 안을 비교하세요. 마크 아래가 실제 배치 위치입니다.</p>

      <div className={styles.mark}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/linky-lounge/book-club/home-v3/lazyclub-wordsearch.png" alt="레이지 클럽" />
      </div>

      <div className={styles.stage}>
        {active === "typing" && (
          <div>
            <span className={`${styles.text} ${styles.typing}`}>COMING SOON</span>
            <span className={`${styles.text} ${styles.cursor}`}>▮</span>
          </div>
        )}
        {active === "blink" && <div className={`${styles.text} ${styles.blink}`}>COMING SOON</div>}
        {active === "marquee" && (
          <div className={styles.marqueeWrap}>
            <div className={styles.marqueeTrack}>
              <span className={styles.text}>COMING SOON</span>
              <span className={styles.text}>COMING SOON</span>
              <span className={styles.text}>COMING SOON</span>
              <span className={styles.text}>COMING SOON</span>
            </div>
          </div>
        )}
        {active === "circle" && (
          <div className={styles.circleWrap}>
            <span className={styles.text}>COMING SOON</span>
            <svg className={styles.circleSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <rect x="1.5" y="4" width="97" height="92" rx="46" ry="46" pathLength="100" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        )}
      </div>

      <div className={styles.tabs}>
        {VARIANTS.map((x) => (
          <button
            key={x.key}
            type="button"
            className={`${styles.tab} ${x.key === active ? styles.tabActive : ""}`}
            onClick={() => setActive(x.key)}
          >
            {x.name}
          </button>
        ))}
      </div>

      <div className={styles.desc}>
        <p>{v.desc}</p>
        <p className={styles.reco}>{v.reco}</p>
      </div>
    </div>
  )
}
