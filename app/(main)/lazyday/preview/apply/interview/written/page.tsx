"use client"

import { useState, useEffect, type FormEvent } from "react"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import styles from "../../../../apply/interview/written/page.module.css"
import pstyles from "../../../preview.module.css"
import { PREVIEW } from "../../../preview-config"
import { JourneyStepper } from "../../../JourneyStepper"

const QUESTIONS = [
  {
    id: "q1",
    label: "Q1",
    text: "최근 외부의 속도나 타인의 시선에서 완전히 벗어나 '오롯이 나로서 쉼을 누렸던 순간'은 언제였나요?",
    sub: "",
    placeholder: "떠오르는 생각을 편하게 적어주세요.",
  },
  {
    id: "q2",
    label: "Q2",
    text: "요즘 나의 머릿속을 자주 어지럽히거나, 혹은 마음을 끌어당기는 '나만의 화두나 질문'이 있다면 무엇인가요?",
    sub: "",
    placeholder: "떠오르는 생각을 편하게 적어주세요.",
  },
  {
    id: "q3",
    label: "Q3",
    text: "최근 누군가와의 대화나 책 속에서 “아, 이렇게 바라볼 수도 있구나” 하고 내 생각의 경계가 넓어지거나 선명해졌던 순간이 있다면 전해주실 수 있나요?",
    sub: "",
    placeholder: "떠오르는 생각을 편하게 적어주세요.",
  },
  {
    id: "q4",
    label: "Q4",
    text: "다양한 사람들이 모인 공간에서, 내가 타인의 이야기를 들을 때 가장 중요하게 유지하고 싶은 나만의 태도는 무엇인가요?",
    sub: "",
    placeholder: "떠오르는 생각을 편하게 적어주세요.",
  },
  {
    id: "q5",
    label: "Q5",
    text: "나와 전혀 다른 시각이나 낯선 생각을 가진 사람을 마주했을 때, 내 마음속에 가장 먼저 떠오르는 생각이나 감정은 무엇인가요?",
    sub: "",
    placeholder: "떠오르는 생각을 편하게 적어주세요.",
  },
  {
    id: "q6",
    label: "Q6",
    text: "한 기수의 레이지데이 북클럽을 마치고 집으로 돌아가는 마지막 길, 내 마음에 어떤 잔상이나 기분이 남아있기를 바라시나요?",
    sub: "",
    placeholder: "떠오르는 생각을 편하게 적어주세요.",
  },
]

// INTRO_1 제거 — 실사이트 쌍 동기화 (2026-08-25, 사유는 실사이트 주석 참조)
const INTRO_2 =
  "아래의 6가지 질문은 다가오는 시즌 동안 함께 머물 대화의 공간을 조금 더 밀도 있게 준비하기 위한 과정입니다. 정답은 없으니, 평소 일상과 서재에서 하던 생각들을 편안하게 들려주세요."
// 개선: 부담 완화 장치를 시작 전에 명시
const INTRO_3 =
  "작성에는 보통 10–15분 정도 걸려요. 모든 질문에 답하지 않아도 괜찮으니, 답하고 싶은 질문부터 편하게 적어주세요. 작성 중인 답변은 이 기기에 자동 저장돼요."

const PAGES: Record<number, string[]> = { 2: ["q1"], 3: ["q2"], 4: ["q3"], 5: ["q4"], 6: ["q5"], 7: ["q6"] }
const LAST_PAGE = 7
const QUESTION_PAGES = [2, 3, 4, 5, 6, 7]
const TOTAL_DOTS = 7 // 개선: 정보 입력 포함 7개 (기존: 6개 도트에 7페이지)

const STORAGE_KEY = "lazyday_preview_written_answers"

export default function PreviewWrittenInterviewPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [page1Error, setPage1Error] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [missingList, setMissingList] = useState<string[]>([])
  const [submitError, setSubmitError] = useState(false)
  const [simulateFail, setSimulateFail] = useState(false)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("lazyday_preview_applicant")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.name) setName(parsed.name)
        if (parsed.phone) setPhone(parsed.phone)
      }
    } catch {}
    try {
      const a = localStorage.getItem(STORAGE_KEY)
      if (a) {
        const parsed = JSON.parse(a)
        if (parsed && typeof parsed === "object") setAnswers(parsed)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)) } catch {}
  }, [answers])

  function handleAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function isFilled(id: string) {
    return (answers[id] || "").trim().length > 0
  }

  function allMissingLabels() {
    return QUESTIONS.filter((q) => !isFilled(q.id)).map((q) => q.label)
  }

  function goToPage(next: number) {
    setPage1Error("")
    setConfirmOpen(false)
    setCurrentPage(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goNext() {
    if (currentPage === 1) {
      if (!name.trim() || !phone.trim()) {
        setPage1Error("이름과 연락처를 입력해주세요.")
        return
      }
      goToPage(2)
      return
    }
    goToPage(Math.min(LAST_PAGE, currentPage + 1))
  }

  function goPrev() {
    goToPage(Math.max(1, currentPage - 1))
  }

  function goToFirstMissing() {
    const firstMissing = QUESTIONS.find((q) => !isFilled(q.id))
    setConfirmOpen(false)
    if (!firstMissing) return
    const pageNum = Number(Object.keys(PAGES).find((k) => PAGES[Number(k)].includes(firstMissing.id))) || 2
    setCurrentPage(pageNum)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  /**
   * ── 개선된 제출 처리 ──
   * 기존: 실패해도 catch로 삼키고 무조건 완료 화면 → 답변 유실 위험.
   * 개선: 서버 접수가 확인된 경우에만 완료 처리.
   *  - 실패 시: 답변은 localStorage에 그대로 보존 + 재시도 배너 노출
   *  - 성공 시에만 임시저장 삭제
   */
  async function doSubmit() {
    setConfirmOpen(false)
    setSubmitError(false)
    setLoading(true)

    // ── 목업 제출: 실제 API 호출 없음 ──
    await new Promise((r) => setTimeout(r, 900))

    if (simulateFail) {
      setLoading(false)
      setSubmitError(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    try { localStorage.removeItem(STORAGE_KEY) } catch {} // 성공 시에만 임시저장 정리
    setLoading(false)
    setSubmitted(true)
    window.scrollTo(0, 0)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (currentPage !== LAST_PAGE) return

    const missing = allMissingLabels()
    if (missing.length) {
      setMissingList(missing)
      setConfirmOpen(true)
      return
    }
    doSubmit()
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
              aria-label={q.text}
              className={`${styles.textarea} ${isFilled(q.id) ? styles.textareaFilled : ""}`}
              placeholder={q.placeholder}
              value={answers[q.id] || ""}
              onChange={(e) => {
                handleAnswer(q.id, e.target.value)
                e.target.style.height = "auto"
                e.target.style.height = `${e.target.scrollHeight}px`
              }}
              rows={4}
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
          <FadeUp delay={0.15}><h1 className={styles.successTitle}>답변 감사합니다.</h1></FadeUp>
          <FadeUp delay={0.3}>
            <p className={styles.successBody}>
              서면 인터뷰가 완료되었습니다.<br />
              검토 후 <span className={styles.successAccent}>개별 연락</span> 드리겠습니다.
            </p>
          </FadeUp>
          <FadeUp delay={0.45}><p className={styles.successCloser}>레이지데이 북클럽에서 곧 만나요.</p></FadeUp>
          <FadeUp delay={0.6}>
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
        {/* 개선: 도트 7개 = 정보 입력 + 질문 6개 (기존: 6개 도트에 7페이지라 불일치) */}
        <div className={styles.formProgress} aria-label="서면 인터뷰 진행 상황">
          <div className={styles.progressDots}>
            {Array.from({ length: TOTAL_DOTS }, (_, i) => (
              <span
                key={i}
                aria-current={currentPage - 1 === i ? "step" : undefined}
                className={`${styles.progressDot} ${i < currentPage - 1 ? styles.progressDotDone : ""} ${i === currentPage - 1 ? styles.progressDotActive : ""}`}
              />
            ))}
          </div>
          <p className={styles.progressCaption}>{currentPage === 1 ? "정보 입력" : `질문 ${currentPage - 1} / 6`}</p>
        </div>

        {/* 개선: 제출 실패 시 답변 보존 + 재시도 배너 */}
        {submitError && (
          <div className={pstyles.failBanner} role="alert">
            <p className={pstyles.failBannerTitle}>일시적인 오류로 제출되지 않았어요</p>
            <p className={pstyles.failBannerText}>
              작성하신 답변은 이 기기에 <strong>안전하게 저장되어 있어요.</strong> 잠시 후 아래 버튼으로 다시 제출해주세요.
              계속 실패한다면 인스타그램 DM으로 알려주세요 — 답변은 사라지지 않아요.
            </p>
            <div className={pstyles.failBannerActions}>
              <button type="button" className={pstyles.failRetryBtn} onClick={doSubmit}>
                다시 제출하기
              </button>
              <a
                href="https://www.instagram.com/lazyday_bookclub"
                target="_blank"
                rel="noopener noreferrer"
                className={pstyles.failAltLink}
              >
                인스타그램 DM으로 알리기
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* PAGE 1 — 안내 + 참가비 + 이름/연락처 */}
          <div className={`${styles.formPage} ${currentPage === 1 ? styles.formPageActive : ""}`}>
            <div className={styles.header}>
              <img
                src="/linky-lounge/book-club/ldbc-logo-text.png"
                alt="레이지데이 북클럽"
                style={{ width: 132, height: 76, objectFit: "contain" }}
              />
              <h1 className={styles.headerTitle}>서면 인터뷰</h1>
              <JourneyStepper current={2} interview="서면" />
              <div className={styles.headerSub}>
                <p>{INTRO_2}</p>
                <p><strong>{INTRO_3}</strong></p>
              </div>
            </div>

            {/* 기수 안내 박스 제거 — 실사이트 쌍 동기화 (2026-08-25, 사유는 실사이트 주석 참조) */}

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

            {page1Error && <p className={styles.pageError}>{page1Error}</p>}
            <button type="button" className={`${styles.navNext} ${styles.navNextFull}`} onClick={goNext}>다음</button>
          </div>

          {/* PAGE 2~7 — 질문 한 개씩, 마지막 페이지에 제출 */}
          {QUESTION_PAGES.map((pageNum) => {
            const isLast = pageNum === LAST_PAGE
            return (
              <div key={pageNum} className={`${styles.formPage} ${currentPage === pageNum ? styles.formPageActive : ""}`}>
                {renderQuestions(pageNum)}

                {isLast && confirmOpen && (
                  <div className={styles.confirmBox} role="alert">
                    <p className={styles.confirmTitle}>아직 작성하지 않은 질문이 있어요 ({missingList.join(", ")})</p>
                    <p className={styles.confirmText}>비워두고 제출하셔도 괜찮지만, 더 깊은 대화를 위해 가능하면 채워주시면 좋아요.</p>
                    <div className={styles.confirmActions}>
                      <button type="button" className={styles.confirmBack} onClick={goToFirstMissing}>돌아가서 작성</button>
                      <button type="button" className={styles.confirmGo} onClick={doSubmit}>이대로 제출</button>
                    </div>
                  </div>
                )}

                <div className={styles.navRow}>
                  <button type="button" className={styles.navPrev} onClick={goPrev}>이전</button>
                  {isLast ? (
                    <button type="submit" className={styles.submitButton} disabled={loading}>
                      {loading ? "제출 중..." : "제출하기"}
                    </button>
                  ) : (
                    <button type="button" className={styles.navNext} onClick={goNext}>다음</button>
                  )}
                </div>
              </div>
            )
          })}
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
