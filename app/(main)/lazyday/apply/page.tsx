"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { trackStandard } from "@/lib/meta-pixel"
import { trackEvent } from "@/lib/gtag"
import { FadeUp } from "@/components/animation/FadeUp"
import { ClosingMark } from "@/components/illustrations/bauhaus"
import styles from "./page.module.css"

const SUBMIT_URL =
  "https://script.google.com/macros/s/AKfycbyjnX2RMK1_N2ZX31vqMmNhYORbTa_qcM3K07Ku1BkQls86uNyG3KfSA9oNgSEZCO0/exec"

const sessions = [
  { label: "1회차", thuDate: "5/21", sunDate: "5/24" },
  { label: "2회차", thuDate: "6/4", sunDate: "6/7" },
  { label: "3회차", thuDate: "6/18", sunDate: "6/21" },
  { label: "4회차", thuDate: "7/2", sunDate: "7/5" },
]

type Errors = Partial<Record<
  "name" | "gender" | "age" | "phone" | "job" | "marketingConsent" | "_form",
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

export default function ApplyPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
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
    const job = (data.get("job") as string)?.trim() || ""
    const instagram = (data.get("instagram") as string)?.trim() || ""
    const referral = (data.get("referral") as string)?.trim() || ""

    if (!name) newErrors.name = "성함을 입력해주세요."
    if (!gender) newErrors.gender = "성별을 선택해주세요."
    if (!age) newErrors.age = "나이를 입력해주세요."
    else if (Number(age) < 1 || Number(age) > 120) newErrors.age = "나이를 다시 확인해주세요."
    if (!phone) newErrors.phone = "전화번호를 입력해주세요."
    else {
      const digits = phone.replace(/[^0-9]/g, "")
      if (digits.length < 10 || digits.length > 11) newErrors.phone = "휴대전화 번호를 다시 확인해주세요."
    }
    if (!job) newErrors.job = "직업을 입력해주세요."
    if (!marketingConsent) newErrors.marketingConsent = "동의가 필요해요."

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
    const payload = { name, gender, age, phone, job, instagram, referral, marketingConsent: "동의" }

    try {
      await fetch(SUBMIT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      trackStandard("CompleteRegistration", { content_name: "독서모임_신청완료" })
      trackStandard("Lead", { content_name: "독서모임_신청완료" })
      trackEvent("apply_complete", { program: "book_club" })
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setErrors({ _form: "전송 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." })
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className={styles.successPage}>
        <div className={styles.successInner}>
          <FadeUp>
            <ClosingMark className={styles.successMark} />
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className={styles.successTitle}>신청 받았어요</h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className={styles.successBody}>
              인터뷰 일정 조율을 위해<br />
              링키라운지 카카오톡채널을 통해<br />
              곧 연락 드릴게요.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <p className={styles.successCloser}>레이지데이 북클럽에서 만나요.</p>
          </FadeUp>
          <FadeUp delay={0.4}>
            <Link href="/" className={styles.successHomeLink}>홈으로</Link>
          </FadeUp>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.applyPage}>
      <div className={styles.container}>
        <FadeUp>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <p className={styles.headerSub}>레이지데이 북클럽 2기</p>
              <h1 className={styles.headerTitle}>신청하기</h1>
            </div>
            <ClosingMark className={styles.headerMark} />
          </div>
        </FadeUp>

        <FadeUp delay={0.05}>
          <div className={styles.processFlow}>
            <span className={styles.processStep}>신청서 작성</span>
            <span className={styles.processArrow}>→</span>
            <span className={styles.processStep}>15분 전화 인터뷰</span>
            <span className={styles.processArrow}>→</span>
            <span className={styles.processStep}>확정</span>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <section className={styles.scheduleNotice}>
            <h2 className={styles.scheduleTitle}>
              2기 일정 <span className={styles.scheduleSub}>(격주)</span>
            </h2>
            <p className={styles.scheduleNote}>*회차별 목·일 중 참여 요일 선택 가능</p>
            <div className={styles.scheduleList}>
              {sessions.map((s) => (
                <div key={s.label} className={styles.scheduleRow}>
                  <span className={styles.scheduleLabel}>{s.label}</span>
                  <div className={styles.scheduleDates}>
                    <div className={styles.scheduleDate}>
                      <span className={styles.scheduleDay}>목</span>
                      <span className={styles.scheduleDateText}>{s.thuDate}</span>
                      <span className={styles.scheduleTime}>19:30–22:30</span>
                    </div>
                    <div className={styles.scheduleDate}>
                      <span className={styles.scheduleDay}>일</span>
                      <span className={styles.scheduleDateText}>{s.sunDate}</span>
                      <span className={styles.scheduleTime}>14:30–17:30</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className={styles.scheduleSpecial}>
                <span className={styles.scheduleSpecialIcon}>✦</span>
                <div>
                  <p className={styles.scheduleSpecialName}>레이지선데이 미드나잇</p>
                  <p className={styles.scheduleSpecialDate}>7/12 (일) · 17:30 ~ 22:30</p>
                </div>
              </div>
            </div>
          </section>
        </FadeUp>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FadeUp delay={0.15}>
            <FormField label="이름" name="name" required error={errors.name}>
              <input
                id="name"
                type="text"
                name="name"
                className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                placeholder="성함을 기입해주세요"
                onChange={() => clearError("name")}
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.2}>
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
          </FadeUp>

          <FadeUp delay={0.25}>
            <FormField label="나이" name="age" required error={errors.age}>
              <input
                id="age"
                type="number"
                name="age"
                inputMode="numeric"
                className={`${styles.input} ${errors.age ? styles.inputError : ""}`}
                placeholder="만 나이를 입력해주세요"
                min={1}
                onChange={() => clearError("age")}
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.3}>
            <FormField label="전화번호" name="phone" required error={errors.phone}>
              <input
                id="phone"
                type="tel"
                name="phone"
                inputMode="numeric"
                className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                placeholder="010-0000-0000"
                onChange={(e) => {
                  e.target.value = formatPhone(e.target.value)
                  clearError("phone")
                }}
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.35}>
            <FormField label="직업" name="job" required error={errors.job}>
              <input
                id="job"
                type="text"
                name="job"
                className={`${styles.input} ${errors.job ? styles.inputError : ""}`}
                placeholder="직업 또는 하고 있는 일을 간단히"
                onChange={() => clearError("job")}
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.4}>
            <FormField label="인스타그램 아이디" name="instagram" optional>
              <input
                id="instagram"
                type="text"
                name="instagram"
                className={styles.input}
                placeholder="@your_instagram"
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.45}>
            <FormField label="추천인" name="referral" optional>
              <input
                id="referral"
                type="text"
                name="referral"
                className={styles.input}
                placeholder="지인 성함 입력 시 10% 할인 적용"
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.5}>
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
                  <span className={styles.required}>*</span>
                </span>
              </label>
              <p className={styles.consentNote}>
                수집된 개인정보는 레이지데이 북클럽 운영 및 마케팅 목적으로만 활용되며, 관계 법령에 따라 안전하게 보호됩니다.
              </p>
              {errors.marketingConsent && (
                <p className={styles.errorText}>{errors.marketingConsent}</p>
              )}
            </div>
          </FadeUp>

          {errors._form && (
            <FadeUp>
              <p className={styles.formError}>{errors._form}</p>
            </FadeUp>
          )}

          <FadeUp delay={0.55}>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "보내는 중..." : "신청 보내기"}
            </button>
          </FadeUp>
        </form>
      </div>
    </main>
  )
}
