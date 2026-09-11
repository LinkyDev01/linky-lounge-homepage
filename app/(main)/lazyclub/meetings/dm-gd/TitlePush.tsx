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
 *
 * 3차(운영자 "물리법칙과 바닥 수평선이 글자 높이와 안 맞아. 떨어질 때도 다른 쪽에 힘이 들어간 것 마냥 이상해 /
 * 레이지클럽 원 좀 빨라, 느려도 돼"):
 *   · **판 = 글자 잉크 상자**. h1 박스는 줄간(1.3)만큼 위아래가 비어 있어 박스 아랫변을 바닥으로 삼으면 글자가 선
 *     위에 떠 보였다 → 물리 상자를 세로 0.15em·가로 2px 안쪽으로 잡는다(모서리·바닥 접촉 모두 이 상자 기준).
 *   · **외력 제거**: 2차의 '세로로 서려는 공기 토크'와 탁자 옆면 충돌(법선이 탁자 쪽으로 밀어 반대쪽 힘처럼 보였다)을
 *     없앤다. 선반 아래는 빈 공간 — 이탈(70°) 뒤엔 중력과 **회전 공기 저항**(넓적한 판이라 회전이 빨리 잦아든다)만
 *     있다. 저항 계수는 이탈 순간 각속도로 정해 회전이 세로에서 잦아들게 한다(한 방향으로만 감속, 되돌아오는 힘 없음).
 *   · 선반 모서리 E 는 콘텐츠 왼쪽 여백 + 45px — 판이 세로로 섰을 때(두께 ≈ 99) 화면 안에 놓이는 자리. 밀기 총량은
 *     무게중심이 E 를 5% 넘는 만큼(≈56px, 한 번 5.6px).
 *   · 로고 왕복을 늦춘다: 다가감 420→520 · 밀기 130→150 · 되돌아감 560→680ms (한 사이클 1.1→1.35s).
 * 좌표는 전부 런타임 실측(제목·로고·모서리·푸터 윗선), 셸은 건드리지 않고, 떨어지는 건 제목의 **클론**(body 직속).
 * 반복 없음 — 페이지 진입마다 한 번, 떨어진 채로 둔다(운영자 "정해둬도 돼").
 */

import { useEffect } from "react"

const PUSHES = 10
const G = 2200 // px/s²
const SUB = 1 / 480 // 적분 간격(초)
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

    const start = () => {
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
      // 물리 상자 = 글자 잉크 상자(박스에서 세로 0.15em·가로 2px 안쪽)
      const fs = parseFloat(getComputedStyle(h1).fontSize) || 38
      const padY = 0.15 * fs
      const padX = 2
      const wB = t0.width
      const hB = t0.height
      const w = wB - 2 * padX
      const h = hB - 2 * padY
      const EDGE_IN = 45 // 선반 모서리 = 콘텐츠 왼쪽 여백 + 45px — 판이 세로로 섰을 때(두께 ≈ 99) 화면 안에 놓이는 자리
      const edgeX = t0.left + EDGE_IN
      // 무게중심이 모서리를 5% 넘을 때까지 민다
      const P = (t0.left + padX + w / 2 - edgeX + 0.05 * w) / PUSHES
      const R = logo.offsetWidth / 2 || 37
      const vh = window.innerHeight

      // ── 밀기 시간표(ms, 1배속 기준) — 로고 x 와 제목 x 를 시각 함수로 ──
      type Seg = { t0: number; t1: number; lx0: number; lx1: number; ease: (t: number) => number; tx0: number; tx1: number }
      const segs: Seg[] = []
      let T = 0
      for (let i = 0; i < PUSHES; i++) {
        const reach = gap + i * P
        segs.push({ t0: T, t1: T + 520, lx0: 0, lx1: -reach, ease: easeIn, tx0: -i * P, tx1: -i * P })
        T += 520
        segs.push({ t0: T, t1: T + 150, lx0: -reach, lx1: -(reach + P), ease: easeOut, tx0: -i * P, tx1: -(i + 1) * P })
        T += 150
        segs.push({ t0: T, t1: T + 680, lx0: -(reach + P), lx1: 0, ease: easeInOut, tx0: -(i + 1) * P, tx1: -(i + 1) * P })
        T += 680
      }
      const pushEnd = T - 680 // 마지막 밀기 직후 — 여기서 제목이 물리로 넘어간다
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

      // ── 제목 강체 (잉크 상자 w×h, 중심은 박스 중심과 같다) ──
      // 세계: 선반 윗면(y = E.y, x ≥ E.x) · 선반 모서리 E · 선반 앞면(x = E.x, E.y ~ E.y+FACE_H, 법선은 **왼쪽**) ·
      //       화면 왼쪽 벽(x = 0, 선반 아래에서만 — 발코니 아래 벽, 법선 오른쪽) · 바닥(푸터 윗선).
      //       판은 이 다섯과만 부딪힌다 — 그 밖의 힘은 중력·공기뿐.
      const I = (w * w + h * h) / 12
      const E: V = { x: edgeX + sx, y: t0.bottom - padY + sy } // 선반 모서리(문서 좌표) — 잉크 아랫변 높이
      const FACE_H = 140
      const WALL_X = sx // 화면 왼쪽 벽
      const floorY = footerLine.getBoundingClientRect().top + sy
      const cloneLeft = t0.left + sx - PUSHES * P
      const cloneTop = t0.top + sy
      const body = { c: { x: cloneLeft + wB / 2, y: cloneTop + hB / 2 } as V, phi: 0, v: { x: 0, y: 0 } as V, om: -0.12 } // 마지막 밀림이 준 작은 각속도
      const ROT_DAMP = 1.6 // 회전 공기 저항(넓적한 판) — 방향을 바꾸는 힘이 아니라 잦아드는 힘
      let phase: "push" | "sim" | "stuck" | "done" = "push"
      let stuck: V = { x: 0, y: 0 }
      let stuckPhi = -Math.PI / 2
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
          width: `${wB}px`, // ⚠ 박스 폭 — 잉크 폭(w)으로 주면 4px 모자라 제목이 3줄로 접힌다(실측)
          margin: "0",
          transform: "none",
          transformOrigin: `${wB / 2}px ${hB / 2}px`,
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
        clone.style.transform = `translate(${body.c.x - (cloneLeft + wB / 2)}px, ${body.c.y - (cloneTop + hB / 2)}px) rotate(${body.phi * DEG}deg)`
      }

      /** 접촉점 r(무게중심 기준)과 평면(법선 n, 판 쪽을 향함)의 충돌 — 반발 e, 마찰 mu, 작은 위치 보정 */
      const collide = (r: V, n: V, e: number, mu: number, pen: number) => {
        const vp = { x: body.v.x - body.om * r.y, y: body.v.y + body.om * r.x }
        const vn = vp.x * n.x + vp.y * n.y
        // 위치 보정은 한 번에 조금씩 — 통째로 밀어내면 임펄스와 무관한 '순간이동'이 생긴다(1차 실측: 200px 튐)
        const fix = Math.min(pen * 0.2, 0.5)
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
        if (phase === "sim") {
          body.v.y += G * dt
          body.v.x *= 1 - 0.15 * dt
          body.om -= ROT_DAMP * body.om * dt
          body.c.x += body.v.x * dt
          body.c.y += body.v.y * dt
          body.phi += body.om * dt
          const nearShelf = body.c.y < E.y + 80
          // ① 선반 모서리 E 가 판 안에 들어오면 — 판의 아랫면이 모서리에 얹혀 있다(진자의 축은 이 접촉이 만든다)
          if (nearShelf) {
            const rel = { x: E.x - body.c.x, y: E.y - body.c.y }
            const loc = rot(rel, -body.phi)
            if (Math.abs(loc.x) < w / 2 && Math.abs(loc.y) < h / 2) {
              collide(rel, rot({ x: 0, y: -1 }, body.phi), 0, 0.6, h / 2 - loc.y)
            }
          }
          for (const r of corners()) {
            const p = { x: body.c.x + r.x, y: body.c.y + r.y }
            // ② 선반 몸통(x ≥ E.x, E.y ≤ y < E.y+FACE_H) — 윗면 또는 앞면 중 얕게 들어간 쪽으로 밀려난다
            if (p.x > E.x && p.y > E.y && p.y < E.y + FACE_H && nearShelf) {
              const penX = p.x - E.x
              const penY = p.y - E.y
              if (penY <= penX) collide(r, { x: 0, y: -1 }, 0, 0.6, penY)
              else collide(r, { x: -1, y: 0 }, 0.2, 0.4, penX)
            }
            // ③ 화면 왼쪽 벽 — 선반 아래에서만 선다(선반이 벽보다 튀어나온 발코니 꼴). 선반 위에서 벽이 있으면
            //    걸쳐 나간 판을 도로 밀어 넣어 영영 안 떨어진다(실측: 62px 우측 미끄러짐)
            if (p.x < WALL_X && p.y > E.y + 40) collide(r, { x: 1, y: 0 }, 0.2, 0.4, WALL_X - p.x)
            // ④ 바닥 — 세로에 가깝게 세게 꽂히면 박힌다, 아니면 보통 충돌
            if (p.y > floorY) {
              const upright = Math.abs(body.phi + Math.PI / 2) < 0.6
              if (upright && body.v.y > 300) {
                phase = "stuck"
                const end = rot({ x: -w / 2, y: 0 }, body.phi)
                stuck = { x: body.c.x + end.x, y: floorY + 6 }
                stuckPhi = body.phi // 꽂힌 각도 그대로 — 스스로 곧추서지 않는다
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
          // 박힌 막대: 꽂힌 점을 축으로 비틀림 스프링 — 꽂힌 각도 주위로 떨리다 멎는다
          const r = { x: body.c.x - stuck.x, y: body.c.y - stuck.y }
          const gravTorque = (G * r.x) / (I + r.x * r.x + r.y * r.y)
          body.om += (gravTorque - 60 * (body.phi - stuckPhi) - 5 * body.om) * dt
          body.phi += body.om * dt
          const arm = rot({ x: w / 2, y: 0 }, body.phi)
          body.c = { x: stuck.x + arm.x, y: stuck.y + arm.y }
          if (Math.abs(body.om) < 0.02) restT += dt
          else restT = 0
          if (restT > 0.5) {
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
            phase = "sim"
          }
        } else if ((phase as string) !== "done") {
          let acc = real * speed
          while (acc > 0 && (phase as string) !== "done") {
            const dt = Math.min(SUB, acc)
            stepPhysics(dt)
            acc -= dt
          }
          drawClone()
          if ((phase === "sim" && body.c.y > E.y + 120) || phase === "stuck")
            // ⚠ behavior: instant — 셸의 scroll-behavior: smooth 를 타면 스크롤이 낙하를 못 따라간다(실측: 착지까지 sy 8)
            window.scrollTo({ top: Math.max(0, Math.min(body.c.y - vh * 0.55, floorY - vh * 0.62)), behavior: "instant" as ScrollBehavior })
        }
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }
    // ⚠ 손글씨체가 붙기 전에 재면 제목이 3줄(폴백 서체)로 잡혀 판 크기가 틀어진다(실측) — LogoDrop 과 같이 폰트를 기다린다
    const timer = setTimeout(() => {
      const ready = document.fonts?.ready ?? Promise.resolve()
      Promise.race([ready, new Promise((r) => setTimeout(r, 2500))]).then(start)
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
