"use client"

import { useState, type FormEvent } from "react"
import { trackStandard } from "@/lib/meta-pixel"
import { trackEvent } from "@/lib/gtag"
import styles from "./page.module.css"

export default function BookClubApplyPage() {
  const [loading, setLoading] = useState(false)

  const scheduleInfo = [
    {
      label: "목요일 저녁반",
      time: "19:30 – 22:30",
      dates: "3/26, 4/9, 4/23, 5/7",
    },
    {
      label: "일요일 오후반",
      time: "14:30 – 17:30",
      dates: "3/29, 4/12, 4/26, 5/10",
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

    const reason = form.querySelector<HTMLInputElement>('input[name="reason"]')
    if (!reason?.value.trim()) { alert("레이지데이 북클럽에 끌린 한줄을 입력해주세요."); reason?.focus(); return false }

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
      reason: form.querySelector<HTMLInputElement>('input[name="reason"]')?.value,
      instagram: form.querySelector<HTMLInputElement>('input[name="instagram"]')?.value || "",
    }

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbzUNpmrpiD5xejebLoD2v9Y7oCmzff6qZSXLH-ZB_W62722do20pLEJvEcNY1ciS18/exec",
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
      alert("신청이 완료되었습니다!\n\n운영진 검토 후 개별 연락드리겠습니다.")
      window.location.replace("/")
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
              <h2 className={styles.sectionTitle}>Lazy Day Book Club</h2>
            </div>

            {/* 일정 공지 */}
            <div className={styles.scheduleNotice}>
              <p className={styles.scheduleNoticeTitle}>[레이지데이 북클럽]</p>
              <div className={styles.scheduleNoticeGrid}>
                {scheduleInfo.map(({ label, time, dates }) => (
                  <div key={label} className={styles.scheduleNoticeItem}>
                    <span className={styles.scheduleNoticeDay}>{label}</span>
                    <span className={styles.scheduleNoticeTime}>{time}</span>
                    <span className={styles.scheduleNoticeDates}>{dates}</span>
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
                <label className={styles.formLabel}>레이지데이 북클럽에 끌린 이유 한줄 *</label>
                <input type="text" name="reason" className={styles.formInput} required placeholder="북클럽에 끌린 이유를 한 줄로 적어주세요." />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>인스타그램 아이디 <span className={styles.optionalTag}>(선택)</span></label>
                <input type="text" name="instagram" className={styles.formInput} placeholder="@your_instagram" />
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

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div>
              <div className={styles.footerLogo}>LINKY LOUNGE</div>
              <div className={styles.footerInfo}>
                <p>주식회사 링키</p>
                <p>대표 : 안동민 | 개인정보관리책임자 : 안동민</p>
                <p>사업자등록번호 : 557-81-03588</p>
                <p>이메일 : linkylounge@gmail.com | 대표번호 : 010-7444-5790</p>
                <p>주소: 경기도 남양주시 별내3로 322, 404호</p>
              </div>
            </div>
            <div className={styles.footerLinks}>
              <a href="https://www.instagram.com/linky_lounge/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Instagram</a>
              <a href="https://naver.me/F4LgLoQx" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>오시는 길</a>
              <a href="https://www.instagram.com/linky_lounge/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>문의하기</a>
              <a href="/policy?type=bookclub" className={styles.footerLink}>교환환불정책</a>
            </div>
          </div>
          <p className={styles.footerCopyright}>
            &copy; 2025 Linky Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  )
}
