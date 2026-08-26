"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "./preview.module.css"

const links = [
  { href: "/preview", label: "① 랜딩" },
  { href: "/preview/apply", label: "② 신청" },
  { href: "/preview/apply/interview/written", label: "③ 서면 인터뷰" },
  { href: "/preview/apply/interview/schedule", label: "④ 전화 예약" },
]

/**
 * 프리뷰 페이지 간 임시 이동 도구 — 관리자(운영자) 확인용.
 *
 * ⚠ 2026-08-24: 예전엔 상단 고정 풀바(+ 스페이서로 본문을 밀어냄)였으나,
 * 실사이트 셸(LandingShell)도 position:fixed 헤더라 같은 top:0 에서 겹쳐
 * 헤더 상단(로고·내비 탭)이 가려지는 문제가 있었다(운영자 "상단이 짤리면서
 * 실제 원본과 차이가 커"). 우측 가장자리에 작은 버튼만 두고 눌러야 펼쳐지는
 * 방식으로 전환 — 기본 상태에서 레이아웃 공간을 전혀 차지하지 않아 상단이
 * 실사이트와 완전히 동일해진다(스페이서 제거로 스크롤 앵커 보정도 불필요해짐 —
 * preview.module.css 의 .desktopFrame scroll-margin-top 오버라이드 참조).
 */
export function PreviewBar() {
  const pathname = usePathname() || ""
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        className={styles.previewToggle}
        onClick={() => setOpen(true)}
        aria-label="프리뷰 이동 메뉴 열기"
      >
        PREVIEW
      </button>
    )
  }

  return (
    <div className={styles.previewPanel} role="dialog" aria-label="프리뷰 페이지 이동">
      <div className={styles.previewPanelHead}>
        <span className={styles.previewBadge}>PREVIEW</span>
        <button
          type="button"
          className={styles.previewPanelClose}
          onClick={() => setOpen(false)}
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      {links.map((l) => {
        const active = pathname.endsWith(l.href) || pathname.endsWith(`${l.href}/`)
        return (
          <LazydayLink
            key={l.href}
            href={l.href}
            className={`${styles.previewLink} ${active ? styles.previewLinkActive : ""}`}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </LazydayLink>
        )
      })}
    </div>
  )
}
