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
import { SEASON } from "../../season-config"
import { ApplyCalendar } from "../../apply/ApplyCalendar"

type Errors = Partial<Record<
  "name" | "gender" | "age" | "phone" | "unavailableDays" | "interviewType" | "privacyConsent" | "_form",
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
  // 동의 상세설명 드롭다운 (실 apply 쌍 동기화 — 기본 접힘, '자세히 보기'로 전개)
  const [privacyDetailOpen, setPrivacyDetailOpen] = useState(false)
  const [marketingDetailOpen, setMarketingDetailOpen] = useState(false)
  const [interviewType, setInterviewType] = useState("")
  const [simulateFail, setSimulateFail] = useState(false)
  // 참여 불가 요일 (복수 선택) — 실 apply와 쌍 동기화 (운영자 지시 2026-07-27)
  const [unavailableDays, setUnavailableDays] = useState<string[]>([])
  // 요일 문항 내 캘린더 드롭다운 (FAQ A안 grid-rows 애니 문법 재사용)
  const [calOpen, setCalOpen] = useState(false)
  // 2단계 폼 (실 apply 쌍 동기화 — 프리뷰는 임시저장 전송 없이 화면 전환만)
  const [step, setStep] = useState<1 | 2>(1)

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

  /** 1단계 검증 → 2단계 (프리뷰는 임시저장 API 미연동 — 실 apply와 화면만 동일) */
  function handleNext() {
    const form = document.querySelector("form") as HTMLFormElement | null
    if (!form) return
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
    setStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
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
    // 전부 불가면 참여 자체가 불가능 — 실수 방지
    if (unavailableDays.length === SEASON.unavailableDaySlots.length)
      newErrors.unavailableDays = "모든 요일을 선택하면 참여 가능한 요일이 없어요. 참여 가능한 요일은 남겨주세요."
    if (!interviewType) newErrors.interviewType = "인터뷰 방식을 선택해주세요."
    if (!privacyConsent) newErrors.privacyConsent = "개인정보 수집·이용 동의가 필요합니다."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstKey = Object.keys(newErrors)[0]
      // 필수 항목은 전부 1단계에 있다 — 누락이면 1단계로 되돌린다
      const step1Keys = ["name", "gender", "age", "phone", "interviewType", "privacyConsent"]
      if (step1Keys.includes(firstKey)) setStep(1)
      const target =
        firstKey === "privacyConsent"
          ? document.getElementById("privacyConsent")
          : firstKey === "interviewType"
          ? document.getElementById("interviewType-group")
          : firstKey === "unavailableDays"
          ? document.getElementById("unavailableDays-group")
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
        _form: "일시적인 오류로 신청이 접수되지 않았어요. 입력하신 내용은 그대로 남아 있으니, 잠시 후 '다음'을 다시 눌러주세요.",
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

        {/* 일정·장소 안내 — 표 형식 부활 + 장소 라인 (실 apply 쌍 동기화 — 운영자 지시 2026-07-27).
            상세 캘린더는 아래 요일 문항의 드롭다운으로 이동 */}
        {/* 2단계에서는 숨김 — 요일 문항의 확장 캘린더 하나만 남긴다 (운영자 지시 2026-07-27) */}
        {step === 1 && (
        <section className={styles.scheduleNotice}>
          {/* 룰드 시트 (E1, 실사이트 쌍 동기화) */}
          <div>
            <div className={styles.ruledBlock}>
              <h2 className={styles.ruledLabel}>{SEASON.name} 일정</h2>
              <table className={styles.scheduleTable}>
                <thead>
                  <tr>
                    <th className={styles.schThEmpty} />
                    {SEASON.days.map((d) => (
                      <th key={d.label} className={styles.schThDay}>
                        {d.label}<br />
                        {d.time.split(", ").map((t) => (
                          <span key={t} className={styles.schThTime}>{t}</span>
                        ))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEASON.sessions.map((s) => (
                    <tr key={s.label}>
                      <td className={styles.schTdLabel}>{s.label}</td>
                      {s.dates.map((date, i) => (
                        <td key={i} className={styles.schTdDate}>{date}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className={styles.schTdLabel}>{SEASON.fifth.label}</td>
                    <td colSpan={SEASON.days.length} className={styles.schTdMidnight}>
                      {SEASON.fifth.date}{" "}
                      <span className={styles.schTimeInline}>{SEASON.fifth.timeLabel}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* 일정 주석 2문장 — 일정 블록 소속이라 같은 .ruledBlock 안에 */}
              <p className={styles.scheduleNote}>*반 배정이 진행되나, 다른 반으로 변경 참여가 가능합니다.</p>
              <p className={styles.scheduleNote}>*참여인원 변동에 따라 모임 일정은 통합·추가 개설될 수 있습니다.</p>
            </div>

            {/* 진행 장소 — 일정과 동급 블록 (실사이트 쌍 동기화).
                멤버십 가격 행은 2026-08-25 제거 — 전화 인터뷰 예약 페이지로 이동 */}
            <div className={styles.ruledBlock}>
              <h2 className={styles.ruledLabel}>진행 장소</h2>
              <p className={styles.scheduleValue}>
                {SEASON.location.name}
                <span className={styles.scheduleValueSub}> ({SEASON.location.sub})</span>
              </p>
              <p className={styles.scheduleNote}>{SEASON.location.note}</p>
            </div>
          </div>
          </section>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* ── 1단계: 요일 · 이름 · 성별 · 나이 · 전화번호 (실 apply 쌍 동기화) ── */}
            <div className={step === 1 ? styles.stepPane : styles.stepPaneHidden}>

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

            {/* 필수 — 인터뷰 방식 */}
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

            {/* 필수 — 개인정보 수집·이용 동의 */}
            <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <div className={styles.consentRow}>
                <label htmlFor="privacyConsent" className={styles.consentRowLabel}>
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
                <button
                  type="button"
                  className={styles.faqIconBtn}
                  onClick={() => setPrivacyDetailOpen((v) => !v)}
                  aria-expanded={privacyDetailOpen}
                  aria-label="개인정보 수집·이용 동의 상세"
                >
                  <span className={`${styles.faqIcon} ${privacyDetailOpen ? styles.faqIconOpen : ""}`}>+</span>
                </button>
              </div>
              {/* 상세 고지는 FAQ 라인 드롭다운 뒤 (실 apply 쌍 동기화) */}
              <div className={`${styles.faqBody} ${privacyDetailOpen ? styles.faqBodyOpen : ""}`}>
                <div className={styles.faqBodyInner}>
                  <div className={styles.consentDetail}>
                  <p className={styles.consentNote}>
                    개인정보 보호법 제15조에 따라 동의를 받습니다.
                    <br />· 수집 항목: 신청서에 기재하신 정보
                    <br />· 이용 목적: 신청 접수, 인터뷰 진행 및 결과 안내, 반 배정 및 모임 운영
                    <br />· 보유 기간: 동의 철회 시까지 (철회 시 지체 없이 파기)
                  </p>
                  </div>
                </div>
              </div>
              {errors.privacyConsent && (
                <p className={styles.errorText}>{errors.privacyConsent}</p>
              )}
            </div>

            </div>
            </div>

            {/* ── 2단계: 선택 항목 (한 줄 인사·인스타·추천인·참여 불가 요일·마케팅 수신) ── */}
            <div className={step === 2 ? styles.stepPane : styles.stepPaneHidden}>
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

            {/* 요일 문항은 추천인 아래 (운영자 지시 2026-07-27) */}
            <div id="unavailableDays-group" className={styles.formGroup}>
              <span className={styles.formLabel}>
                참여 불가 요일
                <span className={styles.optional}>(선택)</span>
              </span>
              <p className={styles.dayHint}>*반배정을 위하여 참여가 불가능한 요일이 있는 경우에만 선택해주세요.</p>
              {/* 일정 주석 2문장 — 랜딩·캘린더와 동일 문면 (운영자 지시 2026-07-28).
                  구 "*반배정이 되더라도, 다른 요일에 교차 참여가 가능합니다."는 같은 내용의 확정 문면으로 대체 */}
              <p className={styles.dayHint}>*반 배정이 진행되나, 다른 반으로 변경 참여가 가능합니다.</p>
              <p className={styles.dayHint}>*참여인원 변동에 따라 모임 일정은 통합·추가 개설될 수 있습니다.</p>
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
              {/* 캘린더 드롭다운 — FAQ 미니멀 라인 문법 (실 apply 쌍 동기화) */}
              <div className={`${styles.faqList} ${styles.calFaqList}`}>
                <div className={`${styles.faqItem} ${styles.calFaqItem}`}>
                  <button
                    type="button"
                    className={`${styles.faqQ} ${styles.calFaqQ}`}
                    onClick={() => setCalOpen((v) => !v)}
                    aria-expanded={calOpen}
                  >
                    {/* 선으로 그린 캘린더 아이콘 — 브랜드 주황 (운영자 지시 2026-07-27) */}
                    <svg className={styles.calIcon} viewBox="0 0 20 20" fill="none" aria-hidden>
                      <rect x="2.5" y="4" width="15" height="13.5" rx="2" stroke="#d2691e" strokeWidth="1.4" />
                      <path d="M2.5 8.25h15" stroke="#d2691e" strokeWidth="1.4" strokeLinecap="round" />
                      <path d="M6.75 2.5v3M13.25 2.5v3" stroke="#d2691e" strokeWidth="1.4" strokeLinecap="round" />
                      <path d="M6 11.5h2.5M11.5 11.5H14M6 14.5h2.5M11.5 14.5H14" stroke="#d2691e" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <span className={styles.faqQText}>{SEASON.name} 일정 캘린더 보기</span>
                    <span className={`${styles.faqIcon} ${calOpen ? styles.faqIconOpen : ""}`}>+</span>
                  </button>
                  <div className={`${styles.faqBody} ${calOpen ? styles.faqBodyOpen : ""}`}>
                    <div className={styles.faqBodyInner}>
                      <ApplyCalendar />
                    </div>
                  </div>
                </div>
              </div>
              {errors.unavailableDays && <p className={styles.errorText}>{errors.unavailableDays}</p>}
            </div>

            {/* 개선: 동의 분리 — 필수(수집·이용) / 선택(마케팅) */}
            <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <div className={styles.consentRow}>
                <label htmlFor="marketingConsent" className={styles.consentRowLabel}>
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
                <button
                  type="button"
                  className={styles.faqIconBtn}
                  onClick={() => setMarketingDetailOpen((v) => !v)}
                  aria-expanded={marketingDetailOpen}
                  aria-label="모임 소식 수신 동의 상세"
                >
                  <span className={`${styles.faqIcon} ${marketingDetailOpen ? styles.faqIconOpen : ""}`}>+</span>
                </button>
              </div>
              <div className={`${styles.faqBody} ${marketingDetailOpen ? styles.faqBodyOpen : ""}`}>
                <div className={styles.faqBodyInner}>
                  <div className={styles.consentDetail}>
                  <p className={styles.consentNote}>
                    정보통신망법 제50조에 따른 광고성 정보 수신 동의입니다. 동의하지 않아도 신청과 참여에 제한이 없습니다.
                  </p>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* 참가비 상세는 기존처럼 인터뷰 페이지에서만 노출 (운영자 결정 2026-07-03) */}

            </div>

          <div id="form-error-anchor">
          {errors._form && (
              <div className={pstyles.failBanner} role="alert">
                <p className={pstyles.failBannerTitle}>신청이 접수되지 않았어요</p>
                <p className={pstyles.failBannerText}>{errors._form}</p>
              </div>
          )}
          </div>

            {step === 1 ? (
              <button type="button" className={styles.submitButton} disabled={loading} onClick={handleNext}>
                다음
              </button>
            ) : (
              /* 2단계에서 1단계로 돌아가기 (실 apply 쌍 동기화) */
              <div className={styles.stepButtonRow}>
                <button
                  type="button"
                  className={styles.backButton}
                  disabled={loading}
                  onClick={() => {
                    setStep(1)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  이전
                </button>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? "신청 중입니다..." : "다음"}
                </button>
              </div>
            )}
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
