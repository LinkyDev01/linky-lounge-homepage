"use client"

import { useState, useEffect, Fragment, type FormEvent } from "react"
import { trackEvent } from "@/lib/gtag"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import styles from "./page.module.css"

const PH = "이곳에 편안하게 답변을 적어주세요."

const QUESTIONS = [
  {
    id: "q1",
    label: "Q1",
    text: "내가 가장 나다워지는 느긋한 '레이지데이'의 풍경은 무엇인가요?",
    sub: "예시: 이른 아침 창가에서 마시는 커피 한 잔, 아무에게도 방해받지 않는 심야의 독서 등 거창하지 않은 일상의 한 장면이어도 좋습니다.",
    placeholder: PH,
  },
  {
    id: "q2",
    label: "Q2",
    text: "내 가치관을 바꾸었거나 인생의 기준이 되어준 책이나 문장이 있다면 무엇인가요?",
    sub: "예시: 삶의 방향을 바꾸어 준 책의 한 구절이나, 힘들 때마다 중심을 잡아주는 문장과 그에 얽힌 짧은 생각을 편하게 들려주세요.",
    placeholder: PH,
  },
  {
    id: "q3",
    label: "Q3",
    text: "보통 혼자 책을 깊게 읽다 보면 내 생각에 갇히기 쉽습니다. 혹시 최근 책이나 타인을 통해 '내가 미처 생각지 못했던 맹점'을 깨달았거나, 사유가 넓어지는 흥미로운 경험을 하신 적이 있으신가요?",
    sub: "예시: 내 기존 생각과 전혀 다른 의견을 접하고 신선한 자극을 받았던 순간이나, 책을 읽으며 '내가 틀렸을 수도 있겠구나' 느꼈던 경험을 편하게 적어주시면 됩니다.",
    placeholder: PH,
  },
  {
    id: "q4",
    label: "Q4",
    text: "타인과 대화할 때 가장 중요하게 생각하는 나만의 태도나 원칙은 무엇인가요?",
    sub: "예시: 상대방의 이야기를 편견 없이 끝까지 듣는 것, 혹은 적당한 맞장구보다 솔직한 의견을 주고받는 것 등 평소 대화 스타일을 적어주시면 됩니다.",
    placeholder: PH,
  },
  {
    id: "q5",
    label: "Q5",
    text: "나와 정반대의 성향이나 가치관을 가진 타인을 마주할 때, 평소 어떤 감정이나 시선을 가지시나요?",
    sub: "예시: 나와 다른 세계를 들여다보는 것 같아 흥미로움을 느끼거나, 혹은 나와 맞지 않아 조심스러워지는 마음 등 솔직한 태도를 적어주시면 모임 구성에 큰 도움이 됩니다.",
    placeholder: PH,
  },
  {
    id: "q6",
    label: "Q6",
    text: "이번 시즌 레이지데이 북클럽을 마무리할 때, 도달하고 싶은 나의 삶의 모습이나 던지고 싶은 화두는 무엇인가요?",
    sub: "예시: 마음 맞는 사람들과 깊은 대화를 나누며 일상의 생기를 얻은 모습, 혹은 평소 풀지 못했던 나만의 고민에 대한 실마리를 찾은 모습 등 기대하시는 바를 편하게 적어주세요.",
    placeholder: PH,
  },
]

const INTRO_1 =
  "레이지데이 북클럽은 한 권의 책을 매개로 저마다의 깊이 있는 시선과 일상의 화두를 공유하는 독서모임입니다."
const INTRO_2 =
  "아래의 6가지 질문은 다가오는 시즌 동안 함께 머물 대화의 공간을 조금 더 밀도 있게 준비하기 위한 과정입니다. 정답은 없으니, 평소 일상과 서재에서 하던 생각들을 편안하게 들려주세요."

// 페이지별 문항 (1페이지 = 안내/참가비/이름·연락처)
const PAGES: Record<number, string[]> = { 2: ["q1", "q2"], 3: ["q3", "q4"], 4: ["q5", "q6"] }
const LAST_PAGE = 4

