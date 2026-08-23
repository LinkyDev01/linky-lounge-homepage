"use client"

/**
 * 첫 방문 인트로 오버레이 (2026-08-22, 운영자 "하위페이지 또는 utm이 뒤에 있더라도
 * 랜딩페이지 애니메이션 뜨게 할 수 있어? 최초만").
 *
 * 인스타 링크인바이오처럼 **하위 페이지로 바로 들어온 손님**(예:
 * /people/andongmin?utm_source=ig&fbclid=…)에게도 랜딩의 워드서치 인트로를 한 번 보여준다.
 *
 * **리다이렉트가 아니라 오버레이다** — 이게 설계의 핵심:
 *   · 주소가 그대로다. utm_*·fbclid 가 보존되고 광고 유입 추적이 끊기지 않는다
 *     (랜딩으로 튕겼다 돌아오면 파라미터가 유실되거나 리퍼러가 바뀐다).
 *   · 요청한 페이지가 **첫 바이트부터 그대로 응답**된다 — 크롤러·미리보기 봇·SEO 무영향.
 *   · 뒤로가기 히스토리에 군더더기가 남지 않는다.
 *
 * 재생 조건 (하나라도 어긋나면 아예 렌더하지 않는다):
 *   · 이번 방문(탭 세션)에 아직 안 봤다 — sessionStorage. 사이트 **안에서 이동할 때만**
 *     잠잠하고, 밖에서 들어올 때마다 다시 재생된다 (운영자 정정 2026-08-22)
 *   · 랜딩(/coming-soon)이 아니다 — 거기선 페이지 자체가 인트로를 재생한다(중복 방지)
 *   · prefers-reduced-motion 이 아니다
 *   · 스크린샷 모드(?t=, ?still=)가 아니다
 *
 * 손님이 화면을 누르거나 키·스크롤을 쓰면 **즉시 걷힌다** — 4.6초를 강제로 붙잡지 않는다.
 * ⚠ IdleShuffle 과 달리 mousemove 는 감지하지 않는다. 데스크톱에선 커서가 미세하게
 *   떨리기만 해도 인트로가 시작하자마자 사라져 버린다.
 *
 * 연출(배열·타임라인·색)은 `intro-core.ts` 단일 출처 — 랜딩과 같은 것을 읽는다.
 */

import { useEffect, useState } from "react"
import { HOT, INITIAL, stateAt, T } from "./intro-core"
import { BASE } from "./base-path"
import mark from "./coming-soon/coming-soon.module.css"
import styles from "./intro-overlay.module.css"

/** 관람 기록 — **탭 세션** 단위다(영구 저장 아님). 운영자 정정 2026-08-22:
 *  "뜨긴 떠야지 / 도메인 안에서 이동할 때만 안 뜨게" — 즉 '평생 1회'가 아니라
 *  '방문 1회'다. 밖에서 들어올 때(인스타 링크·북마크·새 탭)마다 다시 재생되고,
 *  사이트 안에서 페이지를 옮길 때만 잠잠하다. localStorage 였다면 한 번 본 사람에게는
 *  영영 안 떴다 — 그게 운영자가 지적한 문제다 */
const SEEN_KEY = "lzc-intro-seen"

export function IntroOverlay() {
  const [seed, setSeed] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    /** 선(先) 가림막 표식 제거 — **모든 종료 경로가 반드시 지나야 한다**.
     *  layout.tsx 의 인라인 스크립트가 첫 페인트 전에 화면을 덮어 두므로, 여기서
     *  안 지우면 손님이 빈 종이색 화면에 갇힌다 (재생하지 않기로 판정한 경우 포함) */
    const uncover = () => document.documentElement.removeAttribute("data-lzc-intro")

    // ⚠ 서버 스냅숏과 어긋나지 않도록 판정은 전부 effect 안에서 (하이드레이션 불일치 방지)
    const path = window.location.pathname
    const onLanding = path === "/" || path === `${BASE}/coming-soon` || path === "/coming-soon"
    if (onLanding) return uncover()
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return uncover()
    const q = new URLSearchParams(window.location.search)
    if (q.get("t") !== null || q.get("still") !== null) return uncover()
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return uncover()
      sessionStorage.setItem(SEEN_KEY, "1") // 재생을 시작하는 순간 기록 — 도중에 이탈해도 1회로 친다
    } catch {
      return uncover() // 저장할 수 없는 환경(프라이빗 모드 등)에선 매번 뜨느니 재생하지 않는다
    }

    setSeed(Math.floor(Math.random() * 2147483647) || 1)

    let raf = 0
    const start = performance.now()
    const end = () => {
      cancelAnimationFrame(raf)
      off()
      uncover() // 가림막과 마크를 같이 걷는다 — 둘 중 하나만 남으면 화면이 깨진다
      setGone(true)
    }
    const tick = (now: number) => {
      const e = now - start
      setElapsed(e)
      if (e >= T.END + 600) return end() // 최종 상태를 잠깐 보여 준 뒤 걷는다
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // 손님이 뭔가 하면 즉시 걷는다 (mousemove 제외 — 미세 떨림에도 사라진다)
    const EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const
    const off = () => EVENTS.forEach((ev) => window.removeEventListener(ev, end))
    EVENTS.forEach((ev) => window.addEventListener(ev, end, { passive: true }))

    return () => {
      cancelAnimationFrame(raf)
      off()
      uncover() // 언마운트(라우팅 등)로 사라져도 가림막은 반드시 걷는다
    }
  }, [])

  if (seed === null || gone) return null

  const s = stateAt(elapsed, seed)
  const cells = s.cells ?? INITIAL

  return (
    <div className={styles.overlay} aria-hidden>
      <div className={mark.grid}>
        {cells.map((cell, i) => (
          <span
            key={i}
            className={`${mark.cell}${HOT.has(`${Math.floor(i / 4)}-${i % 4}`) ? ` ${mark.hot}` : ""}`}
            style={{ color: cell.color }}
          >
            {cell.ch}
          </span>
        ))}
        {s.capLazy && <div className={`${mark.capsule} ${mark.capRow}`} />}
        {s.capClub && <div className={`${mark.capsule} ${mark.capCol}`} />}
      </div>
    </div>
  )
}
