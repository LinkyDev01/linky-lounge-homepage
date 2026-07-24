"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { trackStandard } from "@/lib/meta-pixel"
import { trackEvent } from "@/lib/gtag"
import { FadeUp } from "@/components/animation/FadeUp"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import styles from "../apply/page.module.css"
import cal from "./oneday.module.css"

/**
 * 1회성 모임 신청 (운영자 지시 2026-07-24) — /apply 복제 기반.
 *  · 상단 프로세스(JourneyStepper)·섹션 인디케이터 없음
 *  · 일정 = 랜딩 14a 달력 문법의 8월 시트 1장 (8/2·8/9 손그림 타원 체크)
 *  · 인터뷰 방식·추천인 문항 제거
 *  · 접수 성공 시 토스페이먼츠 결제 페이지로 즉시 이동
 *  · 데이터는 기존 스프레드시트의 별도 탭('1회성 모임')으로 — GAS handleOnedayApply
 *    (⚠ 배포 순서: GAS 새 버전 반영 확인 후 프론트 병합 — CLAUDE.md §6)
 * 폼 스타일은 ../apply/page.module.css 재사용(수정 금지), 달력은 oneday.module.css 분리 사본.
 */

const SUBMIT_URL = "/api/lazyday/apply"
const TOSS_URL = "https://buy.tosspayments.com/products/OBBn5YubQ0?shopId=prreBmgHJwPY"

// 1회성 모임 일정 — 8월, 8/2·8/9 (운영자 지시 2026-07-24)
const ONEDAY = {
  year: 2026,
  month: 8,
  monthName: "8월",
  monthEng: "AUG. 2026",
  days: [2, 9],
  rangeLabel: "8/2 · 8/9",
}
const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"]
// 손그림 타원 회전 — 날짜별 제각각 (랜딩 문법)
const MARK_ROT = [-6, 4]

type Errors = Partial<Record<
  "name" | "gender" | "age" | "phone" | "marketingConsent" | "_form",
  string
>>

