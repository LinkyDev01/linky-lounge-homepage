"use client"

/**
 * F 워드서치 필드 — 영상 캡처 전용 화면 (인스타 세로 규격).
 *
 * 시안 페이지(../)의 탭·설명을 걷어내고 필드만 종이 위에 놓는다. 캔버스는 뷰포트를
 * 그대로 채우므로 4:5(1080×1350)·9:16(1080×1920) 어느 비율이든 뷰포트 크기로 정한다.
 * 세로 여백은 flex 중앙 정렬이 만든다 — 4:5 기준 위아래 각 26% (운영자 "세로 여백
 * 충분히 확보").
 *
 * ?w=<vw>  필드 가로 점유율 (기본 78 = 좌우 여백 각 11%)
 * ?seed=<n> 색·글자 배열 고정 (재현 캡처용). 없으면 매 로드 새 시드.
 *
 * 캡처 절차는 scripts 가 아니라 세션 도구(scratchpad/gifgen/make-clip.mjs)에 있다 —
 * 레포에는 화면만 둔다.
 */

import { useEffect, useState } from "react"
import { DenseStage } from "../MotionTypeShowcase"
import styles from "./capture.module.css"

export function CaptureStage() {
  const [seed, setSeed] = useState<number | null>(null)
  const [w, setW] = useState(78)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const qs = Number(q.get("seed"))
    setSeed(q.get("seed") && Number.isFinite(qs) && qs > 0 ? qs : Math.floor(Math.random() * 2147483647) || 1)
    const qw = Number(q.get("w"))
    if (Number.isFinite(qw) && qw >= 40 && qw <= 96) setW(qw)
  }, [])

  // 프리뷰 이동 바 숨김 — 캡처 화면에 걸리면 안 된다 (시안 페이지와 같은 규칙)
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
    <div className={styles.canvas} style={{ ["--fieldW" as string]: `${w}vw` }}>
      {seed !== null && <DenseStage seed={seed} reduced={false} />}
    </div>
  )
}
