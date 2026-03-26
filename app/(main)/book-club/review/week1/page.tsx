"use client"

import { useState, type FormEvent } from "react"
import styles from "./page.module.css"

export default function BookClubReviewWeek1Page() {
  const [loading, setLoading] = useState(false)
  const [rating1, setRating1] = useState<number | null>(null)
  const [rating2, setRating2] = useState<number | null>(null)

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto"
    el.style.height = el.scrollHeight + "px"
  }

  function validateForm(): boolean {
    const form = document.getElementById("reviewForm") as HTMLFormElement
    if (!form) return false

    const name = form.querySelector<HTMLInputElement>('input[name="name"]')
    const session = form.querySelectorAll<HTMLInputElement>('input[name="session"]')

    if (!name?.value.trim()) { alert("성함을 입력해주세요."); name?.focus(); return false }
    if (!Array.from(session).some(r => r.checked)) { alert("참여 중인 반을 선택해주세요."); return false }
    if (!rating1) { alert("모임의 분위기 점수를 선택해주세요."); return false }
    if (!rating2) { alert("대화의 깊이 점수를 선택해주세요."); return false }

    const sentence = form.querySelector<HTMLTextAreaElement>('textarea[name="sentence"]')
    if (!sentence?.value.trim()) { alert("가장 머릿속에 남은 문장을 입력해주세요."); sentence?.focus(); return false }

    return true
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    const form = e.currentTarget

    const payload = {
      name: form.querySelector<HTMLInputElement>('input[name="name"]')?.value,
      session: form.querySelector<HTMLInputElement>('input[name="session"]:checked')?.value,
      rating_atmosphere: rating1,
      rating_depth: rating2,
      sentence: form.querySelector<HTMLTextAreaElement>('textarea[name="sentence"]')?.value,
      improvement: form.querySelector<HTMLTextAreaElement>('textarea[name="improvement"]')?.value || "",
    }

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbxtzma2bnrXmR4Y_IW9vyOlUWJNldmkT3FvtofBJZ3nca3U8pUUFBOqt3cZhPsi7cA7/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      alert("후기가 제출되었습니다!\n\n소중한 의견 감사합니다.")
      window.location.replace("/")
    } catch {
      alert("전송 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className={styles.application} id="review">
        <div className={styles.container}>
          <div className={styles.formContainer}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionLabel}>WEEK 01 REVIEW</div>
              <h2 className={styles.sectionTitle}>레이지데이 01</h2>
              <p className={styles.sectionSubtitle}>기록과 여운</p>
            </div>

            <div className={styles.introBox}>
              <p className={styles.introText}>
                레이지데이 북클럽 멤버들과의 첫 번째 만남, 어떠셨나요?<br />
                서로의 문장이 섞여 더욱 풍성했던 오늘의 감각을 짧게 남겨주세요.
              </p>
            </div>

            <form className={styles.applicationForm} id="reviewForm" onSubmit={handleSubmit}>

              {/* 섹션 0: 기본 정보 */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionNumber}>0</span>
                <span className={styles.sectionDividerLabel}>기본 정보</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>성함 *</label>
                <input
                  type="text"
                  name="name"
                  className={styles.formInput}
                  required
                  placeholder="성함을 입력해 주세요."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>참여 중인 반 *</label>
                <div className={styles.radioGroupColumn}>
                  <label className={styles.radioLabelFull}>
                    <input type="radio" name="session" value="1기-목요일 저녁반" required />
                    <span className={styles.radioText}>1기-목요일 저녁반</span>
                  </label>
                  <label className={styles.radioLabelFull}>
                    <input type="radio" name="session" value="1기-일요일 오후반" />
                    <span className={styles.radioText}>1기-일요일 오후반</span>
                  </label>
                </div>
              </div>

              {/* 섹션 1: 평가 */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionNumber}>1</span>
                <span className={styles.sectionDividerLabel}>오늘의 모임</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  1-1. 전반적인 모임의 분위기는 어떠셨나요? *
                </label>
                <p className={styles.ratingHint}>1: 아쉬워요 — 5: 완벽해요!</p>
                <div className={styles.ratingGroup}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.ratingButton} ${rating1 === n ? styles.ratingButtonActive : ""}`}
                      onClick={() => setRating1(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  1-2. 오늘 나눈 대화의 깊이는 만족스러우셨나요? *
                </label>
                <p className={styles.ratingHint}>1: 아쉬워요 — 5: 완벽해요!</p>
                <div className={styles.ratingGroup}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.ratingButton} ${rating2 === n ? styles.ratingButtonActive : ""}`}
                      onClick={() => setRating2(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* 섹션 2 */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionNumber}>2</span>
                <span className={styles.sectionDividerLabel}>오늘의 문장</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  오늘 대화 중 가장 머릿속에 남은 단어나 문장이 있다면 무엇인가요? *
                </label>
                <textarea
                  name="sentence"
                  className={styles.formInput}
                  rows={3}
                  placeholder="가장 좋았던 문장 하나만 살짝 남겨주세요."
                  onInput={e => autoResize(e.currentTarget)}
                />
              </div>

              {/* 섹션 3 */}
              <div className={styles.sectionDivider}>
                <span className={styles.sectionNumber}>3</span>
                <span className={styles.sectionDividerLabel}>개선 의견</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  라운지 이용이나 모임 진행에서 개선되었으면 하는 점이 있나요?{" "}
                  <span className={styles.optionalTag}>(선택)</span>
                </label>
                <textarea
                  name="improvement"
                  className={styles.formInput}
                  rows={4}
                  placeholder="진행 방식, 공간의 온도, 다과 등 사소한 의견도 큰 힘이 됩니다."
                  onInput={e => autoResize(e.currentTarget)}
                />
              </div>

              <div className={styles.closingMessage}>
                함께해 주셔서 감사합니다. 우리 다음 모임에서 더 편안한 모습으로 만나요.
              </div>

              <button type="submit" className={styles.submitButton} disabled={loading}>
                후기 제출하기
              </button>
            </form>
          </div>
        </div>
      </section>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>제출 중입니다...</p>
          </div>
        </div>
      )}

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
