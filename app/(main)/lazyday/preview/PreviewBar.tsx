"use client"

import { usePathname } from "next/navigation"
import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "./preview.module.css"

const links = [
  { href: "/preview", label: "① 랜딩" },
  { href: "/preview/apply", label: "② 신청" },
  { href: "/preview/apply/interview/written", label: "③ 서면 인터뷰" },
  { href: "/preview/apply/interview/schedule", label: "④ 전화 예약" },
]

/** 프리뷰 페이지 간 임시 이동 바 — 실제 반영 시 제거 */
export function PreviewBar() {
  const pathname = usePathname() || ""
  return (
    <>
      <div className={styles.previewBar}>
        <span className={styles.previewBadge}>PREVIEW</span>
        {links.map((l) => {
          const active = pathname.endsWith(l.href) || pathname.endsWith(`${l.href}/`)
          return (
            <LazydayLink
              key={l.href}
              href={l.href}
              className={`${styles.previewLink} ${active ? styles.previewLinkActive : ""}`}
            >
              {l.label}
            </LazydayLink>
          )
        })}
      </div>
      <div className={styles.previewBarSpacer} />
    </>
  )
}
