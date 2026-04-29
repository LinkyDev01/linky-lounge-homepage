"use client"

import { useState, useEffect, type FormEvent, type ReactNode } from "react"
import { trackStandard } from "@/lib/meta-pixel"
import { trackEvent } from "@/lib/gtag"
import { FadeUp } from "@/components/animation/FadeUp"
import { ClosingMark } from "@/components/illustrations/bauhaus"
import { ApplySectionIndicator } from "./ApplySectionIndicator"
import styles from "./page.module.css"

const SUBMIT_URL =
  "https://script.google.com/macros/s/AKfycbyjnX2RMK1_N2ZX31vqMmNhYORbTa_qcM3K07Ku1BkQls86uNyG3KfSA9oNgSEZCO0/exec"

const sessions = [
  { label: "1회차", thu: "5/21", sun: "5/24" },
  { label: "2회차", thu: "6/4", sun: "6/7" },
  { label: "3회차", thu: "6/18", sun: "6/21" },
  { label: "4회차", thu: "7/2", sun: "7/5" },
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

    if (!name) newErrors.name = "이름을 입력해주세요."
    if (!gender) newErrors.gender = "성별을 선택해주세요."
    if (!age) newErrors.age = "나이를 입력해주세요."
    if (!phone) newErrors.phone = "전화번호를 입력해주세요."
    if (!job) newErrors.job = "직업을 입력해주세요."
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
      name,
      gender,
      age,
      phone,
      job,
      instagram,
      referral,
      marketingConsent: marketingConsent ? "동의" : "미동의",
    }

    // Fire-and-forget: no-cors POST는 응답을 읽을 수 없으므로 await 없이 백그라운드로 보냄
    fetch(SUBMIT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {})

    trackStandard("CompleteRegistration", { content_name: "독서모임_신청완료" })
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
    return (
      <main className={styles.successPage}>
        <div className={styles.successInner}>
          <FadeUp>
            <ClosingMark className={styles.successMark} />
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className={styles.successTitle}>신청해주셔서 감사합니다.</h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className={styles.successBody}>
              <span className={styles.successAccent}>인터뷰</span> 일정 조율을 위해
              <br />
              <span className={styles.successAccent}>링키라운지 카카오톡채널</span>을 통해 연락 드릴게요.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <p className={styles.successCloser}>레이지데이 북클럽에서 곧 만나요.</p>
          </FadeUp>
          <FadeUp delay={0.4}>
            <div className={styles.successActions}>
              <a
                href="https://www.instagram.com/linky_lounge"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.successSecondaryLink}
              >
                돌아가기
              </a>
              <a
                href="https://pf.kakao.com/_gixaAX"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.successPrimaryLink}
              >
                인터뷰 일정 잡기
              </a>
            </div>
          </FadeUp>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.applyPage}>
      <ApplySectionIndicator />
      <div className={styles.container}>
        <FadeUp>
          <div id="apply-info" className={styles.header}>
            <img
              src="/linky-lounge/book-club/lazy_typo_brown.png"
              alt="Lazy Day Book Club"
              className={styles.headerImage}
            />
            <h1 className={styles.headerTitle}>
              레이지데이 북클럽
              <br />
              <span className={styles.headerSeason}>2기</span> 신청하기
            </h1>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <section className={styles.scheduleNotice}>
            <h2 className={styles.scheduleHeader}>2기 일정</h2>
            <table className={styles.scheduleTable}>
              <thead>
                <tr>
                  <th className={styles.schThEmpty} />
                  <th className={styles.schThDay}>
                    목요일<br />
                    <span className={styles.schThTime}>19:30–22:30</span>
                  </th>
                  <th className={styles.schThDay}>
                    일요일<br />
                    <span className={styles.schThTime}>14:30–17:30</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.label}>
                    <td className={styles.schTdLabel}>{s.label}</td>
                    <td className={styles.schTdDate}>{s.thu}</td>
                    <td className={styles.schTdDate}>{s.sun}</td>
                  </tr>
                ))}
                <tr>
                  <td className={styles.schTdLabel}>파티</td>
                  <td colSpan={2} className={styles.schTdMidnight}>레이지선데이 미드나잇&nbsp;&nbsp;7/12 (일)&nbsp;&nbsp;17:30 –</td>
                </tr>
              </tbody>
            </table>
            <p className={styles.scheduleNote}>*회차별 목·일 중 참여 요일 선택 가능</p>
          </section>
        </FadeUp>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FadeUp delay={0.15}>
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
                placeholder="만 나이를 입력해주세요."
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
                placeholder="휴대전화 번호를 입력해주세요."
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
                placeholder="직업 또는 하고 있는 일을 간단히 알려주세요"
                onChange={() => clearError("job")}
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.4}>
            <FormField label="인스타그램 아이디" name="instagram" optional sectionId="apply-optional">
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
                placeholder="지인 성함 입력 시 10% 할인 적용해드려요."
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
          </FadeUp>

          {errors._form && (
            <FadeUp>
              <p className={styles.formError}>{errors._form}</p>
            </FadeUp>
          )}

          <FadeUp delay={0.55}>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "신청 중입니다..." : "신청 완료하기"}
            </button>
          </FadeUp>
        </form>
      </div>
    </main>
  )
}
