"use client"

import { useCallback, useRef, useState } from "react"

/**
 * 사진 뷰어용 핀치 줌·팬 엔진 (2026-08-19, 후기 모달 확대 개선 프로토타입).
 *
 * 인스타그램·아이폰 사진 앱과 같은 느낌을 목표로 한다: 두 손가락 사이 거리·중점을
 * 그대로 좇는 연속 배율(고정 2배 토글이 아님), 손가락을 뗀 뒤에만 경계 보정.
 *
 * 설계 원칙:
 *  - 제스처가 진행되는 동안(pointermove)은 **transition 없이** 손가락을 1:1로 좇는다.
 *    React state 를 프레임마다 갱신하면 리렌더가 추적을 지연시키므로, 진행 중에는
 *    ref 에만 쓰고 DOM 스타일을 직접 mutate 한다(`layerEl.style.transform`).
 *  - 손을 뗐을 때(pointerup)만 경계를 확정한다 — 1배 밑으로 줄었으면 1배로,
 *    최대 배율을 넘었으면 최대치로, 팬이 이미지 밖으로 나갔으면 안으로.
 *    이 순간에만 짧은 CSS transition 을 걸어 "스프링" 감속을 낸다.
 *  - transform-origin 은 '0 0'(좌상단) 으로 고정하고 translate 뒤 scale 을 적용한다.
 *    이러면 좌표 변환이 `screenX = frameLeft + x + localX*scale` 로 단순해져
 *    포인터 좌표 ↔ 이미지 내부 좌표를 안정적으로 왕복 계산할 수 있다.
 */

const MIN_SCALE = 1
const MAX_SCALE = 4
/** 최대 배율을 넘겨 벌릴 때의 저항 — 늘어나는 만큼 sqrt 로 눌러 "더는 안 늘어나는" 느낌 */
const OVER_ELASTIC = 0.6
/** 1배 밑으로 오므릴 때의 저항 — 완전히 막지는 않되 쉽게 줄지 않게 */
const UNDER_ELASTIC = 0.25
const DOUBLE_TAP_SCALE = 2.5
const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_SLOP = 30
const TAP_SLOP = 8
const SETTLE_MS = 240
const EPS = 0.01

