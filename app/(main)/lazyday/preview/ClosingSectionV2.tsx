"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import styles from "../BrandCloseSection.module.css"
import pstyles from "./preview.module.css"
import { PREVIEW, daysUntilDeadline } from "./preview-config"
import { BlurReveal } from "@/components/animation/BlurReveal"

/**
 * 개선안 클로징: 로고로 끝나는 감성적 마무리는 유지하되,
 * 그 위에 마감 정보 한 줄만 담백하게 추가.
 * ('4기 알림 받기' 폼은 보류 — 운영자 결정 2026-07-03)
 */
export function ClosingSectionV2() {
  const [d, setD] = useState<number | null>(null)
  useEffect(() => { setD(daysUntilDeadline()) }, [])

  return (
    <>
      <div className={pstyles.closingCta}>
        <p className={pstyles.closingCtaTitle}>
          {d === null
            ? `${PREVIEW.season} 모집 중입니다.`
            : d < 0
            ? `${PREVIEW.season} 모집이 마감되었습니다.`
            : d === 0
            ? `${PREVIEW.season} 모집은 오늘 마감됩니다.`
            : `${PREVIEW.season} 모집은 ${d}일 뒤 마감됩니다.`}
        </p>
        <p className={pstyles.closingCtaSub}>
          ({PREVIEW.periodLabel}) 정규 독서모임 4회 + 자유 독서모임 1회
          <br />
          서울 사당역 부근 ·{" "}
          <a
            href="https://naver.me/FLebi2a9"
            target="_blank"
            rel="noopener noreferrer"
            className={pstyles.closingCtaLink}
          >
            링키라운지
          </a>
        </p>
      </div>

      <section className={styles.section}>
        <BlurReveal duration={1.28} blur={14} fromScale={1.04} finalOpacity={0.8}>
          <div className={styles.logoWrap}>
            <Image
              src="/linky-lounge/book-club/ldbc-logo-text.png"
              alt="레이지데이 북클럽"
              width={417}
              height={240}
              style={{ objectFit: "contain" }}
            />
          </div>
        </BlurReveal>
      </section>
    </>
  )
}
