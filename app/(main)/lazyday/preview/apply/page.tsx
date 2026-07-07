"use client"

import { useState, useEffect, type FormEvent, type ReactNode } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import styles from "../../apply/page.module.css"
import pstyles from "../preview.module.css"
import { JourneyStepper } from "../JourneyStepper"
import { PREVIEW } from "../preview-config"

const sessions = [
  { label: "1회차", wed: "7/15", thu: "7/16", sun: "7/19" },
  { label: "2회차", wed: "7/29", thu: "7/30", sun: "8/2"  },
  { label: "3회차", wed: "8/12", thu: "8/13", sun: "8/16" },
  { label: "4회차", wed: "8/26", thu: "8/27", sun: "8/30" },
]

type Errors = Partial<Record<
  "name" | "gender" | "age" | "phone" | "interviewType" | "privacyConsent" | "_form",
  string
>>

function FormField({
  label, name, required, optional, error, children, sectionId,
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

/**
 * ── 개선안 프리뷰 신청 페이지 ──
 * 원본 대비 변경점:
 *  1. 신청 여정 스텝퍼 (현재: 1단계)
 *  2. 제출 버튼 위 참가비·결제 시점 요약 카드
 *  3. 동의 분리: 개인정보 수집·이용(필수) + 마케팅 수신(선택)
 *  4. 성별 문항에 이유 마이크로카피
 *  5. 로고 → 홈으로 링크
 *  6. 완료 화면 '돌아가기' → 홈 (기존: 인스타그램)
 *  7. 제출은 목업 (실패 시뮬레이션 토글 포함, API 미연동)
 */
export default function PreviewApplyPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [interviewType, setInterviewType] = useState("")
  const [simulateFail, setSimulateFail] = useState(false)

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

    if (!name) newErrors.name = "이름을 입력해주세요."
    if (!gender) newErrors.gender = "성별을 선택해주세요."
    if (!age) newErrors.age = "나이를 입력해주세요."
    if (!phone) newErrors.phone = "전화번호를 입력해주세요."
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
          : document.querySelector(`[name="${firstKey}"]`)
      target?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setErrors({})
    setLoading(true)

    // ── 목업 제출: 실제 API 호출 없음 ──
    await new Promise((r) => setTimeout(r, 900))
    if (simulateFail) {
      setLoading(false)
      setErrors({
        _form: "일시적인 오류로 신청이 접수되지 않았어요. 입력하신 내용은 그대로 남아 있으니, 잠시 후 '신청 완료하기'를 다시 눌러주세요.",
      })
      document.getElementById("form-error-anchor")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    try {
      sessionStorage.setItem("lazyday_preview_applicant", JSON.stringify({ name, phone, interviewType }))
    } catch {}
    setLoading(false)
    setSubmitted(true)
  }

  useEffect(() => {
    if (submitted) window.scrollTo(0, 0)
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
              {/* 개선: '돌아가기'가 홈으로 (기존: 인스타그램) */}
              <LazydayLink href="/preview" className={styles.successSecondaryLink}>
                홈으로 돌아가기
              </LazydayLink>
              <LazydayLink
                href={isPhone ? "/preview/apply/interview/schedule" : "/preview/apply/interview/written"}
                className={styles.successPrimaryLink}
              >
                {isPhone ? "전화 인터뷰 일정 잡기" : "서면 인터뷰 작성하기"}
              </LazydayLink>
            </div>
          </FadeUp>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.applyPage} data-track-section="bookclub_apply_preview">
      {loading && <SubmitOverlay label="신청 접수 중..." />}
      <div className={styles.container}>
        <FadeUp y={12} duration={0.9}>
          <div id="apply-info" className={styles.header}>
            {/* 개선: 로고가 홈으로 돌아가는 링크 */}
            <LazydayLink href="/preview" aria-label="레이지데이 북클럽 홈으로">
              <img
                src="/linky-lounge/book-club/ldbc-logo-text.png"
                alt="레이지데이 북클럽"
                className={styles.headerImage}
              />
            </LazydayLink>
            <h1 className={styles.headerTitle}>
              레이지데이 북클럽
              <br />
              <span className={styles.headerSeason}>3기</span> 신청하기
            </h1>
            {/* 개선: 신청 여정 스텝퍼 */}
            <JourneyStepper current={1} />
          </div>
        </FadeUp>

        <section className={styles.scheduleNotice}>
            <h2 className={styles.scheduleHeader}>3기 일정</h2>
            <table className={styles.scheduleTable}>
              <thead>
                <tr>
                  <th className={styles.schThEmpty} />
                  <th className={styles.schThDay}>
                    수요일<br />
                    <span className={styles.schThTime}>19:30–22:30</span>
                  </th>
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
                    <td className={styles.schTdDate}>{s.wed}</td>
                    <td className={styles.schTdDate}>{s.thu}</td>
                    <td className={styles.schTdDate}>{s.sun}</td>
                  </tr>
                ))}
                <tr>
                  <td className={styles.schTdLabel}>5회차</td>
                  <td colSpan={3} className={styles.schTdMidnight}>
                    9/6 (일)<br />
                    <span className={styles.schThTime}>1부 14:30–17:00 · 2부 17:00–</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p className={styles.scheduleNote}>*회차별 수·목·일 중 참여 요일 선택 가능</p>
          </section>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
              {/* 개선: 수집 이유 마이크로카피 */}
              <p className={pstyles.microcopy}>균형 잡힌 모임 구성을 위해 성비를 참고하고 있어요.</p>
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
              <p className={pstyles.microcopy}>인터뷰 안내와 합류 확정 연락에 사용돼요.</p>
            </FormField>

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
                  <p>진행자와 나누는 <strong>약 20분</strong>의 전화 대화예요. 모임의 분위기와 결을 미리 느껴볼 수 있고, 궁금한 점도 바로 물어볼 수 있어요. 신청 완료 후 바로 <strong>일정 예약 페이지</strong>로 이어져요.</p>
                </div>
              )}
              {interviewType === "서면 인터뷰" && (
                <div className={styles.interviewTypeDesc}>
                  <p>시간에 구애받지 않고 <strong>6가지 질문</strong>에 자유롭게 답하는 방식이에요(약 10–15분). 신청 완료 후 바로 <strong>작성 페이지</strong>로 이어져요.</p>
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
                placeholder="지인 성함 입력 시 10% 할인 적용해드려요."
              />
            </FormField>

            {/* 개선: 동의 분리 — 필수(수집·이용) / 선택(마케팅) */}
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
                수집 항목: 이름·성별·나이·연락처 등 신청서 기재 정보 / 이용 목적: 인터뷰 및 모임 운영을 위한 연락 / 보유 기간: 해당 기수 종료 후 파기.{" "}
                <a href="/policy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                  개인정보처리방침
                </a>
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
                  다음 기수·모임 소식 알림 수신에 동의합니다.{" "}
                  <span className={styles.optional}>(선택)</span>
                </span>
              </label>
              <p className={styles.consentNote}>
                동의하지 않아도 신청과 인터뷰 진행에는 아무런 제한이 없어요.
              </p>
            </div>

            {/* 참가비 상세는 기존처럼 인터뷰 페이지에서만 노출 (운영자 결정 2026-07-03) */}

          <div id="form-error-anchor">
          {errors._form && (
              <div className={pstyles.failBanner} role="alert">
                <p className={pstyles.failBannerTitle}>신청이 접수되지 않았어요</p>
                <p className={pstyles.failBannerText}>{errors._form}</p>
              </div>
          )}
          </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "신청 중입니다..." : "신청 완료하기"}
            </button>
        </form>

        {/* 프리뷰 전용: 실패 시뮬레이션 토글 */}
        <label className={pstyles.simToggle}>
          <input
            type="checkbox"
            checked={simulateFail}
            onChange={(e) => setSimulateFail(e.target.checked)}
          />
          제출 실패 시뮬레이션 (프리뷰 전용)
        </label>
      </div>
    </main>
  )
}
