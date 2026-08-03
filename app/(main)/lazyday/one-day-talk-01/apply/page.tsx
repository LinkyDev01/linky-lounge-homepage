"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { trackStandard } from "@/lib/meta-pixel"
import { trackEvent } from "@/lib/gtag"
import { Nanum_Pen_Script } from "next/font/google"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import styles from "../../apply/page.module.css"
import cal from "./oneday.module.css"

/**
 * 원데이 토크 신청 (일회성 모임 — 표기는 한글 "원데이 토크", 운영자 확정 2026-07-24) — /apply 복제 기반.
 * URL: /one-day-talk-01/apply (북클럽 도메인 기준).
 *  · 상단 프로세스(JourneyStepper)·섹션 인디케이터 없음
 *  · 일정 = 랜딩 14a 달력 문법의 8월 시트 1장 (8/2·8/9 손그림 타원 체크)
 *  · 인터뷰 방식·추천인 문항 제거
 *  · 접수 성공 시 완료 화면 표시 (리다이렉트 아님 — 운영자 지시 2026-07-29)
 *    → 완료 화면에서 결제 방식 선택: 계좌이체(계좌 안내+복사) / 토스페이(결제 링크 이동)
 *  · 데이터는 기존 스프레드시트의 별도 탭('1회성 모임')으로 — GAS handleOnedayApply
 *    (⚠ 배포 순서: GAS 새 버전 반영 확인 후 프론트 병합 — CLAUDE.md §6)
 * 폼 스타일은 ../apply/page.module.css 재사용(수정 금지), 달력은 oneday.module.css 분리 사본.
 */

const SUBMIT_URL = "/api/lazyday/apply"

// 손글씨 회차 첨자 — 랜딩 달력과 동일 문법 (Nanum Pen Script)
const penScript = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
})
const TOSS_URL = "https://buy.tosspayments.com/products/OBBn5YubQ0?shopId=prreBmgHJwPY"
// 계좌이체 안내 (운영자 지시 2026-07-29 — 우리은행, 예금주 주식회사 링키)
const BANK_NAME = "우리은행"
const BANK_ACCOUNT = "1005-104-815136"
const BANK_HOLDER = "주식회사 링키"

// 1회성 모임 일정 — 8월, 8/2·8/9 (운영자 지시 2026-07-24)
const ONEDAY = {
  year: 2026,
  month: 8,
  monthName: "8월",
  monthEng: "AUG. 2026",
  // 회차별 책·시간 (운영자 지시 2026-07-24). day = 8월 날짜
  sessions: [
    { day: 2, label: "1회차", book: "브람스를 좋아하세요...", author: "프랑수아즈 사강", time: "19:00–22:00" },
    { day: 9, label: "2회차", book: "시지프 신화", author: "알베르 카뮈", time: "19:00–22:00" },
  ],
  rangeLabel: "8/2 · 8/9",
}
const ONEDAY_MEET_DAYS = ONEDAY.sessions.map((s) => s.day)
const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"]
// 손그림 타원 회전 — 날짜별 제각각 (랜딩 문법)
const MARK_ROT = [-6, 4]

// "2026-08-02 (일)" 요일 계산 → 캘린더 밑 일정표 라벨
function sessionDateLabel(day: number) {
  const wd = ["일", "월", "화", "수", "목", "금", "토"][new Date(ONEDAY.year, ONEDAY.month - 1, day).getDay()]
  return `${ONEDAY.month}/${day} (${wd})`
}

