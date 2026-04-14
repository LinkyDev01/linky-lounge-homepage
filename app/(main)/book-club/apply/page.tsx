"use client"

import { useState, type FormEvent } from "react"
import { trackStandard } from "@/lib/meta-pixel"
import { trackEvent } from "@/lib/gtag"
import styles from "./page.module.css"

export default function BookClubApplyPage() {
  const [loading, setLoading] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  const scheduleInfo = [
    {
      label: "평일 저녁반",
      time: "19:30 – 22:30",
      sub: "격주 고정 요일 진행 · 5/18 ~ 7/17",
    },
    {
      label: "일요일 오후반",
      time: "14:30 – 17:30",
      sub: "격주 일요일 진행 · 5/24 ~ 7/19",
    },
  ]

  function validateForm(): boolean {
    const form = document.getElementById("applicationForm") as HTMLFormElement
    if (!form) return false

    const name = form.querySelector<HTMLInputElement>('input[name="name"]')
    const gender = form.querySelectorAll<HTMLInputElement>('input[name="gender"]')
    const age = form.querySelector<HTMLInputElement>('input[name="age"]')
    const phone = form.querySelector<HTMLInputElement>('input[name="phone"]')
    const job = form.querySelector<HTMLInputElement>('input[name="job"]')

    if (!name?.value.trim()) { alert("이름을 입력해주세요."); name?.focus(); return false }
    if (!Array.from(gender).some(r => r.checked)) { alert("성별을 선택해주세요."); return false }
    if (!age?.value.trim()) { alert("나이를 입력해주세요."); age?.focus(); return false }
    if (!phone?.value.trim()) { alert("전화번호를 입력해주세요."); phone?.focus(); return false }
    if (!job?.value.trim()) { alert("직업을 입력해주세요."); job?.focus(); return false }
    if (!marketingConsent) { alert("마케팅 활용 및 개인정보 수집 동의가 필요합니다."); return false }

    return true
  }

  function formatPhone(value: string) {
    const nums = value.replace(/[^0-9]/g, "")
    if (nums.length <= 3) return nums
    if (nums.length <= 7) return nums.slice(0, 3) + "-" + nums.slice(3)
    return nums.slice(0, 3) + "-" + nums.slice(3, 7) + "-" + nums.slice(7, 11)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    const form = e.currentTarget

    const payload = {
      name: form.querySelector<HTMLInputElement>('input[name="name"]')?.value,
      gender: form.querySelector<HTMLInputElement>('input[name="gender"]:checked')?.value,
      age: form.querySelector<HTMLInputElement>('input[name="age"]')?.value,
      phone: form.querySelector<HTMLInputElement>('input[name="phone"]')?.value,
      job: form.querySelector<HTMLInputElement>('input[name="job"]')?.value,
      instagram: form.querySelector<HTMLInputElement>('input[name="instagram"]')?.value || "",
      referral: form.querySelector<HTMLInputElement>('input[name="referral"]')?.value || "",
      marketingConsent: marketingConsent ? "동의" : "미동의",
    }

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbyjnX2RMK1_N2ZX31vqMmNhYORbTa_qcM3K07Ku1BkQls86uNyG3KfSA9oNgSEZCO0/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      trackStandard("CompleteRegistration", { content_name: "독서모임_신청완료" })
      trackStandard("Lead", { content_name: "독서모임_신청완료" })
      trackEvent("apply_complete", { program: "book_club" })
      alert("신청해주셔서 감사합니다.\n\n인터뷰 일정 조율을 위해 링키라운지 카카오톡채널을 통해 연락 드릴게요.\n레이지데이 북클럽에서 곧 만나요.")
      window.location.replace("https://www.instagram.com/lazydaybookclub/")
    } catch {
      alert("전송 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className={styles.application} id="apply">
        <div className={styles.container}>
          <div className={styles.formContainer}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionLabel}>APPLY NOW</div>
              <img
                src="/linky-lounge/book-club/lazyday_typo.png"
                alt="Lazy Day Book Club"
                className={styles.sectionTitleImage}
              />
            </div>

            {/* 일정 공지 */}
            <div className={styles.scheduleNotice}>
              <p className={styles.scheduleNoticeTitle}>[레이지데이 북클럽 2기]</p>
              <div className={styles.scheduleNoticeGrid}>
                {scheduleInfo.map(({ label, time, sub }) => (
                  <div key={label} className={styles.scheduleNoticeItem}>
                    <div className={styles.scheduleNoticeRow}>
                      <span className={styles.scheduleNoticeDay}>{label}</span>
                      <span className={styles.scheduleNoticeTime}>{time}</span>
                    </div>
                    <div className={styles.scheduleNoticeSub}>{sub}</div>
                  </div>
                ))}
              </div>
              <p className={styles.scheduleNoticeNote}>인터뷰 진행 후, 희망 일정을 고려하여 반배정을 진행합니다.</p>
            </div>

            <form className={styles.applicationForm} id="applicationForm" onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>이름 *</label>
                <input type="text" name="name" className={styles.formInput} required placeholder="성함을 기입해주세요." />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>성별 *</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="gender" value="남성" required />
                    <span className={styles.radioText}>남성</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="gender" value="여성" required />
                    <span className={styles.radioText}>여성</span>
                  </label>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>나이 *</label>
                <input
                  type="number"
                  name="age"
                  className={styles.formInput}
                  required
                  placeholder="만 나이를 입력해주세요."
                  min={1}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>전화번호 *</label>
                <input
                  type="tel"
                  name="phone"
                  className={styles.formInput}
                  required
                  placeholder="휴대전화 번호를 입력해주세요."
                  onChange={e => { e.target.value = formatPhone(e.target.value) }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>직업 *</label>
                <input type="text" name="job" className={styles.formInput} required placeholder="직업 또는 하고 있는 일을 간단히 알려주세요" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>인스타그램 아이디 <span className={styles.optionalTag}>(선택)</span></label>
                <input type="text" name="instagram" className={styles.formInput} placeholder="@your_instagram" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>추천인 <span className={styles.optionalTag}>(선택)</span></label>
                <input type="text" name="referral" className={styles.formInput} placeholder="지인 성함 입력 시 10% 할인 적용해드려요." />
              </div>
              <div className={styles.formPrivacySection}>
                <label className={styles.formCheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={e => setMarketingConsent(e.target.checked)}
                  />
                  <span>마케팅 활용 및 개인정보 수집에 동의합니다. <span className={styles.requiredTag}>(필수)</span></span>
                </label>
                <p className={styles.formPrivacyNotice}>
                  수집된 개인정보는 레이지데이 북클럽 운영 및 마케팅 목적으로만 활용되며, 관계 법령에 따라 안전하게 보호됩니다.
                </p>
              </div>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                신청 완료하기
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>신청 중입니다...</p>
          </div>
        </div>
      )}

    </>
  )
}
