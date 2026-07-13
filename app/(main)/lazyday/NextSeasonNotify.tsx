"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { SEASON } from "./season-config"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import styles from "./NextSeasonNotify.module.css"

/**
 * 다음 기수(4기) 오픈 알림 신청 — 조기마감 모드 전용, 브랜드 클로즈 직전 (운영자 확정 2026-07-13)
 *  · 종이 낱장 카드(HeroSummary summaryCard 파생, 기울기 없음) + 이름/전화 + 동의 1개
 *  · 제출: 기존 apply 경로(/api/lazyday/apply → GAS) 재사용, type:"notify" → '4기 알림' 시트
 *  · 접수 확인 후에만 완료 표시(유실 방지), 실패 시 failBanner. 완료 상태에서만 카카오 채널 노출
 *  · 스티키 CTA의 lazyday:notify-cta 이벤트 수신 — 폼이 유효하면 그대로 제출, 아니면 #notify 스크롤
 *  · 문구는 전부 SEASON.name/next/nextStartLabel 파생 — 하드코딩 금지
 */

const SUBMIT_URL = "/api/lazyday/apply"

function formatPhone(value: string) {
  const nums = value.replace(/[^0-9]/g, "")
  if (nums.length <= 3) return nums
  if (nums.length <= 7) return nums.slice(0, 3) + "-" + nums.slice(3)
  return nums.slice(0, 3) + "-" + nums.slice(3, 7) + "-" + nums.slice(7, 11)
}

export function NextSeasonNotify() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const isValid = name.trim().length > 0 && phone.replace(/[^0-9]/g, "").length >= 10 && consent

  const scrollToCard = useCallback(() => {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])

  const submit = useCallback(async () => {
    if (loading || submitted) return
    if (!isValid) {
      setFieldError(
        !name.trim()
          ? "이름을 입력해주세요."
          : phone.replace(/[^0-9]/g, "").length < 10
          ? "연락 가능한 전화번호를 입력해주세요."
          : "알림 수신 동의가 필요해요.",
      )
      return
    }
    setFieldError(null)
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "notify",
          name: name.trim(),
          phone,
          marketingConsent: "동의",
          consentAt: new Date().toISOString(), // 동의 시각 기록 (법적 증빙)
        }),
      })
      const result = await res.json().catch(() => null)
      if (!res.ok || !result?.success) throw new Error("submit failed")
      // 접수 확인 후에만 완료 표시 (유실 방지) → 완료 카드로 스크롤
      setSubmitted(true)
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80)
    } catch {
      setError("일시적인 오류로 접수되지 않았어요. 잠시 후 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }, [loading, submitted, isValid, name, phone])

  // 스티키 CTA → 유효하면 동일 제출 경로 호출, 미완성/미동의면 스크롤만(오류 미노출)
  useEffect(() => {
    const onCta = () => {
      if (submitted) {
        scrollToCard()
        return
      }
      if (isValid) submit()
      else scrollToCard()
    }
    window.addEventListener("lazyday:notify-cta", onCta)
    return () => window.removeEventListener("lazyday:notify-cta", onCta)
  }, [submitted, isValid, submit, scrollToCard])

  return (
    <section className={styles.section}>
      {/* 제출 중 전면 로더 — apply 폼과 동일 문법 (SubmitOverlay, 운영자 지시 2026-07-13) */}
      {loading && <SubmitOverlay label="접수 중..." />}
      <div id="notify" ref={cardRef} className={styles.card}>
        <span className={styles.tape} aria-hidden />
        {submitted ? (
          <>
            <p className={styles.title}>신청이 완료되었습니다.</p>
            <p className={styles.doneBody}>
              {SEASON.next} 모집이 열리면 입력하신 번호로 가장 먼저 알려드릴게요.
            </p>
            <p className={styles.doneFootnote}>
              문자 안내는 {SEASON.next} 모집 시작 시 1회 발송됩니다
            </p>
            <a
              href={SEASON.notifyKakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.kakaoLink}
            >
              카카오 채널 추가하고 소식 받기
            </a>
          </>
        ) : (
          <>
            <p className={styles.title}>{SEASON.next} 오픈 알림</p>
            <p className={styles.lead}>
              {SEASON.name}는 조기 마감되었습니다.
              <br />
              {SEASON.next} 소식을 가장 먼저 받아보세요.
            </p>
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <input
                type="text"
                name="notifyName"
                className={styles.input}
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <input
                type="tel"
                name="notifyPhone"
                className={styles.input}
                placeholder="전화번호"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                inputMode="numeric"
                autoComplete="tel"
              />
              <label className={styles.consentRow}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                다음 기수·모임 소식 알림 수신에 동의합니다.
              </label>
              <p className={styles.footnote}>
                수집 항목: 이름·연락처 / 이용 목적: {SEASON.next} 모집 안내 / 보유 기간: 안내 발송 후 파기
              </p>
              {fieldError && <p className={styles.errorText}>{fieldError}</p>}
              {error && (
                <div className={styles.failBanner} role="alert">
                  <p className={styles.failText}>{error}</p>
                </div>
              )}
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "접수 중…" : `${SEASON.next} 오픈 알림 받기`}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  )
}
