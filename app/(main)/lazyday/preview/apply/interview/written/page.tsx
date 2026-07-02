"use client"

import { useState, useEffect, type FormEvent } from "react"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import styles from "../../../../apply/interview/written/page.module.css"
import pstyles from "../../../preview.module.css"
import { PREVIEW } from "../../../preview-config"

const QUESTIONS = [
  {
    id: "q1",
    label: "Q1",
    text: "내가 가장 나다워지는 느긋한 '레이지데이'의 풍경은 무엇인가요?",
    sub: "이른 아침 창가에서 마시는 커피 한 잔, 아무에게도 방해받지 않는 심야의 독서 등 거창하지 않은 일상의 한 장면이어도 좋습니다.",
    placeholder: "떠오르는 장면을 편하게 적어주세요.",
  },
  {
    id: "q2",
    label: "Q2",
    text: "내 가치관을 바꾸었거나 인생의 기준이 되어준 책이나 문장이 있다면 무엇인가요?",
    sub: "삶의 방향을 바꾸어 준 책의 한 구절이나, 힘들 때마다 중심을 잡아주는 문장과 그에 얽힌 짧은 생각을 편하게 들려주세요.",
    placeholder: "기억에 남은 책이나 문장을 적어주세요.",
  },
  {
    id: "q3",
    label: "Q3",
    text: "혼자 책을 읽다 보면 내 생각에 갇히기 쉽습니다. 책이나 타인을 통해 '내가 미처 생각지 못했던 맹점'을 깨달았거나, 사유가 넓어지는 경험이 있다면 무엇이었나요?",
    sub: "내 기존 생각과 전혀 다른 의견을 접하고 신선한 자극을 받았던 순간이나, 책을 읽으며 '내가 틀렸을 수도 있겠구나' 느꼈던 경험을 편하게 적어주시면 됩니다.",
    placeholder: "그때 느낀 점을 떠오르는 대로 적어주세요.",
  },
  {
    id: "q4",
    label: "Q4",
    text: "타인과 대화할 때 가장 중요하게 생각하는 나만의 태도나 원칙은 무엇인가요?",
    sub: "상대방의 이야기를 편견 없이 끝까지 듣는 것, 혹은 적당한 맞장구보다 솔직한 의견을 주고받는 것 등 평소 대화 스타일을 적어주시면 됩니다.",
    placeholder: "내가 지키려는 태도나 원칙을 적어주세요.",
  },
  {
    id: "q5",
    label: "Q5",
    text: "나와 정반대의 성향이나 가치관을 가진 타인을 마주할 때, 평소 어떤 감정이나 시선을 가지시나요?",
    sub: "나와 다른 세계를 들여다보는 것 같아 흥미로움을 느끼거나, 혹은 나와 맞지 않아 조심스러워지는 마음 등 솔직한 태도를 적어주시면 모임 구성에 큰 도움이 됩니다.",
    placeholder: "그때의 솔직한 감정이나 시선을 적어주세요.",
  },
  {
    id: "q6",
    label: "Q6",
    text: "이번 시즌 레이지데이 북클럽을 마무리할 때, 도달하고 싶은 나의 삶의 모습이나 던지고 싶은 화두는 무엇인가요?",
    sub: "마음 맞는 사람들과 깊은 대화를 나누며 일상의 생기를 얻은 모습, 혹은 평소 풀지 못했던 나만의 고민에 대한 실마리를 찾은 모습 등 기대하시는 바를 편하게 적어주세요.",
    placeholder: "기대하는 모습이나 던지고 싶은 화두를 적어주세요.",
  },
]

const INTRO_1 =
  "레이지데이 북클럽은 한 권의 책을 매개로 저마다의 깊이 있는 시선과 일상의 화두를 공유하는 독서모임입니다."
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
              <div className={styles.headerSub}>
                <p>{INTRO_1}</p>
                <p>{INTRO_2}</p>
                <p><strong>{INTRO_3}</strong></p>
              </div>
            </div>

            <div className={styles.refBeigeWrap}>
              <p className={styles.ref0Title}>3기 구성 및 참가비</p>
              <div className={styles.ref0Grid}>
                <span className={styles.ref0Key}>정규모임</span>
                <span className={styles.ref0Val}>1–4회차 · 7월 15일부터 격주, 수·목·일 선택</span>
                <span className={styles.ref0Key}>자유모임</span>
                <span className={styles.ref0Val}>5회차 · 정규 4회 이후 진행</span>
                <span className={styles.ref0Key}>참가비</span>
                <span className={styles.ref0Val}>
                  <s className={styles.priceWas}>{PREVIEW.priceWas}</s>
                  <strong className={styles.priceNow}>{PREVIEW.priceNow}</strong>
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
