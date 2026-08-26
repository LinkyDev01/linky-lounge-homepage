"use client"

/**
 * **탑네비 로고가 떨어져 제목 옆 로고가 된다** (운영자 2026-08-26: "좌측 탑네비 위에 있는
 * 로고를 띄워서 데굴데굴 굴려서 첫 문장 첫 줄 동민의 '동' 위에서 한 번 튕기고 또 한 번
 * 튕겨서 지금의 애니메이션 구도로. 지금은 두 개인데 저게 떨어져서 하나로 된다는 거야").
 *
 * **셸(탑네비)은 한 글자도 고치지 않는다.** 운영자가 "탑네비에 별도 서식을 추가해야 하나"를
 * 물었는데, 답은 아니오다 — `NavOffset` 이 이미 확립한 문법(페이지 쪽 클라이언트 컴포넌트가
 * 런타임에 셸 요소를 실측)을 그대로 써서, 셸 로고는 **인라인 style 로 숨기기만** 한다.
 * 언마운트 때 원복하므로 다른 페이지·다른 세션에 흔적이 없다.
 *
 * 날아가는 것은 셸 로고 자체가 아니라 **같은 이미지의 클론**이다(같은 png 라 '하나가 된다'가
 * 시각적으로 성립한다). 클론은 body 직속 absolute — 페이지 트리 안에 두면 조상의 transform·
 * overflow 에 걸릴 수 있고, fixed 로 두면 비행 중 스크롤에 궤적이 딸려간다.
 *
 * 좌표는 **전부 런타임 실측**이다(출발: 셸 로고 / 1차 착점: '동' 글자 / 착지: 제목 옆 로고).
 * 그래서 모바일·데스크톱에 따로 손댈 값이 없다 — 뷰포트별 하드코딩 0.
 *
 * ⚠ 폰트가 로드된 뒤에 재야 한다 — 손글씨체가 늦게 붙으면 '동' 의 위치가 통째로 달라진다.
 * ⚠ 헤더가 `position: fixed` 라 스크롤된 상태에서 열리면(뒤로가기 복원 등) 출발점이 어긋난다
 *   → 그때는 안무를 건너뛰고 최종 상태만 세운다.
 */

import { useEffect } from "react"

/** 전체 비행 시간(ms) — 세 번의 호(등장 → 1차 튕김 → 2차 튕김)를 합친 값 */
const DROP_MS = 1500
/** 이 이상 스크롤된 채로 진입하면 안무를 건너뛴다(고정 헤더 좌표가 어긋난다) */
const SCROLL_GUARD = 40

type Pt = { x: number; y: number }

/**
 * 두 점을 잇는 **포물선 한 호**를 샘플링한다.
 * 수평은 등속, 수직은 중력 가속 — `y = y0 + v0·t + ½g·t²` 에서 끝점을 지나도록 v0 를 푼다.
 * `apex` 는 이 호가 시작점보다 얼마나 더 높이 솟는지(px, 위가 +)로, 중력 g 를 정한다.
 */
function arc(from: Pt, to: Pt, apex: number, steps: number): Pt[] {
  const out: Pt[] = []
  // 솟는 높이 h 를 내는 중력: 최고점까지 걸리는 시간 비율을 t=1 기준으로 정규화해 풀면
  // v0 = -2·(h + √(h² + h·d)), g = 2·(d + v0) 형태가 된다(d = 낙차, 아래가 +).
  const d = to.y - from.y
  const h = Math.max(apex, 0)
  const v0 = -2 * (h + Math.sqrt(h * h + Math.max(h * (h + d), 0)))
  const g = 2 * (d - v0)
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    out.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + v0 * t + 0.5 * g * t * t,
    })
  }
  return out
}

