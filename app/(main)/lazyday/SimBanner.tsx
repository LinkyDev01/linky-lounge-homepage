"use client"

import { SIM_LABEL, type SimMode } from "./sim"

/**
 * 시뮬레이션 중임을 알리는 고정 배너 (운영자 지시 2026-08-06).
 * 실제 신청 화면과 똑같이 진행하되, 이 배너가 떠 있는 동안에는
 * 서버로 아무것도 전송되지 않는다는 사실을 항상 보이게 한다.
 */
export function SimBanner({ mode }: { mode: SimMode | null }) {
  if (!mode) return null
  return (
    <div
      role="status"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        background: "#1a1208",
        color: "#f0ebe5",
        padding: "9px 14px",
        fontSize: 12.5,
        lineHeight: 1.5,
        textAlign: "center",
        wordBreak: "keep-all",
      }}
    >
      <strong style={{ color: "#ffc590" }}>테스트 모드 · {SIM_LABEL[mode]}</strong>
      {" — 실제로 저장·발송되지 않습니다."}{" "}
      <a
        href="/lazyday/admin/simulate"
        style={{ color: "#f0ebe5", textDecoration: "underline", textUnderlineOffset: 3 }}
      >
        테스트 메뉴로
      </a>
    </div>
  )
}
