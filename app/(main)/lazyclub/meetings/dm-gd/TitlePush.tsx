"use client"

/**
 * [프리뷰 시안] 로고가 제목을 밀어 떨어뜨린다 (운영자 2026-09-11 기획):
 *   1. 우상단 원형 로고의 좌우 왕복이 '동민과 고든 / 커피앤바' 제목을 **조금씩 왼쪽으로 밀친다**.
 *   2. 10번째에 제목이 가장자리에 걸쳐 있다가 결국 떨어져, **하단 푸터의 윗 선에 세로로** 박힌다.
 *
 * ⚠ 실사이트(/meetings/dm-gd)에는 붙지 않는다 — /coffeebar-push 프리뷰만 렌더한다.
 *
 * 2차(운영자 "떨어짐이 부자연스럽고, 그 때 레이지클럽 원이 물리법칙상 회전이 전혀 자연스럽지 않아. 난 그걸 원해 /
 * 떨어진 뒤도 마찬가지고, 떨어질 때도 기울지 않는다는 사실이 싫어. 자연스러워야지"):
 * 손으로 찍은 각도·시간표를 전부 버리고 **rAF 로 물리를 적분**한다.
 *   · 로고 = 바닥 위를 구르는 원. 회전각은 **굴러간 거리 / 반지름**(미끄러짐 없는 구름). 왼쪽으로 가면 반시계로 돌고
 *     되돌아오면 시계로 되감긴다. 제목에 닿아 미는 동안은 느리게 굴러 밀고, 시퀀스 뒤에도 이 rAF 가 왕복(주기 2.66s·
 *     폭 40)을 이어받아 구름 회전을 유지한다 — CSS 의 정속 회전(제자리에서 도는 원)은 이 페이지에서 켜지 않는다.
 *   · 제목 = 강체 판(w×h, 질량 1, 관성 (w²+h²)/12). 단계:
 *       ① 걸침 — 열 번째 밀림에 무게중심이 **콘텐츠 왼쪽 가장자리(모서리 E)** 를 5% 넘는다. 모서리를 축으로 한 진자:
 *          α = g·r_x / (I + |r|²). 처음엔 아주 천천히 기울다(무게중심이 모서리 바로 밖) 점점 빨라진다.
 *       ② 이탈 — 55° 기울면 모서리를 떠나 자유 낙하. 그때의 각속도·선속도를 그대로 가져간다(운동량 보존).
 *       ③ 낙하 — 중력 2200px/s², 회전은 관성대로 이어지되 긴 판이 세로로 서려는 약한 공기 토크(정렬)를 준다.
 *          모서리 아래 **벽면(x = E.x)** 과 **바닥(푸터 윗선)** 은 모서리별 충돌(반발·마찰 임펄스 + 위치 보정).
 *          아래로 휘돌던 끝이 벽을 치면 튕겨 벽을 타고 내려온다 — 그래서 화면 안(왼쪽 여백)에 떨어진다.
 *       ④ 박힘 — 거의 세로로 선 채 아랫끝이 바닥에 세게 닿으면 10px 파묻히고 그 점이 새 축이 된다. 박힌 막대는
 *          비틀림 스프링(강성 60·감쇠 5)으로 세로를 향해 **떨리다 멎는다**(칼이 도마에 꽂힌 뒤처럼). 스냅·고정 각도 없음.
 *   · 낙하 중 스크롤이 판을 따라 내려간다 — 푸터가 화면 밖이라 안 따라가면 박히는 장면을 못 본다.
 * 좌표는 전부 런타임 실측(제목·로고·모서리·푸터 윗선), 셸은 건드리지 않고, 떨어지는 건 제목의 **클론**(body 직속).
 * 반복 없음 — 페이지 진입마다 한 번, 떨어진 채로 둔다(운영자 "정해둬도 돼").
 */

import { useEffect } from "react"

