"use client"

import { useEffect, useRef } from "react"

/**
 * 모달 드래그 탈출 (2026-08-24, 운영자 지시).
 *
 * "모바일 기준 한 손가락 상하 방향으로 튕기면 다시 나가지게 —
 *  바깥을 클릭해야 하는 건 갇힌 느낌이야. 확대하지 않더라도 이미지 이동으로써
 *  이미지가 움직이고 그 상태에서 일정 정도 이하면 복귀 이상이면 모달 탈출"
 *
 * 인스타그램 사진 뷰어 문법: 비확대 상태에서 한 손가락 드래그를 이미지가
 * 따라오고(배경은 비례해 옅어짐), 놓는 순간 거리·속도가 문턱을 넘으면 그
 * 방향으로 빠져나가며 닫히고, 못 넘으면 제자리로 스프링 복귀한다.
 *
 * 두 축 모드:
 *  · `vertical`(기본) — 위·아래만 탈출, 가로는 무시(슬라이드 넘김에 양보).
 *    소비자: ReviewsSection · lazyclub/RecordsLightbox · lounge-info/SpacesGallery
 *    · ProcessSection 의 레이지 노트(다장 갤러리 — 가로는 슬라이드 넘김).
 *  · `omni` — 상하좌우 전방향 탈출. 넘길 슬라이드가 없는 **낱장 모달 전용**
 *    (운영자 2026-08-24 "자기소개 규칙은 낱장이므로 전방향 다 튕겨나가게").
 *    소비자: ProcessSection 의 자기소개 규칙(단일 이미지).
 *
 * useZoomGesture 와 같은 설계: 제스처 중에는 ref 직접 변형(리렌더 없음),
 * React 상태 없음. 판정 상수는 실측 튜닝 값 — 근거 주석 참조.
 */

export type DragAxis = "vertical" | "omni"

/** 드래그 시작 판정 — 이 거리(px)를 넘어야 드래그로 본다.
 *  줌 엔진 TAP_SLOP(8)보다 크게 잡아 탭·더블탭 판정과 안 겹치게 한다. */
const START_PX = 14
/** vertical 모드 전용 — 세로 우세 판정 배율(가로 스와이프=슬라이드 넘김과 분리) */
const AXIS_RATIO = 1.2
/** 탈출 문턱: 거리(px) 또는 속도(px/ms). 둘 중 하나만 넘으면 탈출 —
 *  짧고 빠른 '튕김'은 속도로, 느리고 긴 끌기는 거리로 잡힌다.
 *  omni 모드는 방향 벡터의 크기(반경/속력)로 같은 문턱을 쓴다. */
const DISMISS_PX = 96
const DISMISS_VEL = 0.55
/** 속도 표본 창(ms) — 마지막 이 시간 안의 이동으로 놓는 순간의 속도를 잰다 */
const VEL_WINDOW_MS = 90
/** 배경 페이드 — 드래그 이 거리(px, omni 는 반경)에서 배경 알파가 최저 배율에 도달 */
const FADE_RANGE_PX = 360
const FADE_MIN = 0.35

type Sample = { x: number; y: number; t: number }