type Errors = Partial<Record<
  "sessions" | "name" | "gender" | "age" | "phone" | "marketingConsent" | "_form",
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
        <p className={cal.calHeaderTitle}>원데이 토크 일정</p>
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
              const meetIdx = inMonth ? ONEDAY_MEET_DAYS.indexOf(day) : -1
              return (
                <div key={ci} className={cal.calCell}>
                  {inMonth && (
                    <span className={meetIdx >= 0 ? cal.calDayNumMeet : cal.calDayNum}>{day}</span>
                  )}
                  {meetIdx >= 0 && (
                    <>
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
                      {/* 필기체 회차 첨자 — 랜딩 1st/2nd 문법의 한글판 (운영자 지시 2026-07-24) */}
                      <span
                        className={`${penScript.className} ${cal.calRoundTag}`}
                        style={{ transform: `rotate(${meetIdx === 0 ? -5 : 4}deg)` }}
                      >
                        {ONEDAY.sessions[meetIdx].label}
                      </span>
                    </>
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
  // 신청 회차 멀티체크 — 8/2 브람스 / 8/9 시지프, 각각 복수 선택 가능 (운영자 지시 2026-07-24)
  const [pickedDays, setPickedDays] = useState<number[]>([])
  // 접수 완료 화면 + 결제 방식 선택 (운영자 지시 2026-07-29)
  const [submitted, setSubmitted] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (submitted) window.scrollTo(0, 0)
  }, [submitted])

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 API 미지원 환경 폴백 — 선택 가능한 프롬프트로 제공
      window.prompt("계좌번호를 길게 눌러 복사해주세요.", BANK_ACCOUNT)
    }
  }

  function toggleSession(day: number) {
    setPickedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
    clearError("sessions")
  }

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

    if (pickedDays.length === 0) newErrors.sessions = "신청할 모임을 한 개 이상 선택해주세요."
    if (!name) newErrors.name = "이름을 입력해주세요."
    if (!gender) newErrors.gender = "성별을 선택해주세요."
    if (!age) newErrors.age = "나이를 입력해주세요."
    if (!phone) newErrors.phone = "전화번호를 입력해주세요."
    if (!marketingConsent) newErrors.marketingConsent = "마케팅 활용 및 개인정보 수집 동의가 필요합니다."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstKey = Object.keys(newErrors)[0]
      const target =
        firstKey === "sessions"
          ? document.getElementById("sessions-group")
          : firstKey === "marketingConsent"
          ? document.getElementById("marketingConsent")
          : document.querySelector(`[name="${firstKey}"]`)
      target?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setErrors({})
    setLoading(true)
    // 선택 회차 → 시트 '모임 일자' 컬럼 기록 문자열 (예: "8/2 브람스를 좋아하세요..., 8/9 시지프 신화")
    const meetingDates = ONEDAY.sessions
      .filter((s) => pickedDays.includes(s.day))
      .map((s) => `${ONEDAY.month}/${s.day} ${s.book}`)
      .join(", ")
    const payload = {
      type: "oneday",
      name,
      gender,
      age,
      phone,
      greeting,
      instagram,
      meetingDates,
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

    trackStandard("Lead", { content_name: "OneDayTalk_신청완료" })
    trackEvent("oneday_apply_complete", { program: "book_club" })

    // 접수 완료 → 완료 화면에서 결제 방식 선택 (리다이렉트 아님 — 운영자 지시 2026-07-29)
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className={styles.successPage}>
        {/* done* 오버라이드 — 랜딩 타이포 위계로 밸런스 축소 (운영자 지시 2026-07-29) */}
        <div className={`${styles.successInner} ${cal.doneInner}`}>
          <BlurReveal duration={1.0} blur={10} fromScale={1.03}>
            <img
              src="/linky-lounge/book-club/lazyday_logo.png"
              alt="레이지데이"
              className={`${styles.successMark} ${cal.doneMark}`}
            />
          </BlurReveal>
          <FadeUp delay={0.15}>
            <h1 className={`${styles.successTitle} ${cal.doneTitle}`}>신청해주셔서 감사합니다.</h1>
          </FadeUp>
          <FadeUp delay={0.3}>
            <p className={`${styles.successBody} ${cal.doneBody}`}>
              신청이 완료되었습니다.
              <br />
              아래에서 <span className={styles.successAccent}>결제 방식</span>을 선택해주세요.
            </p>
          </FadeUp>
          <FadeUp delay={0.45}>
            {/* 결제 방식 — 같은 주황 버튼 2개를 1행 가로 배치 (운영자 지시 2026-07-29) */}
            <div className={cal.payRow}>
              <button
                type="button"
                className={`${cal.payBtn} ${bankOpen ? cal.payBtnOn : ""}`}
                onClick={() => setBankOpen((v) => !v)}
                aria-expanded={bankOpen}
              >
                계좌이체
              </button>
              <a href={TOSS_URL} className={cal.payBtn}>
                토스페이 결제
              </a>
            </div>
            {bankOpen && (
              <div className={cal.bankPanel}>
                <p className={cal.bankAccountRow}>
                  <span className={cal.bankAccount}>{BANK_NAME} {BANK_ACCOUNT}</span>
                  <button
                    type="button"
                    className={cal.bankCopyBtn}
                    onClick={copyAccount}
                    aria-label="계좌번호 복사"
                  >
                    {copied ? (
                      "복사됨"
                    ) : (
                      <svg viewBox="0 0 16 16" className={cal.bankCopyIcon} aria-hidden>
                        <rect x="5.5" y="5.5" width="8" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1" fill="none" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    )}
                  </button>
                </p>
                <p className={cal.bankHolder}>예금주 {BANK_HOLDER}</p>
              </div>
            )}
          </FadeUp>
          <FadeUp delay={0.6}>
            <p className={`${styles.successCloser} ${cal.doneCloser}`}>레이지데이 북클럽에서 곧 만나요.</p>
          </FadeUp>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.applyPage} data-track-section="bookclub_oneday_apply">
      {loading && <SubmitOverlay label="신청 접수 중..." />}
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
              <span className={styles.headerSeason}>원데이 토크</span> 신청하기
            </h1>
          </div>
        </FadeUp>

        <section className={styles.scheduleNotice}>
          <OnedayCalendar />
          {/* 행 형식 일정 — 표 폐기, 라벨(회차·장소)은 주황 서식 통일 (운영자 지시 2026-07-24) */}
          <div className={cal.infoRows}>
            {ONEDAY.sessions.map((s) => (
              <div key={s.day} className={cal.infoRow}>
                <span className={cal.infoLabel}>{s.label}</span>
                <span className={cal.infoValue}>{sessionDateLabel(s.day)} {s.time}</span>
              </div>
            ))}
            <div className={cal.infoRow}>
              <span className={cal.infoLabel}>장소</span>
              <span className={cal.infoValue}>링키라운지(사당역 도보 3분)</span>
            </div>
            <p className={cal.infoNote}>*장소는 변경될 수 있습니다.</p>
            <div className={cal.infoRow}>
              <span className={cal.infoLabel}>가격</span>
              <span className={cal.infoValue}>35,000원</span>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* 신청 회차 선택 — 캘린더 밑, 일시(날짜·책·시간) 명시 + 복수 선택 (운영자 지시 2026-07-24) */}
          <div id="sessions-group" className={styles.formGroup}>
            <span className={styles.formLabel}>
              신청할 모임
              <span className={styles.required}>*</span>
            </span>
            <div className={cal.sessionList}>
              {ONEDAY.sessions.map((s) => {
                const on = pickedDays.includes(s.day)
                return (
                  <label key={s.day} className={`${cal.sessionOption} ${on ? cal.sessionOptionOn : ""}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleSession(s.day)}
                      className={cal.sessionCheck}
                    />
                    <span className={cal.sessionInfo}>
                      <span className={cal.sessionDate}>{sessionDateLabel(s.day)}</span>
                      <span className={cal.sessionBook}>『{s.book}』 <span className={cal.sessionAuthor}>{s.author}</span></span>
                      <span className={cal.sessionTime}>{s.time}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            <p className={cal.sessionHint}>복수 선택 가능 · 참여할 모임을 모두 선택해주세요.</p>
            {errors.sessions && <p className={styles.errorText}>{errors.sessions}</p>}
          </div>

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