const PUSHES = 10
const G = 2200 // px/s²
const SUB = 1 / 480 // 적분 간격(초)
const FACE_H = 140 // 모서리 아래 탁자 옆면의 높이(px) — 제목 블록의 두께로 본다
const DEG = 180 / Math.PI

type V = { x: number; y: number }
const rot = (p: V, a: number): V => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) })

const easeIn = (t: number) => t * t
const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

export function TitlePush({ speed = 1, startDelayMs = 2600 }: { speed?: number; startDelayMs?: number }) {
  useEffect(() => {
    let cancelled = false
    let clone: HTMLElement | null = null
    let raf = 0
    const h1 = document.querySelector<HTMLElement>("[data-cb-root] h1")
    const sway = document.querySelector<HTMLElement>("[data-cb-sway]")
    const logo = document.querySelector<HTMLImageElement>("[data-cb-logo]")
    const footerLine = document.querySelector<HTMLElement>("footer > div")
    const root = document.querySelector<HTMLElement>("[data-cb-root]")
    if (!h1 || !sway || !logo || !footerLine || !root) return

    const timer = setTimeout(() => {
      if (cancelled) return
      // 셸 로고가 굴러 떨어져 자리를 잡은 뒤(LogoDrop) 왕복·회전을 우리가 이어받는다
      sway.style.animation = "none"
      sway.style.transform = "translateX(0)"
      logo.style.animation = "none"
      logo.style.transform = "rotate(0deg)"
      const t0 = h1.getBoundingClientRect()
      const s0 = sway.getBoundingClientRect()
      const sx = window.scrollX
      const sy = window.scrollY
      const gap = Math.max(0, s0.left - t0.right)
      const P = (t0.width * 0.55 + t0.left) / PUSHES
      const R = logo.offsetWidth / 2 || 37
      const vh = window.innerHeight

      // ── 밀기 시간표(ms, 1배속 기준) — 로고 x 와 제목 x 를 시각 함수로 ──
      type Seg = { t0: number; t1: number; lx0: number; lx1: number; ease: (t: number) => number; tx0: number; tx1: number }
      const segs: Seg[] = []
      let T = 0
      for (let i = 0; i < PUSHES; i++) {
        const reach = gap + i * P
        segs.push({ t0: T, t1: T + 420, lx0: 0, lx1: -reach, ease: easeIn, tx0: -i * P, tx1: -i * P })
        T += 420
        segs.push({ t0: T, t1: T + 130, lx0: -reach, lx1: -(reach + P), ease: easeOut, tx0: -i * P, tx1: -(i + 1) * P })
        T += 130
        segs.push({ t0: T, t1: T + 560, lx0: -(reach + P), lx1: 0, ease: easeInOut, tx0: -(i + 1) * P, tx1: -(i + 1) * P })
        T += 560
      }
      const pushEnd = T - 560 // 마지막 밀기 직후 — 여기서 제목이 물리로 넘어간다
      const seqEnd = T
      const logoAt = (ms: number): { lx: number; tx: number } => {
        if (ms >= seqEnd) {
          // 이후 왕복 — CSS cbSway(0 ↔ -40, 1.33s, ease-in-out alternate)와 같은 주기·폭을 코사인으로
          const u = (ms - seqEnd) / 1330
          return { lx: -20 + 20 * Math.cos(Math.PI * u), tx: -PUSHES * P }
        }
        const s = segs.find((g) => ms >= g.t0 && ms < g.t1) ?? segs[segs.length - 1]
        const u = Math.min(1, Math.max(0, (ms - s.t0) / (s.t1 - s.t0)))
        const k = s.ease(u)
        return { lx: s.lx0 + (s.lx1 - s.lx0) * k, tx: s.tx0 + (s.tx1 - s.tx0) * k }
      }

      // ── 제목 강체 ──
      const w = t0.width
      const h = t0.height
      const I = (w * w + h * h) / 12
      const E: V = { x: t0.left + sx, y: t0.bottom + sy } // 콘텐츠 왼쪽 가장자리의 모서리(문서 좌표)
      const floorY = footerLine.getBoundingClientRect().top + sy
      const cloneLeft = t0.left + sx - PUSHES * P
      const cloneTop = t0.top + sy
      const body = { c: { x: cloneLeft + w / 2, y: cloneTop + h / 2 } as V, phi: 0, v: { x: 0, y: 0 } as V, om: -0.12 } // 마지막 밀림이 준 작은 각속도 — 처음엔 겨우 기운다
      let phase: "push" | "tip" | "fly" | "stuck" | "done" = "push"
      let stuck: V = { x: 0, y: 0 }
      let restT = 0
      const corners = () => [-1, 1].flatMap((ix) => [-1, 1].map((iy) => rot({ x: (ix * w) / 2, y: (iy * h) / 2 }, body.phi)))

      const makeClone = () => {
        clone = h1.cloneNode(true) as HTMLElement
        const rs = getComputedStyle(root)
        for (const v of ["--cb-orange", "--cb-plum", "--cb-sage", "--hand", "--ink", "--paper", "--suit"]) {
          const val = rs.getPropertyValue(v)
          if (val) clone.style.setProperty(v, val)
        }
        const cs = getComputedStyle(h1)
        Object.assign(clone.style, {
          position: "absolute",
          left: `${cloneLeft}px`,
          top: `${cloneTop}px`,
          width: `${w}px`,
          margin: "0",
          transform: "none",
          transformOrigin: `${w / 2}px ${h / 2}px`,
          zIndex: "500",
          pointerEvents: "none",
          color: cs.color,
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          fontFamily: cs.fontFamily,
          fontWeight: cs.fontWeight,
        } as Partial<CSSStyleDeclaration>)
        document.body.appendChild(clone)
        h1.style.visibility = "hidden"
        h1.getAnimations().forEach((a) => a.cancel())
      }
      const drawClone = () => {
        if (!clone) return
        clone.style.transform = `translate(${body.c.x - (cloneLeft + w / 2)}px, ${body.c.y - (cloneTop + h / 2)}px) rotate(${body.phi * DEG}deg)`
      }

      /** 모서리 한 점과 평면(법선 n)의 충돌 — 반발 e, 마찰 mu, 위치 보정 */
      const collide = (r: V, n: V, e: number, mu: number, pen: number) => {
        const vp = { x: body.v.x - body.om * r.y, y: body.v.y + body.om * r.x }
        const vn = vp.x * n.x + vp.y * n.y
        // 위치 보정은 한 번에 조금씩 — 통째로 밀어내면 임펄스와 무관한 '순간이동'이 생긴다(1차 실측: 200px 튐)
        const fix = Math.min(pen * 0.15, 0.4)
        body.c.x += n.x * fix
        body.c.y += n.y * fix
        if (vn >= 0) return
        const rn = r.x * n.y - r.y * n.x
        const j = (-(1 + e) * vn) / (1 + (rn * rn) / I)
        body.v.x += j * n.x
        body.v.y += j * n.y
        body.om += (j * rn) / I
        const t = { x: n.y, y: -n.x }
        const vt = vp.x * t.x + vp.y * t.y
        const rt = r.x * t.y - r.y * t.x
        let jt = -vt / (1 + (rt * rt) / I)
        jt = Math.max(-mu * j, Math.min(mu * j, jt))
        body.v.x += jt * t.x
        body.v.y += jt * t.y
        body.om += (jt * rt) / I
      }

      const stepPhysics = (dt: number) => {
        if (phase === "tip") {
          const r = { x: body.c.x - E.x, y: body.c.y - E.y }
          const al = (G * r.x) / (I + r.x * r.x + r.y * r.y)
          body.om += al * dt
          body.phi += body.om * dt
          const r2 = rot(r, body.om * dt)
          body.c = { x: E.x + r2.x, y: E.y + r2.y }
          if (body.phi <= -55 / DEG) {
            body.v = { x: -body.om * r2.y, y: body.om * r2.x } // ω × r — 이탈 순간의 선속도
            phase = "fly"
          }
          return
        }
        if (phase === "fly") {
          body.v.y += G * dt
          body.v.x *= 1 - 0.15 * dt
          // 긴 판이 세로로 서려는 약한 공기 토크
          const target = -Math.PI / 2
          body.om += (5 * (target - body.phi) - 1.0 * body.om) * dt
          body.c.x += body.v.x * dt
          body.c.y += body.v.y * dt
          body.phi += body.om * dt
          // 모서리 아래 **탁자 옆면**(두께 FACE_H) — 휘돌아 내려오던 끝이 여기를 치고 튕겨 화면 안쪽으로 떨어진다
          for (const r of corners()) {
            const p = { x: body.c.x + r.x, y: body.c.y + r.y }
            if (p.y > E.y + 2 && p.y < E.y + FACE_H && p.x < E.x) collide(r, { x: 1, y: 0 }, 0.35, 0.3, E.x - p.x)
          }
          for (const r of corners()) {
            const p = { x: body.c.x + r.x, y: body.c.y + r.y }
            if (p.y > floorY) {
              const upright = Math.abs(body.phi - target) < 0.55
              if (upright && body.v.y > 300) {
                // 박힘 — 아랫끝(왼쪽 끝 면의 중심)이 10px 파묻힌 점이 새 축
                phase = "stuck"
                const end = rot({ x: -w / 2, y: 0 }, body.phi)
                stuck = { x: body.c.x + end.x, y: floorY + 10 }
                body.c = { x: stuck.x - end.x, y: stuck.y - end.y }
                body.om *= 0.6
                return
              }
              collide(r, { x: 0, y: -1 }, 0.2, 0.5, p.y - floorY)
            }
          }
          return
        }
        if (phase === "stuck") {
          const target = -Math.PI / 2
          const r = { x: body.c.x - stuck.x, y: body.c.y - stuck.y }
          const gravTorque = (G * r.x) / (I + r.x * r.x + r.y * r.y)
          body.om += (gravTorque - 60 * (body.phi - target) - 5 * body.om) * dt
          body.phi += body.om * dt
          const arm = rot({ x: w / 2, y: 0 }, body.phi)
          body.c = { x: stuck.x + arm.x, y: stuck.y + arm.y }
          if (Math.abs(body.om) < 0.02 && Math.abs(body.phi - target) < 0.003) restT += dt
          else restT = 0
          if (restT > 0.4) {
            body.phi = target
            body.om = 0
            phase = "done"
          }
        }
      }

      let last = performance.now()
      let elapsed = 0 // 1배속 ms
      const frame = (now: number) => {
        if (cancelled) return
        const real = Math.min(0.05, (now - last) / 1000)
        last = now
        elapsed += real * 1000 * speed
        // 로고 — 구름: 회전각 = 굴러간 거리 / 반지름
        const { lx, tx } = logoAt(elapsed)
        sway.style.transform = `translateX(${lx}px)`
        logo.style.transform = `rotate(${(lx / R) * DEG}deg)`
        if (phase === "push") {
          h1.style.transform = `translateX(${tx}px)`
          if (elapsed >= pushEnd) {
            makeClone()
            phase = "tip"
          }
        } else if ((phase as string) !== "done") {
          let acc = real * speed
          while (acc > 0 && (phase as string) !== "done") {
            const dt = Math.min(SUB, acc)
            stepPhysics(dt)
            acc -= dt
          }
          drawClone()
          if (phase === "fly" || phase === "stuck") window.scrollTo(0, Math.max(0, Math.min(body.c.y - vh * 0.55, floorY - vh * 0.62)))
        }
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }, startDelayMs / speed)

    return () => {
      cancelled = true
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      clone?.remove()
      h1.style.visibility = ""
      h1.style.transform = ""
      sway.style.animation = ""
      sway.style.transform = ""
      logo.style.animation = ""
      logo.style.transform = ""
    }
  }, [speed, startDelayMs])
  return null
}