export default function WrittenInterviewPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageError, setPageError] = useState("")
  const [warnedPage, setWarnedPage] = useState(0) // 이 페이지에서 미작성 경고를 이미 1회 보여줬으면 다음 클릭에 진행

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("lazyday_applicant")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.name) setName(parsed.name)
        if (parsed.phone) setPhone(parsed.phone)
      }
    } catch {}
  }, [])

  function handleAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function isFilled(id: string) {
    return (answers[id] || "").trim().length > 0
  }

  function missingLabels(pageNum: number) {
    return (PAGES[pageNum] || [])
      .filter((id) => !(answers[id] || "").trim())
      .map((id) => QUESTIONS.find((q) => q.id === id)!.label)
  }

  function goToPage(next: number) {
    setPageError("")
    setWarnedPage(0)
    setCurrentPage(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goNext() {
    // 1페이지: 이름·연락처는 필수
    if (currentPage === 1) {
      if (!name.trim() || !phone.trim()) {
        setPageError("이름과 연락처를 입력해주세요.")
        return
      }
      goToPage(2)
      return
    }
    // 2~4페이지: 미작성은 경고만(비차단) — 경고 1회 후 다시 누르면 진행
    const missing = missingLabels(currentPage)
    if (missing.length && warnedPage !== currentPage) {
      setPageError(`${missing.join(", ")} 답변이 아직 비어 있어요. 비워둔 채 넘어가려면 '다음'을 한 번 더 눌러주세요.`)
      setWarnedPage(currentPage)
      return
    }
    goToPage(Math.min(LAST_PAGE, currentPage + 1))
  }

  function goPrev() {
    goToPage(Math.max(1, currentPage - 1))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (currentPage !== LAST_PAGE) return // Enter 등으로 다른 페이지에서 제출되는 것 방지

    // 마지막 페이지 문항도 미작성 경고만 (비차단)
    const missing = missingLabels(LAST_PAGE)
    if (missing.length && warnedPage !== LAST_PAGE) {
      setPageError(`${missing.join(", ")} 답변이 아직 비어 있어요. 비워둔 채 제출하려면 '제출하기'를 한 번 더 눌러주세요.`)
      setWarnedPage(LAST_PAGE)
      return
    }
    if (!consent) {
      setConsentError("개인정보 수집 및 활용 동의가 필요합니다.")
      document.getElementById("written-consent")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setConsentError("")
    setPageError("")
    setLoading(true)
    try {
      const res = await fetch("/api/lazyday/interview/written", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          answers,
          // 질문 원문도 함께 전송 → 관리자 메일에서 질문+답변 매핑 (페이지 수정 시 메일 자동 반영)
          questions: QUESTIONS.map((q) => ({ id: q.id, label: q.label, text: q.text, sub: q.sub })),
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "오류")
    } catch {}
    trackEvent("written_interview_complete", { program: "book_club" })
    setSubmitted(true)
    window.scrollTo(0, 0)
  }

  function renderQuestions(pageNum: number) {
    const ids = PAGES[pageNum] || []
    return ids.map((id, i) => {
      const q = QUESTIONS.find((qq) => qq.id === id)!
      return (
        <div key={id}>
          <div id={`question-${q.id}`} className={styles.questionGroup}>
            <span className={styles.questionLabel}>{q.label}</span>
            <p className={styles.questionText}>{q.text}</p>
            {q.sub && <p className={styles.questionHint}>{q.sub}</p>}
            <textarea
              name={q.id}
              className={`${styles.textarea} ${isFilled(q.id) ? styles.textareaFilled : ""}`}
              placeholder={q.placeholder}
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
              rows={6}
            />
          </div>
          {i < ids.length - 1 && <div className={styles.divider} />}
        </div>
      )
    })
  }

  if (submitted) {
    return (
      <main className={styles.successPage}>
        <div className={styles.successInner}>
          <BlurReveal duration={1.0} blur={10} fromScale={1.03}>
            <img
              src="/linky-lounge/book-club/ldbc-logo-text.png"
              alt="레이지데이 북클럽"
              className={styles.successMark}
              style={{ width: 417, height: 240, objectFit: "contain" }}
            />
          </BlurReveal>
          <FadeUp><h1 className={styles.successTitle}>답변 감사합니다.</h1></FadeUp>
          <FadeUp>
            <p className={styles.successBody}>
              서면 인터뷰가 완료되었습니다.<br />
              검토 후 <span className={styles.successAccent}>개별 연락</span> 드리겠습니다.
            </p>
          </FadeUp>
          <FadeUp><p className={styles.successCloser}>레이지데이 북클럽에서 곧 만나요.</p></FadeUp>
          <FadeUp>
            <a href="https://www.instagram.com/lazyday_bookclub" target="_blank" rel="noopener noreferrer" className={styles.successLink}>
              인스타그램 보러가기
            </a>
          </FadeUp>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.writtenPage}>
      {loading && <SubmitOverlay label="제출 중..." />}

      <div className={styles.container}>
        {/* 진행 단계 (4단계) */}
        <div className={styles.formProgress} aria-label="서면 인터뷰 진행 단계">
          {[1, 2, 3, 4].map((step, idx) => (
            <Fragment key={step}>
              <div
                className={`${styles.progressNumber} ${currentPage >= step ? styles.progressNumberOn : ""}`}
                aria-current={currentPage === step ? "step" : undefined}
              >
                {currentPage > step ? "✓" : step}
              </div>
              {idx < 3 && (
                <div className={`${styles.progressConnector} ${currentPage > step ? styles.progressConnectorOn : ""}`} />
              )}
            </Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* PAGE 1 — 안내 + 참가비 + 이름/연락처 */}
          <div className={`${styles.formPage} ${currentPage === 1 ? styles.formPageActive : ""}`}>
            <div className={styles.header}>
              <img
                src="/linky-lounge/book-club/ldbc-logo-text.png"
                alt="레이지데이 북클럽"
                className={styles.successMark}
                style={{ width: 417, height: 240, objectFit: "contain" }}
              />
              <h1 className={styles.headerTitle}>서면 인터뷰</h1>
              <div className={styles.headerSub}>
                <p>{INTRO_1}</p>
                <p>{INTRO_2}</p>
              </div>
            </div>

            {/* 3기 구성 및 참가비 */}
            <div className={styles.refBeigeWrap}>
              <p className={styles.ref0Title}>3기 구성 및 참가비</p>
              <div className={styles.ref0Grid}>
                <span className={styles.ref0Key}>정규모임</span>
                <span className={styles.ref0Val}>1–4회차 · 7월 15일부터 격주, 수·목·일 선택</span>
                <span className={styles.ref0Key}>자유모임</span>
                <span className={styles.ref0Val}>5회차 · 정규 4회 이후 진행</span>
                <span className={styles.ref0Key}>참가비</span>
                <span className={styles.ref0Val}>
                  <s className={styles.priceWas}>200,000원</s>
                  <strong className={styles.priceNow}>150,000원</strong>
                  <span className={styles.priceLabel}>3기 한정</span>
                </span>
                <span className={styles.ref0Key}>장소</span>
                <span className={styles.ref0Val}>링키라운지 (사당역 도보 3분)</span>
              </div>
              <p className={styles.ref0Note}>*상황에 따라 장소가 변경될 수 있습니다.</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <label htmlFor="written-name" className={styles.infoLabel}>이름 <span className={styles.req}>*</span></label>
                <input id="written-name" type="text" className={styles.infoInput} placeholder="성함을 입력해주세요." value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className={styles.infoRow}>
                <label htmlFor="written-phone" className={styles.infoLabel}>연락처 <span className={styles.req}>*</span></label>
                <input
                  id="written-phone" type="tel" inputMode="numeric" className={styles.infoInput} placeholder="010-0000-0000" value={phone}
                  onChange={e => {
                    const v = e.target.value.replace(/[^\d]/g, "")
                    const fmt = v.length <= 7 ? v.replace(/(\d{3})(\d{1,4})/, "$1-$2") : v.replace(/(\d{3})(\d{4})(\d{1,4})/, "$1-$2-$3")
                    setPhone(fmt)
                  }}
                />
              </div>
              {(name || phone) && <p className={styles.infoNote}>신청 시 입력하신 정보로 자동 입력되었습니다. 수정 가능합니다.</p>}
            </div>

            {currentPage === 1 && pageError && <p className={styles.pageError}>{pageError}</p>}
            <button type="button" className={`${styles.navNext} ${styles.navNextFull}`} onClick={goNext}>다음</button>
          </div>

          {/* PAGE 2 — Q1, Q2 */}
          <div className={`${styles.formPage} ${currentPage === 2 ? styles.formPageActive : ""}`}>
            {renderQuestions(2)}
            {currentPage === 2 && pageError && <p className={styles.pageError}>{pageError}</p>}
            <div className={styles.navRow}>
              <button type="button" className={styles.navPrev} onClick={goPrev}>이전</button>
              <button type="button" className={styles.navNext} onClick={goNext}>다음</button>
            </div>
          </div>

          {/* PAGE 3 — Q3, Q4 */}
          <div className={`${styles.formPage} ${currentPage === 3 ? styles.formPageActive : ""}`}>
            {renderQuestions(3)}
            {currentPage === 3 && pageError && <p className={styles.pageError}>{pageError}</p>}
            <div className={styles.navRow}>
              <button type="button" className={styles.navPrev} onClick={goPrev}>이전</button>
              <button type="button" className={styles.navNext} onClick={goNext}>다음</button>
            </div>
          </div>

          {/* PAGE 4 — Q5, Q6 + 동의 + 제출 */}
          <div className={`${styles.formPage} ${currentPage === 4 ? styles.formPageActive : ""}`}>
            {renderQuestions(4)}

            <div className={styles.divider} />

            <div id="written-consent" className={styles.consentBox}>
              <label htmlFor="writtenConsent" className={styles.consentLabel}>
                <input
                  id="writtenConsent" type="checkbox" checked={consent}
                  onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setConsentError("") }}
                  className={styles.checkbox}
                />
                <span className={styles.consentText}>
                  마케팅 활용 및 개인정보 수집에 동의합니다.{" "}
                  <span className={styles.requiredTag}>(필수)</span>
                </span>
              </label>
              <p className={styles.consentNote}>수집된 개인정보는 레이지데이 북클럽 운영 및 마케팅 목적으로만 활용되며, 관계 법령에 따라 안전하게 보호됩니다.</p>
              {consentError && <p className={styles.errorText}>{consentError}</p>}
            </div>

            {currentPage === 4 && pageError && <p className={styles.pageError}>{pageError}</p>}
            <div className={styles.navRow}>
              <button type="button" className={styles.navPrev} onClick={goPrev}>이전</button>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? "제출 중..." : "제출하기"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
