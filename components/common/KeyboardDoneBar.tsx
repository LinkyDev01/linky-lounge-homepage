"use client"

import { useEffect, useState } from "react"
import styles from "./KeyboardDoneBar.module.css"

// 이만큼 화면(visual viewport)이 줄면 가상 키보드가 열린 것으로 판단 — 주소창 노출/숨김 정도의 변화 오탐 방지
const KEYBOARD_MIN_GAP = 100

function isTextField(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null
  if (!node) return false
  if (node.tagName === "TEXTAREA") return true
  if (node.tagName === "INPUT") {
    const type = (node as HTMLInputElement).type
    return !["checkbox", "radio", "button", "submit", "reset", "file", "range", "color", "image"].includes(type)
  }
  return false
}

/**
 * 모바일(특히 iOS Safari)에서 textarea·input 입력 중 키보드를 닫으려면 입력창 밖을 탭해야 한다.
 * 가상 키보드가 열려 있고 텍스트 입력창이 포커스된 동안에만, 키보드 바로 위에 '완료' 버튼을 띄워
 * 한 번에 키보드를 닫게 해준다. 데스크톱·미지원 브라우저에서는 렌더되지 않아 기존 동작 그대로다.
 */
export function KeyboardDoneBar() {
  const [gap, setGap] = useState(0)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const onViewport = () => setGap(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    const onFocusIn = (e: FocusEvent) => { if (isTextField(e.target)) setFocused(true) }
    // 다음 입력칸으로 이동 시 깜빡임 방지: 한 틱 뒤 실제 포커스 대상 확인
    const onFocusOut = () => setTimeout(() => setFocused(isTextField(document.activeElement)), 0)

    vv.addEventListener("resize", onViewport)
    vv.addEventListener("scroll", onViewport)
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    onViewport()
    setFocused(isTextField(document.activeElement))

    return () => {
      vv.removeEventListener("resize", onViewport)
      vv.removeEventListener("scroll", onViewport)
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
    }
  }, [])

  if (!focused || gap < KEYBOARD_MIN_GAP) return null

  return (
    <button
      type="button"
      aria-label="키보드 닫기"
      className={styles.doneBtn}
      style={{ bottom: gap + 12 }}
      onMouseDown={(e) => e.preventDefault()} // 포커스 유지 → onClick에서 명시적으로 닫기
      onClick={() => (document.activeElement as HTMLElement | null)?.blur()}
    >
      <span className={styles.icon} aria-hidden>▾</span>
      완료
    </button>
  )
}
