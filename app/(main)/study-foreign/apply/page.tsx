"use client"

import { useState, type FormEvent } from "react"
import { trackStandard, trackCustom } from "@/lib/meta-pixel"
import { trackEvent } from "@/lib/gtag"
import styles from "./page.module.css"

export default function StudyForeignApplyPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([])

  function showStep(step: number) {
    setCurrentStep(step)
    trackCustom("form_step_change", { step: step, form: "study_foreign_apply" })
    setTimeout(() => {
      document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function validateStep(step: number): boolean {
    const form = document.getElementById("applicationForm") as HTMLFormElement
    if (!form) return false

    if (step === 1) {
      const name = form.querySelector<HTMLInputElement>('input[name="name"]')
      const gender = form.querySelectorAll<HTMLInputElement>('input[name="gender"]')
      const age = form.querySelector<HTMLInputElement>('input[name="age"]')
      const phone = form.querySelector<HTMLInputElement>('input[name="phone"]')

      if (!name?.value.trim()) { alert("이름을 입력해주세요."); name?.focus(); return false }
      if (!Array.from(gender).some(r => r.checked)) { alert("성별을 선택해주세요."); return false }
      const ageVal = Number(age?.value)
      if (isNaN(ageVal) || ageVal < 19 || ageVal > 39) { alert("만 19세 ~ 39세만 신청이 가능합니다."); age?.focus(); return false }
      if (!phone?.value.trim()) { alert("연락처를 입력해주세요."); phone?.focus(); return false }
    }

    if (step === 2) {
      const lang = form.querySelectorAll<HTMLInputElement>('input[name="language"]')
      if (!Array.from(lang).some(r => r.checked)) { alert("신청 언어를 선택해주세요."); return false }
      if (selectedSchedules.length === 0) { alert("가능한 일정을 선택해주세요."); return false }
    }

    if (step === 3) {
      const qReason = form.querySelector<HTMLTextAreaElement>('textarea[name="q_reason"]')
      const qGoal = form.querySelector<HTMLTextAreaElement>('textarea[name="q_goal"]')
      const qExperience = form.querySelector<HTMLTextAreaElement>('textarea[name="q_experience"]')
      if (!qReason?.value.trim()) { alert("관심을 갖게 된 계기를 입력해주세요."); qReason?.focus(); return false }
      if (!qGoal?.value.trim()) { alert("배워서 해보고 싶은 것을 입력해주세요."); qGoal?.focus(); return false }
      const qLevel = form.querySelectorAll<HTMLInputElement>('input[name="q_level"]')
      if (!Array.from(qLevel).some(r => r.checked)) { alert("현재 회화 수준을 선택해주세요."); return false }
      if (!qExperience?.value.trim()) { alert("신청 언어를 접해본 경험을 입력해주세요."); qExperience?.focus(); return false }
      const privacy = form.querySelector<HTMLInputElement>('input[name="privacy_agree"]')
      const photo = form.querySelector<HTMLInputElement>('input[name="photo_agree"]')
      if (!privacy?.checked || !photo?.checked) { alert("필수 동의 항목을 모두 체크해주세요."); return false }
    }

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
    if (!validateStep(3)) return

    setLoading(true)
    const form = e.currentTarget

    const payload = {
      name: (form.querySelector<HTMLInputElement>('input[name="name"]'))?.value,
      gender: (form.querySelector<HTMLInputElement>('input[name="gender"]:checked'))?.value,
      age: (form.querySelector<HTMLInputElement>('input[name="age"]'))?.value,
      phone: (form.querySelector<HTMLInputElement>('input[name="phone"]'))?.value,
      job: (form.querySelector<HTMLInputElement>('input[name="job"]'))?.value || "",
      instagram: (form.querySelector<HTMLInputElement>('input[name="instagram"]'))?.value || "",
      language: (form.querySelector<HTMLInputElement>('input[name="language"]:checked'))?.value,
      schedule: selectedSchedules,
      q_reason: (form.querySelector<HTMLTextAreaElement>('textarea[name="q_reason"]'))?.value,
      q_goal: (form.querySelector<HTMLTextAreaElement>('textarea[name="q_goal"]'))?.value,
      q_level: Array.from(form.querySelectorAll<HTMLInputElement>('input[name="q_level"]:checked')).map(el => el.value),
      q_experience: (form.querySelector<HTMLTextAreaElement>('textarea[name="q_experience"]'))?.value || "",
      privacy_agree: (form.querySelector<HTMLInputElement>('input[name="privacy_agree"]'))?.checked,
      photo_agree: (form.querySelector<HTMLInputElement>('input[name="photo_agree"]'))?.checked,
    }

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbxsOQmL8F5XYRY1HZLGQowFHpQhqt6MJvpJZu78pNRiZbSp7FZ_FP0iHXrgtJysw-A/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      trackStandard("CompleteRegistration", { content_name: "study_foreign_apply_complete" })
      trackStandard("Lead", { content_name: "study_foreign_apply_complete" })
      trackEvent("apply_complete", { program: "study_foreign", language: payload.language ?? "" })
      alert("신청이 완료되었습니다!")
      window.location.replace("https://buy.tosspayments.com/products/SCBnFcyXiE?shopId=prreBmgHJwPY")
    } catch {
      alert("전송 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const scheduleOptions: Record<string, { label: string; value: string }[]> = {
    "일본어": [
      { label: "월요일 A반 (19:00-20:30)", value: "월요일 A반 (19:00-20:30)" },
      { label: "월요일 B반 (21:00-22:30)", value: "월요일 B반 (21:00-22:30)" },
    ],
    "중국어": [
      { label: "월요일 (20:30-22:00)", value: "월요일 (20:30-22:00)" },
    ],
  }

  return (
    <>
      <section className={styles.application} id="apply">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>APPLY NOW</div>
            <h2 className={styles.sectionTitle}>4월 외국어 회화 클래스 신청</h2>
            <p className={styles.sectionDescription}>
              작성해 주신 내용을 바탕으로 나에게 맞는 클래스를 배정해 드립니다.<br />
              소요 시간: 약 1분
            </p>
          </div>

          {/* Progress Steps */}
          <div className={styles.formProgress}>
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`${styles.progressStep} ${currentStep === step ? styles.active : ""} ${currentStep > step ? styles.completed : ""}`}
              >
                <div className={styles.progressNumber}>{step}</div>
                <div className={styles.progressLabel}>
                  {step === 1 ? "신청자 정보" : step === 2 ? "수강 기초정보" : "반 배정 정보"}
                </div>
              </div>
            ))}
          </div>

          <form className={styles.applicationForm} id="applicationForm" onSubmit={handleSubmit}>
            {/* Step 1 */}
            <div className={`${styles.formStep} ${currentStep === 1 ? styles.active : ""}`}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>이름 *</label>
                <input type="text" name="name" className={styles.formInput} required placeholder="홍길동" />
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
                <label className={styles.formLabel}>나이 (만) *</label>
                <input type="number" name="age" className={styles.formInput} required placeholder="예: 28" min={19} max={35} />
                <div className={styles.formNote}>만 19세 ~ 39세</div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>연락처 *</label>
                <input
                  type="tel"
                  name="phone"
                  className={styles.formInput}
                  required
                  placeholder="010-1234-5678"
                  onChange={e => { e.target.value = formatPhone(e.target.value) }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>직업 (선택)</label>
                <input type="text" name="job" className={styles.formInput} placeholder="예: 마케터, 개발자 등" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Instagram ID (선택)</label>
                <input type="text" name="instagram" className={styles.formInput} placeholder="@your_instagram_id" />
              </div>
              <button
                type="button"
                className={styles.submitButton}
                onClick={() => { if (validateStep(1)) showStep(2) }}
              >
                다음 단계
              </button>
            </div>

            {/* Step 2 */}
            <div className={`${styles.formStep} ${currentStep === 2 ? styles.active : ""}`}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>신청 언어 *</label>
                <div className={styles.radioGroup}>
                  {["일본어", "중국어"].map(lang => (
                    <label key={lang} className={`${styles.radioLabel} ${lang === "일본어" ? styles.radioLabelJa : styles.radioLabelZh}`}>
                      <input
                        type="radio"
                        name="language"
                        value={lang}
                        required
                        onChange={() => { setSelectedLanguage(lang); setSelectedSchedules([]) }}
                      />
                      <span className={styles.radioText}>{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>가능한 일정 (모두 선택) *</label>
                {currentStep === 2 && selectedLanguage ? (
                  <div className={styles.scheduleOptions}>
                    <div className={styles.dayGroup}>
                      <div className={styles.radioGroup}>
                        {(scheduleOptions[selectedLanguage] ?? []).map(({ label, value }) => (
                          <label key={value} className={styles.radioLabel}>
                            <input
                              type="checkbox"
                              name="schedule"
                              value={value}
                              checked={selectedSchedules.includes(value)}
                              onChange={(e) => {
                                setSelectedSchedules(prev =>
                                  e.target.checked ? [...prev, value] : prev.filter(s => s !== value)
                                )
                              }}
                            />
                            <span className={styles.radioText}>{label}</span>
                          </label>
                        ))}
                      </div>
                      <div className={styles.dayLabel}>수업은 4주간 진행됩니다.</div>
                    </div>
                  </div>
                ) : !selectedLanguage ? (
                  <p className={styles.scheduleHint}>일본어 클래스는 월요일, 중국어 클래스는 월요일·화요일에 진행됩니다.</p>
                ) : null}
              </div>
              <div className={styles.formButtons}>
                <button type="button" className={styles.btnPrevious} onClick={() => showStep(1)}>이전</button>
                <button type="button" className={styles.btnNext} onClick={() => { if (validateStep(2)) showStep(3) }}>다음 단계</button>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`${styles.formStep} ${currentStep === 3 ? styles.active : ""}`}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>어떤 계기로 {selectedLanguage || "외국어"} 회화 클래스에 관심을 갖게 되셨나요? *</label>
                <textarea name="q_reason" className={`${styles.formInput} ${styles.textareaResize}`} required placeholder="ex) 여행, 드라마, 업무, 외국인 친구와 소통 등" rows={3} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>딱 한 달 뒤, {selectedLanguage || "외국어"}로 꼭 해내고 싶은 '단 한 가지'가 있다면 무엇인가요? *</label>
                <textarea name="q_goal" className={`${styles.formInput} ${styles.textareaResize}`} required placeholder="ex) 자막 없이 중드 보기, 거래처와 중국어로 미팅하기, 일본인 친구와 스몰토크하기 등" rows={3} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>현재 나의 회화 수준은? (모두 선택)</label>
                <div className={styles.radioGroup} style={{ flexDirection: "column", gap: "8px" }}>
                  {[
                    "아직 아무것도 못 하지만 도전!",
                    "인사, 자기소개 정도",
                    "식당·카페에서 간단한 주문",
                    "천천히 말하면 알아 들을 수 있음",
                    "문장으로 의견을 말할 수 있음",
                  ].map(level => (
                    <label key={level} className={styles.radioLabelCompact}>
                      <input type="checkbox" name="q_level" value={level} />
                      <span className={styles.radioText}>{level}</span>
                    </label>
                  ))}
                  <label className={styles.radioLabelCompact}>
                    <input type="checkbox" name="q_level" value="기타" />
                    <span className={styles.radioText}>기타 (직접 입력)</span>
                  </label>
                </div>
                <div className={styles.formNote}>작성해 주신 내용과 희망 시간대를 바탕으로, 최적의 반을 배정해 드립니다.</div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{selectedLanguage || "신청 언어"}를 접해본 경험은? *</label>
                <textarea name="q_experience" className={`${styles.formInput} ${styles.textareaResize}`} required placeholder="ex) 드라마 정주행, 학원 3개월, 워홀·유학 경험, 학교 수업, 일본인 친구와 대화, HSK 3급 취득, 거래처 소통 등" rows={3} />
              </div>
              <div className={`${styles.formGroup} ${styles.formPrivacySection}`}>
                <label className={styles.formCheckboxLabel}>
                  <input type="checkbox" name="privacy_agree" required />
                  <span>개인정보 수집 및 이용에 동의합니다. *</span>
                </label>
                <label className={styles.formCheckboxLabel}>
                  <input type="checkbox" name="photo_agree" required />
                  <span>함께 나눈 순간을 남기기 위해 촬영을 진행하고 있으며, 촬영물은 링키라운지 인스타그램 또는 홈페이지 광고 등에 활용될 수 있음에 동의합니다. * <br />(공개를 원치 않는 경우, 신청 후 링키라운지 담당자에게 1:1 문의를 남겨주세요.)</span>
                </label>
                <div className={styles.formPrivacyNotice}>
                  신청자 개별 연락 예정<br />
                  <strong>비용: 15만원 (4주, 주 1회)</strong><br />
                  참가자로 선정된 분들은 결제 후 최종 참가 확정되며 조기 마감될 수 있습니다.
                </div>
              </div>
              <div className={styles.formButtons}>
                <button type="button" className={styles.btnPrevious} onClick={() => showStep(2)}>이전</button>
                <button type="submit" className={styles.btnNext}>신청 완료하기</button>
              </div>
            </div>
          </form>
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
              <a href="/lounge/policy?type=study" className={styles.footerLink}>교환환불정책</a>
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