export function useDragDismiss(onDismiss: () => void) {
  const frameElRef = useRef<HTMLElement | null>(null)
  const veilElRef = useRef<HTMLElement | null>(null)
  const pointerCount = useRef(0)
  const state = useRef<{
    startX: number
    startY: number
    dragging: boolean
    dx: number
    dy: number
    axis: DragAxis
    samples: Sample[]
    veilBase: { r: number; g: number; b: number; a: number } | null
  } | null>(null)
  const outTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => () => { if (outTimer.current) clearTimeout(outTimer.current) }, [])

  function resetStyles(animated: boolean) {
    const frame = frameElRef.current
    const veil = veilElRef.current
    if (frame) {
      frame.style.transition = animated ? "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)" : ""
      frame.style.transform = ""
      if (animated) {
        const el = frame
        setTimeout(() => { el.style.transition = "" }, 240)
      }
    }
    if (veil) {
      veil.style.transition = animated ? "background-color 0.22s ease" : ""
      veil.style.backgroundColor = ""
      if (animated) {
        const el = veil
        setTimeout(() => { el.style.transition = "" }, 240)
      }
    }
  }

  function cancelDrag() {
    if (state.current?.dragging) resetStyles(true)
    state.current = null
  }

  function onDown(e: React.PointerEvent) {
    // 손가락이 요소 밖으로 나가도 move/up 을 계속 받게 캡처 —
    // 줌 모달은 useZoomGesture 가 이미 같은 대상에 캡처하므로 중복 무해,
    // 줌 없는 모달(SpacesGallery)엔 이 호출이 유일한 캡처다.
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    pointerCount.current += 1
    if (pointerCount.current > 1) {
      // 둘째 손가락 = 핀치 의도 — 진행 중이던 드래그는 접는다
      cancelDrag()
      return
    }
    state.current = {
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      dx: 0,
      dy: 0,
      axis: "vertical",
      samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
      veilBase: null,
    }
  }

  /**
   * @param allowed 호출부의 허용 조건 — 줌 모달은 `!zoom.zoomed` 를 넘긴다
   *   (확대 상태의 이동은 팬이므로 여기가 가로채면 안 된다)
   * @param axis 'vertical'(기본) | 'omni' — 낱장 모달만 'omni'
   */
  function onMove(e: React.PointerEvent, allowed: boolean, axis: DragAxis = "vertical") {
    const st = state.current
    if (!st || pointerCount.current > 1) return
    const dx = e.clientX - st.startX
    const dy = e.clientY - st.startY

    if (!st.dragging) {
      if (!allowed) return
      if (axis === "omni") {
        if (Math.hypot(dx, dy) < START_PX) return
      } else {
        if (Math.abs(dy) < START_PX || Math.abs(dy) < Math.abs(dx) * AXIS_RATIO) return
      }
      st.dragging = true
      st.axis = axis
      const veil = veilElRef.current
      if (veil) {
        const m = getComputedStyle(veil).backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
        if (m) st.veilBase = { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] }
      }
    }

    st.dx = dx
    st.dy = dy
    const now = performance.now()
    st.samples.push({ x: e.clientX, y: e.clientY, t: now })
    while (st.samples.length > 2 && now - st.samples[0].t > VEL_WINDOW_MS) st.samples.shift()

    const frame = frameElRef.current
    if (frame) {
      frame.style.transition = "none"
      frame.style.transform = st.axis === "omni" ? `translate(${dx}px, ${dy}px)` : `translateY(${dy}px)`
    }
    const veil = veilElRef.current
    if (veil && st.veilBase) {
      const mag = st.axis === "omni" ? Math.hypot(dx, dy) : Math.abs(dy)
      const fade = 1 - Math.min(mag / FADE_RANGE_PX, 1) * (1 - FADE_MIN)
      const { r, g, b, a } = st.veilBase
      veil.style.transition = "none"
      veil.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a * fade})`
    }
  }

  /** @returns dragged=true 면 이 포인터업은 여기서 소비됐다 — 호출부는 스와이프·탭 판정 생략 */
  function onUp(e: React.PointerEvent): { dragged: boolean } {
    pointerCount.current = Math.max(0, pointerCount.current - 1)
    const st = state.current
    if (!st) return { dragged: false }
    if (!st.dragging) {
      if (pointerCount.current === 0) state.current = null
      return { dragged: false }
    }
    state.current = null

    const now = performance.now()
    const oldest = st.samples[0]
    const dt = oldest && now > oldest.t ? now - oldest.t : 0
    const velX = dt ? (e.clientX - oldest.x) / dt : 0
    const velY = dt ? (e.clientY - oldest.y) / dt : 0
    const dist = st.axis === "omni" ? Math.hypot(st.dx, st.dy) : Math.abs(st.dy)
    const vel = st.axis === "omni" ? Math.hypot(velX, velY) : Math.abs(velY)
    const escape = dist >= DISMISS_PX || vel >= DISMISS_VEL

    if (!escape) {
      resetStyles(true)
      return { dragged: true }
    }

    // 탈출 — 드래그(또는 튕김) 방향으로 마저 빠져나가며 닫힌다
    const frame = frameElRef.current
    const veil = veilElRef.current
    const vw = window.innerWidth || 800
    const vh = window.innerHeight || 800
    if (frame) {
      frame.style.transition = "transform 0.18s ease-in, opacity 0.18s ease-in"
      if (st.axis === "omni") {
        // 이동 방향(느리면 드래그 벡터, 빠르면 속도 벡터)으로 화면 밖까지 밀어낸다
        const useVel = vel > (dist / Math.max(1, dt)) // 속도 판정이 거리 판정보다 우세했으면 속도 방향 사용
        const dirX = useVel ? velX : st.dx
        const dirY = useVel ? velY : st.dy
        const norm = Math.hypot(dirX, dirY) || 1
        const reach = Math.hypot(vw, vh)
        frame.style.transform = `translate(${(dirX / norm) * reach}px, ${(dirY / norm) * reach}px)`
      } else {
        const dir = (st.dy !== 0 ? Math.sign(st.dy) : Math.sign(velY)) || 1
        frame.style.transform = `translateY(${dir * vh}px)`
      }
      frame.style.opacity = "0"
    }
    if (veil && st.veilBase) {
      const { r, g, b } = st.veilBase
      veil.style.transition = "background-color 0.18s ease-in"
      veil.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0)`
    }
    outTimer.current = setTimeout(() => {
      // 닫힌 뒤 재사용될 수 있는 노드 스타일 원복 (모달이 언마운트되면 무해)
      if (frame) { frame.style.transition = ""; frame.style.transform = ""; frame.style.opacity = "" }
      if (veil) { veil.style.transition = ""; veil.style.backgroundColor = "" }
      onDismissRef.current()
    }, 170)
    return { dragged: true }
  }

  function onCancel() {
    pointerCount.current = Math.max(0, pointerCount.current - 1)
    if (pointerCount.current === 0) cancelDrag()
  }

  return {
    /** 드래그를 따라 움직일 요소 (갤러리 프레임 등) */
    frameRef: (el: HTMLElement | null) => { frameElRef.current = el },
    /** 드래그에 비례해 옅어질 배경 (라이트박스 루트) */
    veilRef: (el: HTMLElement | null) => { veilElRef.current = el },
    onDown,
    onMove,
    onUp,
    onCancel,
  }
}
