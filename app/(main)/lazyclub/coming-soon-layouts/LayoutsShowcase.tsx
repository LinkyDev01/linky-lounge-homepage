"use client"

/**
 * Coming Soon 배치 시안 3안 (라운드 32 제안)
 * 채택된 타이핑(B안)은 그대로 두고, "COMING SOON을 어디에 얼마나 크게" 만 비교한다.
 */

import { useEffect, useRef, useState } from "react"
import styles from "./layouts.module.css"

const MARK = "/linky-lounge/book-club/home-v3/lazyclub-wordsearch.png"

const VARIANTS = [
  {
    key: "fit",
    name: "A. 폭 맞춤",
    desc: "마크 아래에 두되 글자 크기를 키워 텍스트 폭이 마크 폭과 정확히 같아지도록 맞췄습니다. 두 요소가 같은 세로축·같은 폭을 공유해 한 덩어리로 읽힙니다. 티저 페이지에서 가장 널리 쓰이는 정석 구성입니다.",
    reco: "추천안 — 마크를 100% 온전히 보여주면서 문구도 충분히 큽니다. 조판만으로 관계를 만드는 워크룸 계열 문법과도 맞습니다.",
  },
  {
    key: "band",
    name: "B. 밴드 오버레이",
    desc: "마크는 그대로 두고, 상하 괘선을 두른 종이색 밴드가 마크를 가로질러 그 위에 문구가 놓입니다. 마크 안의 'LAZY 캡슐'과 같은 겹침 문법이라 브랜드 언어를 잇습니다.",
    reco: "가장 개성 있는 안. 다만 밴드가 UVWX 행을 가려 글자 그리드가 일부 끊깁니다.",
  },
  {
    key: "watermark",
    name: "C. 워터마크",
    desc: "마크를 옅게(16%) 깔아 배경으로 물리고 화면 중앙에 초대형 문구를 얹습니다. 'COMING SOON'이 주인공이 되는 가장 강한 대비.",
    reco: "문구 존재감은 최대지만, 아직 알려지지 않은 브랜드의 마크를 흐리게 만드는 건 손해입니다.",
  },
] as const

type Key = (typeof VARIANTS)[number]["key"]

/** 타이핑 문구 — 완성 폭을 실측해 애니메이션에 주입한다.
 *  (ch 기반 계산은 폰트 크기·로딩 시점에 따라 마지막 글자가 잘리는 문제가 있어 실측으로 대체) */
function TypeText({ className, still = false }: { className?: string; still?: boolean }) {
  const ghostRef = useRef<HTMLSpanElement>(null)
  const [w, setW] = useState<number | null>(null)

  useEffect(() => {
    const measure = () => {
      if (ghostRef.current) setW(ghostRef.current.getBoundingClientRect().width)
    }
    measure()
    document.fonts?.ready.then(measure).catch(() => {})
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  return (
    <span className={`${styles.type} ${className ?? ""}`} aria-label="COMING SOON">
      {/* 실측용 고스트 — 화면에 보이지 않고 폭만 잰다 */}
      <span ref={ghostRef} className={styles.ghost} aria-hidden>
        COMING SOON
      </span>
      <span
        className={`${styles.typing} ${still ? styles.still : ""}`}
        style={w ? ({ ["--typeW"]: `${Math.ceil(w)}px` } as React.CSSProperties) : undefined}
        aria-hidden
      >
        COMING SOON
      </span>
      <span className={`${styles.cursor} ${still ? styles.still : ""}`} aria-hidden>
        ▮
      </span>
    </span>
  )
}

export function LayoutsShowcase() {
  const [active, setActive] = useState<Key>("fit")
  // ?still=1 · ?v=fit|band|watermark — 검토 스크린샷용 (정지 상태 + 안 지정)
  const [still, setStill] = useState(false)
  const v = VARIANTS.find((x) => x.key === active)!

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (q.get("still") === "1") setStill(true)
    const pick = q.get("v")
    if (pick && VARIANTS.some((x) => x.key === pick)) setActive(pick as Key)
  }, [])

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
      <div className={styles.head}>COMING SOON 배치 시안 — A / B / C</div>

      {active === "fit" && (
        <div className={styles.stage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.markImg} src={MARK} alt="레이지 클럽" draggable={false} />
          <div className={styles.fitRow}>
            <TypeText still={still} />
          </div>
        </div>
      )}

      {active === "band" && (
        <div className={`${styles.stage} ${styles.bandStage}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.markImg} src={MARK} alt="레이지 클럽" draggable={false} />
          <div className={styles.band}>
            <TypeText still={still} />
          </div>
        </div>
      )}

      {active === "watermark" && (
        <div className={`${styles.stage} ${styles.watermarkStage}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.markImg} src={MARK} alt="레이지 클럽" draggable={false} />
          <div className={styles.watermark}>
            <TypeText still={still} />
          </div>
        </div>
      )}

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
