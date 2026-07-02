"use client"

import { useState } from "react"
import Image from "next/image"
import styles from "../BrandCloseSection.module.css"
import pstyles from "./preview.module.css"
import { PREVIEW, daysUntilDeadline } from "./preview-config"
import { BlurReveal } from "@/components/animation/BlurReveal"

/**
 * 개선안 클로징: 로고로 끝나는 감성적 마무리는 유지하되,
 * 그 위에 마감 정보 + 다음 기수 알림(대기 수요 축적) 블록을 추가.
 * 스티키 CTA가 이미 있으므로 여기서 버튼은 반복하지 않고,
 * '못 들어온 사람'을 다음 기수로 전환하는 역할만 담당.
 */
export function ClosingSectionV2() {
  const [phone, setPhone] = useState("")
  const [done, setDone] = useState(false)
  const d = daysUntilDeadline()

  return (
    <>
      <div className={pstyles.closingCta}>
        <p className={pstyles.closingCtaTitle}>
          {d >= 0
            ? `${PREVIEW.season} 모집은 ${d === 0 ? "오늘" : `${d}일 뒤`} 마감돼요`
            : `${PREVIEW.season} 모집이 마감되었어요`}
        </p>
        <p className={pstyles.closingCtaSub}>
          {PREVIEW.periodLabel} · 정규 4회 + 자유모임 1회 · 사당 링키라운지
        </p>

        <div className={pstyles.nextSeasonBox}>
          <p className={pstyles.nextSeasonText}>
            이번 기수 일정이 맞지 않는다면, {PREVIEW.nextSeason} 소식을 가장 먼저 알려드릴게요.
          </p>
          {done ? (
            <p className={pstyles.nextSeasonDone}>등록되었어요. {PREVIEW.nextSeason} 오픈 시 가장 먼저 연락드릴게요. (프리뷰 — 실제 저장 안 됨)</p>
          ) : (
            <div className={pstyles.nextSeasonRow}>
              <input
                type="tel"
                inputMode="numeric"
                className={pstyles.nextSeasonInput}
                placeholder="휴대전화 번호"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-label="다음 기수 알림 받을 휴대전화 번호"
              />
              <button
                type="button"
                className={pstyles.nextSeasonBtn}
                onClick={() => phone.trim() && setDone(true)}
              >
                {PREVIEW.nextSeason} 알림 받기
              </button>
            </div>
          )}
        </div>
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