export type Xf = { scale: number; x: number; y: number }

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function mid(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/** 최대·최소 배율을 살짝 넘겨도 저항 곡선으로 눌러준다 (실시간 표시용) */
function elasticScale(raw: number) {
  if (raw > MAX_SCALE) return MAX_SCALE + Math.sqrt(raw - MAX_SCALE) * OVER_ELASTIC
  if (raw < MIN_SCALE) return MIN_SCALE - Math.sqrt(MIN_SCALE - raw) * UNDER_ELASTIC
  return raw
}

/** 스케일된 레이어가 프레임을 항상 덮도록 하는 팬 허용 범위 */
function panBounds(scale: number, frameW: number, frameH: number) {
  const xMin = Math.min(0, frameW - frameW * scale)
  const yMin = Math.min(0, frameH - frameH * scale)
  return { xMin, xMax: 0, yMin, yMax: 0 }
}

export function useZoomGesture() {
  const frameElRef = useRef<HTMLDivElement | null>(null)
  const layerElRef = useRef<HTMLDivElement | null>(null)
  const xfRef = useRef<Xf>({ scale: 1, x: 0, y: 0 })
  const [zoomed, setZoomed] = useState(false)

  // 진행 중인 포인터들 (핀치 판정용)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  type PinchGesture = { kind: "pinch"; startDist: number; startXf: Xf; midLocal: { x: number; y: number } }
  type PanGesture = {
    kind: "pan"
    startPointerId: number
    startX: number
    startY: number
    startXf: Xf
    moved: boolean
    /** 핀치(2손가락)에서 손가락 하나가 막 떨어져 이어받은 팬인지 — 이 경우 남은
     *  손가락마저 움직임 없이 바로 떨어지면(극단적으로 동시에 떼는 케이스) "탭"이
     *  아니라 핀치의 마무리이므로 settle() 로 보내야 한다. 실측으로 발견: 두 CDP
     *  touchEnd 가 같은 틱에 들어오면 이 핸드오프 팬이 즉시 0손가락이 되는데,
     *  이걸 일반 탭과 구분 못 하면 resolveTapRelease 로 새서 최대 배율 클램프가
     *  통째로 스킵된다(2026-08-19 실측). */
    fromPinch: boolean
  }
  type TapGesture = { kind: "tap"; startX: number; startY: number; moved: boolean; startTime: number }
  const gesture = useRef<PinchGesture | PanGesture | TapGesture | null>(null)
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null)
  const settleTimer = useRef<number | null>(null)

  const setFrameRef = useCallback((el: HTMLDivElement | null) => {
    frameElRef.current = el
  }, [])
  const setLayerRef = useCallback((el: HTMLDivElement | null) => {
    layerElRef.current = el
    if (el) applyStyle(el, xfRef.current, false)
  }, [])

  function applyStyle(el: HTMLDivElement, xf: Xf, eased: boolean) {
    el.style.transition = eased
      ? `transform ${SETTLE_MS}ms cubic-bezier(0.22, 0.8, 0.36, 1)`
      : "none"
    el.style.transform = `translate(${xf.x}px, ${xf.y}px) scale(${xf.scale})`
  }

  /** 클라이언트 좌표 → 현재 transform 기준 이미지 내부 좌표(비배율) */
  function toLocal(clientX: number, clientY: number, xf: Xf, frameRect: DOMRect) {
    return {
      x: (clientX - frameRect.left - xf.x) / xf.scale,
      y: (clientY - frameRect.top - xf.y) / xf.scale,
    }
  }

  const setXf = useCallback((xf: Xf, eased: boolean) => {
    xfRef.current = xf
    const el = layerElRef.current
    if (el) applyStyle(el, xf, eased)
    setZoomed(xf.scale > 1 + EPS)
  }, [])

  const reset = useCallback(() => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current)
    pointers.current.clear()
    gesture.current = null
    setXf({ scale: 1, x: 0, y: 0 }, false)
  }, [setXf])

  /** 목표 배율로 (clientX,clientY) 지점을 기준 삼아 부드럽게 이동한다 — 더블탭·클릭·버튼 공용 */
  const zoomTo = useCallback(
    (targetScale: number, clientX: number, clientY: number) => {
      const frameEl = frameElRef.current
      if (!frameEl) return
      const rect = frameEl.getBoundingClientRect()
      const cur = xfRef.current
      const local = toLocal(clientX, clientY, cur, rect)
      let x = clientX - rect.left - local.x * targetScale
      let y = clientY - rect.top - local.y * targetScale
      if (targetScale <= MIN_SCALE + EPS) {
        x = 0
        y = 0
      } else {
        const b = panBounds(targetScale, rect.width, rect.height)
        x = clamp(x, b.xMin, b.xMax)
        y = clamp(y, b.yMin, b.yMax)
      }
      setXf({ scale: targetScale, x, y }, true)
    },
    [setXf],
  )

  /** 확대 상태면 1배로, 아니면 지정 배율로 — 더블탭·클릭 토글 공용 */
  const toggleZoomAt = useCallback(
    (clientX: number, clientY: number, scaleWhenZoomingIn: number) => {
      if (xfRef.current.scale > 1 + EPS) zoomTo(1, clientX, clientY)
      else zoomTo(scaleWhenZoomingIn, clientX, clientY)
    },
    [zoomTo],
  )

  /** 프레임 중심 기준 +/− 버튼용 */
  const stepZoom = useCallback(
    (dir: 1 | -1) => {
      const frameEl = frameElRef.current
      if (!frameEl) return
      const rect = frameEl.getBoundingClientRect()
      const next = clamp(xfRef.current.scale + dir * 0.6, MIN_SCALE, MAX_SCALE)
      zoomTo(next, rect.left + rect.width / 2, rect.top + rect.height / 2)
    },
    [zoomTo],
  )

  function settle() {
    const frameEl = frameElRef.current
    if (!frameEl) return
    const rect = frameEl.getBoundingClientRect()
    const cur = xfRef.current
    let target: Xf = { ...cur }
    if (cur.scale < MIN_SCALE - EPS) {
      target = { scale: 1, x: 0, y: 0 }
    } else {
      const scale = clamp(cur.scale, MIN_SCALE, MAX_SCALE)
      const b = panBounds(scale, rect.width, rect.height)
      target = { scale, x: clamp(cur.x, b.xMin, b.xMax), y: clamp(cur.y, b.yMin, b.yMax) }
    }
    const changed =
      Math.abs(target.scale - cur.scale) > EPS ||
      Math.abs(target.x - cur.x) > 0.5 ||
      Math.abs(target.y - cur.y) > 0.5
    if (changed) setXf(target, true)
    else setZoomed(cur.scale > 1 + EPS)
  }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size >= 2) {
      // 핀치 시작 — 세 번째 손가락은 무시(둘째까지만 사용)
      const [a, b] = Array.from(pointers.current.values())
      const frameEl = frameElRef.current
      if (!frameEl) return
      const rect = frameEl.getBoundingClientRect()
      const m = mid(a, b)
      gesture.current = {
        kind: "pinch",
        startDist: dist(a, b),
        startXf: { ...xfRef.current },
        midLocal: toLocal(m.x, m.y, xfRef.current, rect),
      }
      return
    }

    if (xfRef.current.scale > 1 + EPS) {
      gesture.current = {
        kind: "pan",
        startPointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startXf: { ...xfRef.current },
        moved: false,
        fromPinch: false,
      }
      return
    }

    gesture.current = { kind: "tap", startX: e.clientX, startY: e.clientY, moved: false, startTime: Date.now() }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return

    if (g.kind === "pinch") {
      if (pointers.current.size < 2) return
      const [a, b] = Array.from(pointers.current.values())
      const newDist = dist(a, b)
      const m = mid(a, b)
      const rawScale = g.startXf.scale * (newDist / Math.max(1, g.startDist))
      const scale = elasticScale(rawScale)
      const x = m.x - (frameElRef.current?.getBoundingClientRect().left ?? 0) - g.midLocal.x * scale
      const y = m.y - (frameElRef.current?.getBoundingClientRect().top ?? 0) - g.midLocal.y * scale
      setXf({ scale, x, y }, false)
      return
    }

    if (g.kind === "pan") {
      const dx = e.clientX - g.startX
      const dy = e.clientY - g.startY
      if (Math.abs(dx) + Math.abs(dy) > TAP_SLOP) g.moved = true
      setXf({ scale: g.startXf.scale, x: g.startXf.x + dx, y: g.startXf.y + dy }, false)
      return
    }

    // tap 추적 — 문턱을 넘으면 스와이프 판정으로 전환(호출부가 dx 를 직접 읽는다)
    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY
    if (Math.abs(dx) + Math.abs(dy) > TAP_SLOP) g.moved = true
  }

  /**
   * 이동 없는 탭/클릭의 공통 처리 — 더블탭(터치)·단일클릭(마우스)의 확대 토글 판정.
   * ⚠ scale===1 에서 시작한 "tap" 제스처뿐 아니라, **이미 확대된 상태**에서 시작한
   *   "pan" 제스처가 결국 움직이지 않은 경우(=확대 중 탭/재클릭)도 여기로 들어와야
   *   재클릭·더블탭 복귀가 동작한다 — 둘을 분리해서 각자 처리하면 확대 상태의
   *   탭이 판정에서 누락된다(실측으로 발견한 버그, 2026-08-19).
   */
  function resolveTapRelease(clientX: number, clientY: number, pointerType: string) {
    const now = Date.now()
    const last = lastTap.current
    const isDouble =
      pointerType !== "mouse" &&
      last &&
      now - last.time < DOUBLE_TAP_MS &&
      Math.hypot(clientX - last.x, clientY - last.y) < DOUBLE_TAP_SLOP
    lastTap.current = { time: now, x: clientX, y: clientY }

    if (isDouble) {
      toggleZoomAt(clientX, clientY, DOUBLE_TAP_SCALE)
      return { consumed: true, tap: true }
    }
    if (pointerType === "mouse") {
      // 데스크톱: 단일 클릭이 곧 확대 토글(줌인/줌아웃 양방향)
      toggleZoomAt(clientX, clientY, DOUBLE_TAP_SCALE)
      return { consumed: true, tap: true }
    }
    if (xfRef.current.scale > 1 + EPS) {
      // 모바일: 확대 상태에서의 단일 탭은 아무 것도 하지 않는다(더블탭 전용).
      // 다만 좌표는 위에서 이미 lastTap 에 기록했으니 바로 다음 탭이 더블탭으로 잡힌다.
      return { consumed: true, tap: true }
    }
    // 모바일 단일 탭(비확대) — 호출부가 이웃 카드 판정 등에 쓸 수 있게 넘긴다
    return { consumed: false, tap: true }
  }

  /**
   * 반환값으로 호출부(캐러셀 스와이프·닫기 로직)에 제스처 결과를 알려준다.
   *  - `consumed: true` 면 이 포인터업은 확대 엔진이 전부 처리했다 — 스와이프·탭 판정 생략.
   *  - `tap` 이면 이동 없는 탭이었다 — 호출부가 이웃 카드 판정 등에 쓸 수 있다.
   */
  function onPointerUp(e: React.PointerEvent, opts: { pointerType: string }) {
    pointers.current.delete(e.pointerId)
    const g = gesture.current

    if (g?.kind === "pinch") {
      if (pointers.current.size >= 2) return { consumed: true, tap: false }
      if (pointers.current.size === 1) {
        // 손가락 하나 남음 — 튐 없이 팬으로 이어받는다
        const [remainId, remainPos] = Array.from(pointers.current.entries())[0]
        gesture.current = {
          kind: "pan",
          startPointerId: remainId,
          startX: remainPos.x,
          startY: remainPos.y,
          startXf: { ...xfRef.current },
          moved: false,
          fromPinch: true,
        }
        return { consumed: true, tap: false }
      }
      gesture.current = null
      settle()
      return { consumed: true, tap: false }
    }

    if (g?.kind === "pan") {
      const { moved, fromPinch } = g
      if (pointers.current.size === 0) {
        gesture.current = null
        if (!moved && !fromPinch) return resolveTapRelease(e.clientX, e.clientY, opts.pointerType)
        settle()
      }
      return { consumed: true, tap: false }
    }

    if (g?.kind === "tap") {
      gesture.current = null
      if (g.moved) return { consumed: false, tap: false }
      return resolveTapRelease(e.clientX, e.clientY, opts.pointerType)
    }

    return { consumed: false, tap: false }
  }

  function onPointerCancel(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) {
      gesture.current = null
      settle()
    }
  }

  /** 트랙패드 핀치(대부분 브라우저가 wheel+ctrlKey 로 합성) — 마우스 휠 확대는 걸지 않는다 */
  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey) return
    e.preventDefault()
    const next = clamp(xfRef.current.scale - e.deltaY * 0.02, MIN_SCALE, MAX_SCALE)
    zoomTo(next, e.clientX, e.clientY)
  }

  return {
    frameRef: setFrameRef,
    layerRef: setLayerRef,
    zoomed,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onWheel,
    zoomIn: (clientX: number, clientY: number) => toggleZoomAt(clientX, clientY, DOUBLE_TAP_SCALE),
    stepZoom,
    reset,
  }
}
