"use client"

/**
 * [프리뷰 시안] 로고가 제목을 밀어 떨어뜨린다 (운영자 2026-09-11 기획):
 *   1. 우상단 원형 로고의 좌우 왕복이 '동민과 고든 / 커피앤바' 제목을 **조금씩 왼쪽으로 밀친다**.
 *   2. 10번째에 제목이 화면 왼쪽 가장자리에 걸쳐 있다가(밀릴수록 점점 더 걸친다) 결국 떨어져,
 *      **하단 푸터의 윗 선에 맞추어 세로로** 떨어져 박힌다 — 글자 세트 통째로.
 *
 * ⚠ 실사이트(/meetings/dm-gd)에는 붙지 않는다 — /coffeebar-push 프리뷰만 렌더한다.
 *
 * 구현 규율은 LogoDrop 과 같다: 좌표는 전부 런타임 실측(제목·로고·푸터 윗선), 셸은 건드리지 않고,
 * 떨어지는 것은 제목의 **클론**(body 직속 absolute — 조상의 overflow·transform 에 걸리지 않는다).
 * 원본 제목은 밀리는 동안(translateX)만 쓰고, 떨어지는 순간 visibility 를 끈다.
 *
 * 밀기 한 번 P = (제목 폭 × 0.55 + 제목 좌측 여백) / 10 — 열 번째에 무게중심이 가장자리를 넘어 기운다.
 * 로고 왕복 폭은 매번 (제목 우측 끝까지의 거리 + P)로 늘어난다 — 제목이 멀어질수록 더 멀리 간다.
 * 넘어짐·낙하는 rAF 로 직접 적분한다(회전 피벗 = 뷰포트 좌측 가장자리 × 제목 아랫변, 중력 2200px/s²)
 * 그리고 낙하 중 스크롤이 따라간다 — 푸터가 화면 밖이라 안 따라가면 박히는 장면을 못 본다.
 * 착지: 회전 -90°, 왼쪽 여백 15px, 아랫끝('동')이 푸터 윗선에 닿는다. 6px 파묻혔다 되튄다("박힌다").
 */

import { useEffect } from "react"

const PUSHES = 10
const GRAVITY = 2200 // px/s²

function easeIn(t: number) {
  return t * t
}
function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t)
}

