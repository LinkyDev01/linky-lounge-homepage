"use client"

import { useEffect, useState } from "react"
import { KAKAO_CHANNEL_URL, followKakaoChannel, loadKakaoSdk } from "@/lib/kakao-channel"

/**
 * 카카오톡 채널 간편 추가 — **텍스트 링크 한 줄**(운영자 2026-09-03 "무채색으로 하면 되지").
 * 카카오가 주는 노란 버튼(createAddChannelButton)은 쓰지 않는다 — 레이지클럽 §9
 * (유채색 UI 0 · 라운드 0 · 보더 버튼 0)와 정면충돌한다. 모양은 소비자가 className 으로 정한다.
 *
 * 상태 → 문구
 *   idle     "카카오톡 채널 추가하기"
 *   busy     "연결 중…"            (팝업이 떠 있는 동안)
 *   followed "카카오톡 채널이 추가되었어요"  (버튼이 사라지고 문장만 남는다)
 *   failed   "추가되지 않았어요 — 채널 홈에서 추가하기"  (SDK 는 있었는데 거절·취소 → 링크 제공)
 *   fallback  버튼 그대로 (새 창이 열렸으니 문구를 바꿀 이유가 없다)
 */
export function KakaoFollowButton({ className, label = "카카오톡 채널 추가하기" }: { className?: string; label?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "followed" | "failed">("idle")

  // 클릭 전에 SDK 를 받아 둔다 — 팝업은 제스처 안에서 열려야 한다 (lib 주석)
  useEffect(() => {
    void loadKakaoSdk()
  }, [])

  if (state === "followed") return <span className={className}>카카오톡 채널이 추가되었어요</span>
  if (state === "failed")
    return (
      <span className={className}>
        추가되지 않았어요 —{" "}
        <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
          채널 홈에서 추가하기
        </a>
      </span>
    )

  return (
    <button
      type="button"
      className={className}
      disabled={state === "busy"}
      onClick={() => {
        setState("busy")
        void followKakaoChannel().then((r) => setState(r === "followed" ? "followed" : r === "failed" ? "failed" : "idle"))
      }}
    >
      {state === "busy" ? "연결 중…" : label}
    </button>
  )
}
