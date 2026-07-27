"use client"

import { useState, useEffect, type FormEvent, type ReactNode } from "react"
import { trackStandard } from "@/lib/meta-pixel"
import { trackEvent } from "@/lib/gtag"
import { useBasePath } from "@/hooks/use-base-path"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import { ApplySectionIndicator } from "./ApplySectionIndicator"
import { SEASON } from "../season-config"
import { JourneyStepper } from "../JourneyStepper"
import { ApplyCalendar } from "./ApplyCalendar"
import styles from "./page.module.css"

const SUBMIT_URL = "/api/lazyday/apply"

// '주로 참여할 요일' 문항 — 보류 중 (2026-07-02 운영자 결정). true로 바꾸면 다시 노출.
// GAS handleApply는 이 필드가 있을 때만 '희망 요일' 컬럼을 만들므로 켜고 끄기만 하면 됨.
const SHOW_PREFERRED_DAYS = false

type Errors = Partial<Record<
  "name" | "gender" | "age" | "phone" | "preferredDays" | "unavailableDays" | "interviewType" | "privacyConsent" | "_form",
  string
>>

function FormField({
  label,
  name,
  required,
  optional,
  error,
  children,
  sectionId,
}: {
  label: string
  name: string
  required?: boolean
  optional?: boolean
  error?: string
  children: ReactNode
  sectionId?: string
}) {
  return (
    <div id={sectionId} className={styles.formGroup}>
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

export default function ApplyPage() {
  const base = useBasePath()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  // 동의 분리 (운영자 확정 2026-07-27): 개인정보 수집·이용(필수, 개인정보 보호법 제15조)
  // + 마케팅 수신(선택, 제22조·정보통신망법 제50조 — 필수화 금지)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [interviewType, setInterviewType] = useState("")
  // 주로 참여할 요일 (복수 선택) — 요일별 정원 관리·인터뷰 시 조율 시간 절약용
  const [preferredDays, setPreferredDays] = useState<string[]>([])

  function toggleDay(day: string) {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
    clearError("preferredDays")
  }

  // 참여 불가 요일 (복수 선택) — 반 배정 시 배제 조건으로 활용 (운영자 지시 2026-07-27)
  const [unavailableDays, setUnavailableDays] = useState<string[]>([])

  function toggleUnavailableDay(slot: string) {
    setUnavailableDays((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    )
    clearError("unavailableDays")
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
    const referral = (data.get("referral") as string)?.trim() || ""

    if (!name) newErrors.name = "이름을 입력해주세요."
    if (!gender) newErrors.gender = "성별을 선택해주세요."
    if (!age) newErrors.age = "나이를 입력해주세요."
    if (!phone) newErrors.phone = "전화번호를 입력해주세요."
    if (SHOW_PREFERRED_DAYS && preferredDays.length === 0) newErrors.preferredDays = "주로 참여할 요일을 한 개 이상 선택해주세요."
    // 전부 불가면 참여 자체가 불가능 — 실수 방지
    if (unavailableDays.length === SEASON.unavailableDaySlots.length)
      newErrors.unavailableDays = "모든 요일을 선택하면 참여 가능한 요일이 없어요. 참여 가능한 요일은 남겨주세요."
    if (!interviewType) newErrors.interviewType = "인터뷰 방식을 선택해주세요."
    if (!privacyConsent) newErrors.privacyConsent = "개인정보 수집·이용 동의가 필요합니다."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstKey = Object.keys(newErrors)[0]
      const target =
        firstKey === "privacyConsent"
          ? document.getElementById("privacyConsent")
          : firstKey === "interviewType"
          ? document.getElementById("interviewType-group")
          : firstKey === "preferredDays"
          ? document.getElementById("preferredDays-group")
          : firstKey === "unavailableDays"
          ? document.getElementById("unavailableDays-group")
          : document.querySelector(`[name="${firstKey}"]`)
      target?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setErrors({})
    setLoading(true)
    const payload = {
      name,
      gender,
      age,
      phone,
      greeting,
      instagram,
      referral,
      preferredDays: SHOW_PREFERRED_DAYS ? preferredDays.join(", ") : "",
      // 미선택 = 모든 요일 가능 — 시트에서 공란과 구분되게 "없음"으로 명시 기록
      unavailableDays: unavailableDays.length > 0 ? unavailableDays.join(", ") : "없음",
      interviewType,
      marketingConsent: marketingConsent ? "동의" : "미동의",
      consentAt: new Date().toISOString(), // 동의 시각 기록 (법적 증빙)
    }

    // 서버 접수가 확인된 경우에만 완료 화면을 보여준다 (신청 유실 방지)
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

    // 인터뷰 페이지에서 자동 입력을 위해 이름·전화번호·인터뷰방식 저장
    try {
      sessionStorage.setItem("lazyday_applicant", JSON.stringify({ name, phone, interviewType }))
    } catch {}

    trackStandard("Lead", { content_name: "독서모임_신청완료" })
    trackEvent("apply_complete", { program: "book_club" })
    setSubmitted(true)
  }

  useEffect(() => {
    if (submitted) {
      window.scrollTo(0, 0)
    }
  }, [submitted])

  if (submitted) {
    const isPhone = interviewType === "전화 인터뷰"
    return (
      <main className={styles.successPage}>
        <div className={styles.successInner}>
          <BlurReveal duration={1.0} blur={10} fromScale={1.03}>
            <img
              src="/linky-lounge/book-club/lazyday_logo.png"
              alt="레이지데이"
              className={styles.successMark}
            />
          </BlurReveal>
          <FadeUp delay={0.15}>
            <h1 className={styles.successTitle}>신청해주셔서 감사합니다.</h1>
          </FadeUp>
          <FadeUp delay={0.3}>
            <JourneyStepper current={2} caption="다음은 인터뷰예요. 바로 이어서 진행할 수 있어요." />
          </FadeUp>
          <FadeUp delay={0.45}>
            <p className={styles.successBody}>
              신청이 완료되었습니다.
              <br />
              아래 버튼을 눌러{" "}
              <span className={styles.successAccent}>
                {isPhone ? "인터뷰 일정" : "서면 인터뷰"}
              </span>
              을 바로 진행해주세요.
            </p>
          </FadeUp>
          <FadeUp delay={0.45}>
            <p className={styles.successCloser}>레이지데이 북클럽에서 곧 만나요.</p>
          </FadeUp>
          <FadeUp delay={0.6}>
            <div className={styles.successActions}>
              <a
                href="https://www.instagram.com/lazyday_bookclub"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.successSecondaryLink}
              >
                돌아가기
              </a>
              <a
                href={isPhone ? `${base}/apply/interview/schedule` : `${base}/apply/interview/written`}
                className={styles.successPrimaryLink}
              >
                {isPhone ? "전화 인터뷰 일정 잡기" : "서면 인터뷰 작성하기"}
              </a>
            </div>
          </FadeUp>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.applyPage} data-track-section="bookclub_apply_page">
      {loading && <SubmitOverlay label="신청 접수 중..." />}
      <ApplySectionIndicator />
      <div className={styles.container}>
        <FadeUp y={12} duration={0.9}>
          <div id="apply-info" className={styles.header}>
            <img
              src="/linky-lounge/book-club/ldbc-logo-text.png"
              alt="레이지데이 북클럽"
              className={styles.headerImage}
            />
            <h1 className={styles.headerTitle}>
              레이지데이 북클럽
              <br />
              <span className={styles.headerSeason}>{SEASON.name}</span> 신청하기
            </h1>
            <JourneyStepper current={1} />
          </div>
        </FadeUp>

        {/* 일정 안내 = 랜딩 14a 월별 달력의 분리 사본 (구 표 형식 대체 — 운영자 지시 2026-07-27) */}
        <section className={styles.scheduleNotice}>
            <ApplyCalendar />
          </section>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* 요일 문항을 맨 먼저 — 그 아래 이름부터 (운영자 지시 2026-07-27) */}
            <div id="unavailableDays-group" className={styles.formGroup}>
              {/* '불가' 강조 — 희망 요일로 오독 방지 */}
              <span className={styles.formLabel}>참여 <strong className={styles.labelStrong}>불가</strong> 요일</span>
              <div className={styles.dayGrid}>
                {SEASON.unavailableDaySlots.map((slot) => (
                  <label key={slot.label} className={styles.radioLabel}>
                    <input
                      type="checkbox"
                      checked={unavailableDays.includes(slot.label)}
                      onChange={() => toggleUnavailableDay(slot.label)}
                    />
                    <span className={styles.dayCol}>
                      <span className={styles.radioText}>{slot.label}</span>
                      <span className={styles.daySlotTime}>{slot.time}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className={styles.dayHint}>*반배정을 위해 고정적으로 참여 불가능한 요일을 선택해주세요.</p>
              <p className={styles.dayHint}>*반배정이 되더라도, 다른 요일에 교차 참여가 가능합니다.</p>
              {errors.unavailableDays && <p className={styles.errorText}>{errors.unavailableDays}</p>}
            </div>

            <FormField label="이름" name="name" required error={errors.name} sectionId="apply-required">
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

            {SHOW_PREFERRED_DAYS && (
            <div id="preferredDays-group" className={styles.formGroup}>
              <span className={styles.formLabel}>
                주로 참여할 요일
                <span className={styles.required}>*</span>
              </span>
              <div className={styles.radioGroup}>
                {SEASON.days.map((d) => (
                  <label key={d.label} className={styles.radioLabel}>
                    <input
                      type="checkbox"
                      checked={preferredDays.includes(d.label)}
                      onChange={() => toggleDay(d.label)}
                    />
                    <span className={styles.radioText}>{d.label}</span>
                  </label>
                ))}
              </div>
              <p className={styles.dayHint}>복수 선택 가능 · 회차마다 다른 요일로 참여할 수도 있어요.</p>
              {errors.preferredDays && <p className={styles.errorText}>{errors.preferredDays}</p>}
            </div>
            )}

            <div id="interviewType-group" className={styles.formGroup}>
              <span className={styles.formLabel}>
                인터뷰 방식
                <span className={styles.required}>*</span>
              </span>
              {/* 서면을 첫 옵션으로 — 운영 부하(전화 20분/인) 조절을 위해 서면 우선 유도 */}
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="interviewType"
                    value="서면 인터뷰"
                    onChange={() => { setInterviewType("서면 인터뷰"); clearError("interviewType") }}
                  />
                  <span className={styles.radioText}>서면 인터뷰</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="interviewType"
                    value="전화 인터뷰"
                    onChange={() => { setInterviewType("전화 인터뷰"); clearError("interviewType") }}
                  />
                  <span className={styles.radioText}>전화 인터뷰</span>
                </label>
              </div>
              {errors.interviewType && <p className={styles.errorText}>{errors.interviewType}</p>}
              {interviewType === "전화 인터뷰" && (
                <div className={styles.interviewTypeDesc}>
                  <p>진행자와 나누는 <strong>약 20분</strong>의 전화 대화예요. 모임의 분위기와 결을 미리 느껴볼 수 있고, 궁금한 점도 바로 물어볼 수 있어요.</p>
                </div>
              )}
              {interviewType === "서면 인터뷰" && (
                <div className={styles.interviewTypeDesc}>
                  <p>시간에 구애받지 않고 <strong>6가지 질문</strong>에 자유롭게 답하는 방식이에요. 나만의 속도로 생각을 정리하며 작성할 수 있어요.</p>
                </div>
              )}
            </div>

            <FormField label="한 줄 인사" name="greeting" optional sectionId="apply-optional">
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

            <FormField label="추천인" name="referral" optional>
              <input
                id="referral"
                type="text"
                name="referral"
                className={styles.input}
                placeholder="추천인 입력 시 10% 할인을 적용해 드립니다."
              />
            </FormField>

            {/* 동의 분리 — 필수(제15조 고지 4항목 포함) / 선택(마케팅, 제22조·정보통신망법 제50조.
                필수화·목적 혼용 금지 — 인터뷰 결과 안내는 필수 동의의 '이용 목적'으로 커버) */}
            <div className={styles.consentBox}>
              <label htmlFor="privacyConsent" className={styles.consentLabel}>
                <input
                  id="privacyConsent"
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => {
                    setPrivacyConsent(e.target.checked)
                    if (e.target.checked) clearError("privacyConsent")
                  }}
                  className={styles.checkbox}
                />
                <span className={styles.consentText}>
                  개인정보 수집·이용에 동의합니다.{" "}
                  <span className={styles.requiredTag}>(필수)</span>
                </span>
              </label>
              <p className={styles.consentNote}>
                개인정보 보호법 제15조 제1항 제1호에 따라 동의를 받습니다.
                <br />· 수집 항목: 이름, 성별, 나이, 전화번호, 인스타그램 아이디, 추천인 등 신청서 기재 정보
                <br />· 이용 목적: 신청 접수, 인터뷰 진행 및 결과 안내, 반 배정 및 모임 운영을 위한 연락
                <br />· 보유·이용 기간: 동의 철회 시까지 (철회 시 지체 없이 파기, 동법 제21조)
                <br />· 동의를 거부하실 수 있으나, 거부 시 신청 접수가 어렵습니다.
              </p>
              {errors.privacyConsent && (
                <p className={styles.errorText}>{errors.privacyConsent}</p>
              )}
            </div>

            <div className={styles.consentBox}>
              <label htmlFor="marketingConsent" className={styles.consentLabel}>
                <input
                  id="marketingConsent"
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.consentText}>
                  모임 소식·다음 기수 안내 수신에 동의합니다.{" "}
                  <span className={styles.optional}>(선택)</span>
                </span>
              </label>
              <p className={styles.consentNote}>
                개인정보 보호법 제22조 및 정보통신망법 제50조 제1항에 따른 광고성 정보 수신 동의입니다. 동의하지 않아도 신청과 참여에 불이익이 없습니다.
              </p>
            </div>

          {errors._form && (
              <p className={styles.formError}>{errors._form}</p>
          )}

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "신청 중입니다..." : "신청 완료하기"}
            </button>
        </form>
      </div>
    </main>
  )
}