export function TitlePush({ speed = 1, startDelayMs = 3200 }: { speed?: number; startDelayMs?: number }) {
  useEffect(() => {
    let cancelled = false
    let clone: HTMLElement | null = null
    let raf = 0
    const h1 = document.querySelector<HTMLElement>("[data-cb-root] h1")
    const sway = document.querySelector<HTMLElement>("[data-cb-sway]")
    const footerLine = document.querySelector<HTMLElement>("footer > div")
    const root = document.querySelector<HTMLElement>("[data-cb-root]")
    if (!h1 || !sway || !footerLine || !root) return

    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms / speed))
    const anim = (el: Element, kf: Keyframe[], ms: number, easing: string) =>
      el.animate(kf, { duration: ms / speed, easing, fill: "forwards" }).finished

    async function run() {
      await wait(startDelayMs)
      if (cancelled) return
      // 셸 로고가 굴러 떨어져 자리를 잡은 뒤(LogoDrop) 왕복을 우리가 이어받는다
      sway!.style.animation = "none"
      sway!.style.transform = "translateX(0)"
      const t0 = h1!.getBoundingClientRect()
      const s0 = sway!.getBoundingClientRect()
      const gap = Math.max(0, s0.left - t0.right)
      const P = (t0.width * 0.55 + t0.left) / PUSHES

      for (let i = 0; i < PUSHES; i++) {
        if (cancelled) return
        const reach = gap + i * P
        // 다가간다 → 닿아서 민다(제목도 같은 양만큼) → 돌아간다
        await anim(sway!, [{ transform: "translateX(0)" }, { transform: `translateX(${-reach}px)` }], 560, "cubic-bezier(.4,0,1,1)")
        if (cancelled) return
        await Promise.all([
          anim(sway!, [{ transform: `translateX(${-reach}px)` }, { transform: `translateX(${-(reach + P)}px)` }], 170, "cubic-bezier(0,0,.2,1)"),
          anim(
            h1!,
            [
              { transform: `translateX(${-i * P}px) rotate(0deg)` },
              { transform: `translateX(${-(i + 0.7) * P}px) rotate(-1.2deg)`, offset: 0.6 },
              { transform: `translateX(${-(i + 1) * P}px) rotate(0deg)` },
            ],
            220,
            "cubic-bezier(.2,.8,.2,1)",
          ),
        ])
        if (cancelled) return
        if (i === PUSHES - 1) break
        await anim(sway!, [{ transform: `translateX(${-(reach + P)}px)` }, { transform: "translateX(0)" }], 760, "cubic-bezier(.45,0,.55,1)")
      }
      if (cancelled) return
      // 로고는 제자리로 돌아가 원래 왕복을 되찾는다
      anim(sway!, [{ transform: `translateX(${-(gap + PUSHES * P)}px)` }, { transform: "translateX(0)" }], 760, "cubic-bezier(.45,0,.55,1)").then(() => {
        if (!cancelled) {
          sway!.style.animation = ""
          sway!.style.transform = ""
        }
      })

      // ── 걸쳐 있던 제목이 넘어져 떨어진다 — 클론으로 ──
      const tr = h1!.getBoundingClientRect() // 밀린 뒤 위치 (transform 포함)
      const sx = window.scrollX
      const sy = window.scrollY
      clone = h1!.cloneNode(true) as HTMLElement
      const rs = getComputedStyle(root!)
      for (const v of ["--cb-orange", "--cb-plum", "--cb-sage", "--hand", "--ink", "--paper", "--suit"]) {
        const val = rs.getPropertyValue(v)
        if (val) clone.style.setProperty(v, val)
      }
      const cs = getComputedStyle(h1!)
      Object.assign(clone.style, {
        position: "absolute",
        left: `${tr.left + sx}px`,
        top: `${tr.top + sy}px`,
        width: `${tr.width}px`,
        margin: "0",
        transform: "none",
        zIndex: "500",
        pointerEvents: "none",
        color: cs.color,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
      } as Partial<CSSStyleDeclaration>)
      document.body.appendChild(clone)
      h1!.style.visibility = "hidden"

      const w = tr.width
      const h = tr.height
      const cloneLeft = tr.left + sx // 문서 x (음수 — 왼쪽으로 걸쳐 있다)
      const cloneTop = tr.top + sy
      const ox = -cloneLeft // 피벗 = 뷰포트 좌측 가장자리 (클론 좌표계)
      clone.style.transformOrigin = `${ox}px ${h}px`
      const footerTop = footerLine!.getBoundingClientRect().top + sy
      // 최종: rotate(-90) 뒤 상자의 왼변이 15px, 아랫끝이 푸터 윗선 (유도는 파일 머리 주석의 좌표식)
      const txEnd = 15 + h
      const tyEnd = footerTop - cloneTop - h - ox
      const tipMs = 700 / speed
      const fallMs = (Math.sqrt((2 * Math.max(tyEnd, 1)) / GRAVITY) * 1000) / speed
      const sinkMs = 260 / speed
      const start = performance.now()
      const vh = window.innerHeight
      const step = (now: number) => {
        if (cancelled || !clone) return
        const t = now - start
        let deg: number
        let tx: number
        let ty: number
        if (t < tipMs) {
          const u = easeIn(t / tipMs)
          deg = -62 * u
          tx = txEnd * 0.15 * u
          ty = 0
        } else if (t < tipMs + fallMs) {
          const u = (t - tipMs) / fallMs
          deg = -62 - 28 * easeOut(Math.min(1, u * 1.6))
          tx = txEnd * (0.15 + 0.85 * easeOut(Math.min(1, u * 1.4)))
          ty = tyEnd * u * u // 중력 — 등가속
          window.scrollTo(0, Math.max(0, cloneTop + ty + h + ox - vh * 0.62))
        } else if (t < tipMs + fallMs + sinkMs) {
          const u = (t - tipMs - fallMs) / sinkMs
          deg = -90
          tx = txEnd
          ty = tyEnd + 6 * Math.sin(Math.PI * u) * (1 - u * 0.5) // 6px 파묻혔다 되튄다
          window.scrollTo(0, Math.max(0, footerTop - vh * 0.62))
        } else {
          clone.style.transform = `translate(${txEnd}px, ${tyEnd}px) rotate(-90deg)`
          return
        }
        clone.style.transform = `translate(${tx}px, ${ty}px) rotate(${deg}deg)`
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    run()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      clone?.remove()
      h1.style.visibility = ""
      h1.style.transform = ""
      h1.getAnimations().forEach((a) => a.cancel())
      sway.getAnimations().forEach((a) => a.cancel())
      sway.style.animation = ""
      sway.style.transform = ""
    }
  }, [speed, startDelayMs])
  return null
}