export function LogoDrop() {
  useEffect(() => {
    const shellLogo = document.querySelector<HTMLImageElement>('header a[aria-label*="레이지클럽"] img')
    const pageLogo = document.querySelector<HTMLImageElement>("[data-cb-logo]")
    const sway = document.querySelector<HTMLElement>("[data-cb-sway]")
    const titleTop = document.querySelector<HTMLElement>("[data-cb-title-top]")
    if (!shellLogo || !pageLogo || !sway || !titleTop) return

    let clone: HTMLImageElement | null = null
    let anim: Animation | null = null
    let cancelled = false

    /** 안무가 끝난(또는 건너뛴) 상태: 셸 로고는 없고 제목 옆 로고만 있다.
     *  좌우왕복·회전을 **처음부터** 다시 돌린다 — 클론이 착지한 자리가 왕복의 0 지점이고
     *  회전도 정수 바퀴로 끝나므로, 그때 위상을 0 으로 맞춰야 이어붙은 자리가 안 튄다. */
    const settle = () => {
      shellLogo.style.visibility = "hidden"
      pageLogo.style.visibility = ""
      sway.style.visibility = ""
      for (const a of [...sway.getAnimations(), ...pageLogo.getAnimations()]) a.currentTime = 0
    }

    const run = async () => {
      // 글자 좌표가 서체에 딸려 있으므로 폰트부터 기다린다
      if (document.fonts?.ready) await document.fonts.ready
      if (cancelled) return

      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
      if (reduce || window.scrollY > SCROLL_GUARD || typeof Element.prototype.animate !== "function") {
        settle()
        return
      }

      // ── 실측 (문서 좌표) ──────────────────────────────────────────
      const sx = window.scrollX
      const sy = window.scrollY
      const doc = (r: DOMRect): Pt => ({ x: r.left + sx + r.width / 2, y: r.top + sy + r.height / 2 })

      const startRect = shellLogo.getBoundingClientRect()
      const endRect = pageLogo.getBoundingClientRect()
      const start = doc(startRect)
      // ⚠ 크기는 rect 가 아니라 offsetWidth 로 잰다 — 두 로고 다 **회전 중**이라
      //   축정렬 경계상자가 최대 √2 배까지 부푼다(74px 로고가 100px 로 읽혔다).
      //   중심은 회전에 불변이라 rect 로 구해도 맞다.
      const startSize = shellLogo.offsetWidth || startRect.width
      const endSize = pageLogo.offsetWidth || endRect.width

      // 착지점은 '지금 로고가 있는 자리'가 아니라 **좌우왕복의 0 지점**이다.
      // .logoSway 가 최대 -40px(데스크톱 -72px)까지 밀고 있어, 현재 위치에 착지시키면
      // 착지 직후 왕복이 0 에서 다시 시작하며 그만큼 툭 튄다.
      const swayShift = new DOMMatrixReadOnly(getComputedStyle(sway).transform).e
      const end = { x: doc(endRect).x - swayShift, y: doc(endRect).y }

      // 접점 보정: 1차 튕김은 비행의 45% 지점쯤이라 그때 공은 이미 그만큼 커져 있다.
      // 출발 크기로 반지름을 잡으면 공이 글자에 파묻힌다 — 그 시점 크기로 잰다.
      const bounceRadius = (startSize + (endSize - startSize) * 0.45) / 2

      // '동' 한 글자만의 상자 — Range 로 첫 글자를 집어 재면 마크업을 건드릴 필요가 없다
      const text = titleTop.firstChild
      let hitTop: Pt
      if (text && text.nodeType === Node.TEXT_NODE) {
        const range = document.createRange()
        range.setStart(text, 0)
        range.setEnd(text, 1)
        const r = range.getBoundingClientRect()
        // 글자 **위**에서 튕긴다 — 공 반지름만큼 띄운 지점이 접점이다
        hitTop = { x: r.left + sx + r.width / 2, y: r.top + sy - bounceRadius }
      } else {
        const r = titleTop.getBoundingClientRect()
        hitTop = { x: r.left + sx + 20, y: r.top + sy - bounceRadius }
      }

      // 2차 튕김은 '동' 과 착지점 사이 — 가로 62% 지점, 착지 높이보다 조금 위
      const hit2: Pt = {
        x: hitTop.x + (end.x - hitTop.x) * 0.62,
        y: Math.max(hitTop.y, end.y - endSize * 0.5),
      }

      // ── 경로: 세 개의 포물선 호 ───────────────────────────────────
      // ① 살짝 띄웠다가 '동' 으로 낙하 ② '동' 에서 튕겨 오름 ③ 낮게 한 번 더 튕겨 착지
      const A = Math.round(28 * 0.4)
      const path: Pt[] = [start]
      path.push(...arc(start, hitTop, Math.max(18, A), 26))
      path.push(...arc(hitTop, hit2, 30, 20))
      path.push(...arc(hit2, end, 14, 14))

      // ── 구르기: 회전각을 장식이 아니라 **이동거리에서** 유도한다 ──
      // Δθ = 이동거리 / 반지름 (실제 굴러가는 각속도). 오른쪽으로 가니 시계방향(+).
      const radius = (startSize + endSize) / 4
      const seg: number[] = [0]
      for (let i = 1; i < path.length; i++) {
        seg.push(seg[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y))
      }
      const total = seg[seg.length - 1]
      const rawDeg = (total / radius) * (180 / Math.PI)
      // **정수 바퀴로 끝맺는다** — 착지 뒤 이어받는 cbSpin 이 0° 에서 시작하므로,
      // 어중간한 각도로 멈추면 그 차이만큼 툭 돈다. 굴림 비율을 아주 살짝 늘려 맞춘다.
      const fit = Math.max(1, Math.round(rawDeg / 360)) * 360
      const n = path.length - 1
      const frames = path.map((p, i) => {
        const t = i / n
        const size = startSize + (endSize - startSize) * t
        const deg = total > 0 ? (seg[i] / total) * fit : 0
        return {
          offset: t,
          transform:
            `translate(${(p.x - size / 2).toFixed(2)}px, ${(p.y - size / 2).toFixed(2)}px) ` +
            `rotate(${deg.toFixed(1)}deg) scale(${(size / startSize).toFixed(4)})`,
        }
      })

      if (cancelled) return

      // ── 클론 띄우기 ──────────────────────────────────────────────
      clone = document.createElement("img")
      clone.src = shellLogo.currentSrc || shellLogo.src
      clone.alt = ""
      clone.setAttribute("aria-hidden", "true")
      Object.assign(clone.style, {
        position: "absolute",
        left: "0",
        top: "0",
        width: `${startSize}px`,
        height: `${startSize}px`,
        borderRadius: "50%",
        transformOrigin: "50% 50%",
        // 헤더(99) 위 — 출발 순간 헤더에 가리면 안 된다
        zIndex: "100",
        pointerEvents: "none",
        willChange: "transform",
      } satisfies Partial<CSSStyleDeclaration>)
      document.body.appendChild(clone)

      shellLogo.style.visibility = "hidden"
      pageLogo.style.visibility = "hidden"
      sway.style.visibility = "hidden"

      anim = clone.animate(frames, { duration: DROP_MS, easing: "linear", fill: "forwards" })
      anim.finished
        .then(() => {
          if (cancelled) return
          settle()
          clone?.remove()
          clone = null
        })
        .catch(() => {
          /* 취소는 정상 경로 — cleanup 이 뒷정리한다 */
        })
    }

    run()

    return () => {
      cancelled = true
      anim?.cancel()
      clone?.remove()
      // 셸 로고는 이 페이지를 떠나면 반드시 되돌린다
      shellLogo.style.visibility = ""
      pageLogo.style.visibility = ""
      sway.style.visibility = ""
    }
  }, [])

  return null
}