function FormField({
  label,
  name,
  required,
  optional,
  error,
  children,
}: {
  label: string
  name: string
  required?: boolean
  optional?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={name} className={styles.formLabel}>
        {label}
        {required && <span className={styles.required}>*</span>}
        {optional && <span className={styles.optional}>(선택)</span>}
      </label>
      {children}
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}

function formatPhone(value: string) {
  const nums = value.replace(/[^0-9]/g, "")
  if (nums.length <= 3) return nums
  if (nums.length <= 7) return nums.slice(0, 3) + "-" + nums.slice(3)
  return nums.slice(0, 3) + "-" + nums.slice(3, 7) + "-" + nums.slice(7, 11)
}

/** 8월 달력 시트 — 랜딩 14a 문법, 모임일은 손그림 타원 체크 */
function OnedayCalendar() {
  const firstDow = new Date(ONEDAY.year, ONEDAY.month - 1, 1).getDay()
  const daysInMonth = new Date(ONEDAY.year, ONEDAY.month, 0).getDate()
  const totalCells = (Math.floor((firstDow + daysInMonth - 1) / 7) + 1) * 7

  return (
    <div>
      <div className={cal.calHeader}>
        <p className={cal.calHeaderTitle}>모임 일정</p>
        <span className={cal.calHeaderRange}>{ONEDAY.rangeLabel}</span>
      </div>
      <FadeUp y={10} duration={0.6}>
        <div className={cal.calSheet}>
          <span className={cal.calTape} aria-hidden />
          <div className={cal.calSheetHead}>
            <span className={cal.calMonthName}>{ONEDAY.monthName}</span>
            <span className={cal.calMonthEng}>{ONEDAY.monthEng}</span>
          </div>
          <div className={cal.calDowRow} aria-hidden>
            {DOW_LABELS.map((d) => (
              <span key={d} className={cal.calDow}>{d}</span>
            ))}
          </div>
          <div className={cal.calGrid}>
            {Array.from({ length: totalCells }, (_, ci) => {
              const day = ci - firstDow + 1
              const inMonth = day >= 1 && day <= daysInMonth
              const meetIdx = inMonth ? ONEDAY.days.indexOf(day) : -1
              return (
                <div key={ci} className={cal.calCell}>
                  {inMonth && (
                    <span className={meetIdx >= 0 ? cal.calDayNumMeet : cal.calDayNum}>{day}</span>
                  )}
                  {meetIdx >= 0 && (
                    <svg
                      viewBox="0 0 40 30"
                      className={cal.calMarker}
                      style={{ transform: `translate(-50%, -50%) rotate(${MARK_ROT[meetIdx]}deg)` }}
                      aria-hidden
                    >
                      <ellipse
                        cx="20"
                        cy="15"
                        rx="15"
                        ry="10"
                        fill="none"
                        stroke="#d2691e"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeDasharray="72 9"
                      />
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </FadeUp>
    </div>
  )
}

export default function OnedayApplyPage() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [marketingConsent, setMarketingConsent] = useState(false)

  function clearError(name: keyof Errors) {
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const newErrors: Errors = {}

    const name = (data.get("name") as string)?.trim() || ""
    const gender = (data.get("gender") as string) || ""
    const age = (data.get("age") as string)?.trim() || ""
    const phone = (data.get("phone") as string)?.trim() || ""
    const greeting = (data.get("greeting") as string)?.trim() || ""
    const instagram = (data.get("instagram") as string)?.trim() || ""

    if (!name) newErrors.name = "이름을 입력해주세요."
    if (!gender) newErrors.gender = "성별을 선택해주세요."
    if (!age) newErrors.age = "나이를 입력해주세요."
    if (!phone) newErrors.phone = "전화번호를 입력해주세요."
    if (!marketingConsent) newErrors.marketingConsent = "마케팅 활용 및 개인정보 수집 동의가 필요합니다."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstKey = Object.keys(newErrors)[0]
      const target =
        firstKey === "marketingConsent"
          ? document.getElementById("marketingConsent")
          : document.querySelector(`[name="${firstKey}"]`)
      target?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setErrors({})
    setLoading(true)
    const payload = {
      type: "oneday",
      name,
      gender,
      age,
      phone,
      greeting,
      instagram,
      meetingDates: ONEDAY.rangeLabel,
      marketingConsent: marketingConsent ? "동의" : "미동의",
      consentAt: new Date().toISOString(), // 동의 시각 기록 (법적 증빙)
    }

    // 서버 접수가 확인된 경우에만 결제로 이동한다 (신청 유실 방지)
    try {
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json().catch(() => null)
      if (!res.ok || !result?.success) throw new Error("submit failed")
    } catch {
      setLoading(false)
      setErrors({
        _form: "일시적인 오류로 신청이 접수되지 않았어요. 잠시 후 '신청 완료하기'를 다시 눌러주세요.",
      })
      return
    }

    trackStandard("Lead", { content_name: "1회성모임_신청완료" })
    trackEvent("oneday_apply_complete", { program: "book_club" })

    // 접수 완료 → 토스페이먼츠 결제 페이지로 즉시 이동 (오버레이 유지 상태로 전환)
    window.location.href = TOSS_URL
  }

  return (
    <main className={styles.applyPage} data-track-section="bookclub_oneday_apply">
      {loading && <SubmitOverlay label="접수 후 결제 페이지로 이동 중..." />}
      <div className={styles.container}>
        <FadeUp y={12} duration={0.9}>
          <div className={styles.header}>
            <img
              src="/linky-lounge/book-club/ldbc-logo-text.png"
              alt="레이지데이 북클럽"
              className={styles.headerImage}
            />
            <h1 className={styles.headerTitle}>
              레이지데이 북클럽
              <br />
              <span className={styles.headerSeason}>1회성 모임</span> 신청하기
            </h1>
          </div>
        </FadeUp>

        <section className={styles.scheduleNotice}>
          <OnedayCalendar />
        </section>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormField label="이름" name="name" required error={errors.name}>
            <input
              id="name"
              type="text"
              name="name"
              className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
              placeholder="성함을 기입해주세요."
              onChange={() => clearError("name")}
            />
          </FormField>

          <div className={styles.formGroup}>
            <span className={styles.formLabel}>
              성별
              <span className={styles.required}>*</span>
            </span>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  value="남성"
                  onChange={() => clearError("gender")}
                />
                <span className={styles.radioText}>남성</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  value="여성"
                  onChange={() => clearError("gender")}
                />
                <span className={styles.radioText}>여성</span>
              </label>
            </div>
            {errors.gender && <p className={styles.errorText}>{errors.gender}</p>}
          </div>

          <FormField label="나이" name="age" required error={errors.age}>
            <input
              id="age"
              type="text"
              name="age"
              inputMode="numeric"
              autoComplete="off"
              maxLength={3}
              className={`${styles.input} ${errors.age ? styles.inputError : ""}`}
              placeholder="만 나이를 입력해주세요."
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "")
                clearError("age")
              }}
            />
          </FormField>

          <FormField label="전화번호" name="phone" required error={errors.phone}>
            <input
              id="phone"
              type="tel"
              name="phone"
              inputMode="numeric"
              className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
              placeholder="휴대전화 번호를 입력해주세요."
              onChange={(e) => {
                e.target.value = formatPhone(e.target.value)
                clearError("phone")
              }}
            />
          </FormField>

          <FormField label="한 줄 인사" name="greeting" optional>
            <input
              id="greeting"
              type="text"
              name="greeting"
              className={styles.input}
              placeholder="짧은 인삿말도, 간단한 소개도 모두 좋습니다."
            />
          </FormField>

          <FormField label="인스타그램 아이디" name="instagram" optional>
            <input
              id="instagram"
              type="text"
              name="instagram"
              className={styles.input}
              placeholder="@your_instagram"
            />
          </FormField>

          <div className={styles.consentBox}>
            <label htmlFor="marketingConsent" className={styles.consentLabel}>
              <input
                id="marketingConsent"
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => {
                  setMarketingConsent(e.target.checked)
                  if (e.target.checked) clearError("marketingConsent")
                }}
                className={styles.checkbox}
              />
              <span className={styles.consentText}>
                마케팅 활용 및 개인정보 수집에 동의합니다.{" "}
                <span className={styles.requiredTag}>(필수)</span>
              </span>
            </label>
            <p className={styles.consentNote}>
              수집된 개인정보는 레이지데이 북클럽 운영 및 마케팅 목적으로만 활용되며, 관계 법령에 따라 안전하게 보호됩니다.
            </p>
            {errors.marketingConsent && (
              <p className={styles.errorText}>{errors.marketingConsent}</p>
            )}
          </div>

          {errors._form && (
            <p className={styles.formError}>{errors._form}</p>
          )}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "접수 중입니다..." : "신청 완료하기"}
          </button>
        </form>
      </div>
    </main>
  )
}
