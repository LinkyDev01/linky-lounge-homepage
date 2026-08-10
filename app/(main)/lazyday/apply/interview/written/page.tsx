"use client"

import { useState, useEffect, useRef, type FormEvent } from "react"
import { trackEvent } from "@/lib/gtag"
import { trackCustom } from "@/lib/meta-pixel"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import { SEASON } from "../../../season-config"
import { JourneyStepper } from "../../../JourneyStepper"
import styles from "./page.module.css"

import { KAKAO_CHAT_URL, KAKAO_SUBMIT_GUIDE, KAKAO_SUBMIT_LABEL, reportClientError, copyText } from "../../../support"
import { readSim, simSubmit, type SimMode } from "../../../sim"
import { SimBanner } from "../../../SimBanner"

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

const INTRO_1 =
  "레이지데이 북클럽은 한 권의 책을 매개로 저마다의 깊이 있는 시선과 일상의 화두를 공유하는 독서모임입니다."
const INTRO_2 =
  "아래의 6가지 질문은 다가오는 시즌 동안 함께 머물 대화의 공간을 조금 더 밀도 있게 준비하기 위한 과정입니다. 정답은 없으니, 평소 일상과 서재에서 하던 생각들을 편안하게 들려주세요."

// 페이지별 문항 (1페이지 = 안내/참가비/이름·연락처, 이후 한 페이지당 질문 1개)
const PAGES: Record<number, string[]> = { 2: ["q1"], 3: ["q2"], 4: ["q3"], 5: ["q4"], 6: ["q5"], 7: ["q6"] }
const LAST_PAGE = 7
const QUESTION_PAGES = [2, 3, 4, 5, 6, 7]

// GA4 + Meta Pixel 동시 전송
function track(event: string, params: Record<string, string | number>) {
  trackEvent(event, params)
  trackCustom(event, params)
}

export default function WrittenInterviewPage() {
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
  const [sim, setSim] = useState<SimMode | null>(null)
  useEffect(() => { setSim(readSim()) }, [])
  // 제출이 오래 걸릴 때(응답 지연) 답변을 잃지 않도록 복사 안내를 띄운다 (운영자 지시 2026-08-06)
  const [slowSubmit, setSlowSubmit] = useState(false)
  const [copied, setCopied] = useState(false)
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("lazyday_applicant")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.name) setName(parsed.name)
        if (parsed.phone) setPhone(parsed.phone)
      }
    } catch {}
    // 작성 중이던 답변 복구 (이탈 후 재방문 시 이어쓰기)
    try {
      const a = localStorage.getItem("lazyday_written_answers")
      if (a) {
        const parsed = JSON.parse(a)
        if (parsed && typeof parsed === "object") setAnswers(parsed)
      }
    } catch {}
  }, [])

  // 답변이 바뀔 때마다 localStorage에 임시 저장 (이탈 복구용)
  useEffect(() => {
    try { localStorage.setItem("lazyday_written_answers", JSON.stringify(answers)) } catch {}
  }, [answers])

  function handleAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function isFilled(id: string) {
    return (answers[id] || "").trim().length > 0
  }

  // 페이지 문항 작성 상태 (분석용): 둘 다 작성 complete / 하나 partial / 없음 empty / 1페이지 info
  function pageFillStatus(n: number): "complete" | "partial" | "empty" | "info" {
    const ids = PAGES[n]
    if (!ids) return "info"
    const filled = ids.filter(isFilled).length
    return filled === ids.length ? "complete" : filled === 0 ? "empty" : "partial"
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
      track("written_interview_step", { step: 2, answered: "info" })
      goToPage(2)
      return
    }
    // 2~4: 미작성이어도 자유롭게 이동 (분석 이벤트만 기록)
    track("written_interview_step", { step: currentPage + 1, answered: pageFillStatus(currentPage) })
    goToPage(Math.min(LAST_PAGE, currentPage + 1))
  }

  function goPrev() {
    track("written_interview_step_back", { from: currentPage })
    goToPage(Math.max(1, currentPage - 1))
  }

  // 미작성 질문이 있는 첫 페이지로 이동
  function goToFirstMissing() {
    const firstMissing = QUESTIONS.find((q) => !isFilled(q.id))
    setConfirmOpen(false)
    if (!firstMissing) return
    const pageNum = Number(Object.keys(PAGES).find((k) => PAGES[Number(k)].includes(firstMissing.id))) || 2
    setCurrentPage(pageNum)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  /** 작성 전문(이름·연락처 + 질문/답변)을 한 덩어리 텍스트로 — 전송 실패 시 복사용 */
  function buildTranscript() {
    const head = `[레이지데이 북클럽 서면 인터뷰]\n이름: ${name}\n연락처: ${phone}\n`
    const body = QUESTIONS.map((q) => `\n${q.label}. ${q.text}\n${(answers[q.id] || "").trim() || "(미작성)"}`).join("\n")
    return head + body
  }

  async function copyTranscript() {
    const ok = await copyText(buildTranscript())
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // 서버 접수가 확인된 경우에만 완료 처리한다 (답변 유실 방지).
  // 실패 시 답변은 localStorage에 그대로 남고, 재시도 배너를 보여준다.
  async function doSubmit() {
    setConfirmOpen(false)
    setSubmitError(false)
    setSlowSubmit(false)
    setLoading(true)
    // 10초 넘게 응답이 없으면 '복사해두기' 안내를 먼저 띄운다
    if (slowTimer.current) clearTimeout(slowTimer.current)
    slowTimer.current = setTimeout(() => setSlowSubmit(true), 10_000)
    try {
      if (sim) {
        await simSubmit(sim) // 테스트 모드: 실제 전송 없음
      } else {
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
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) throw new Error(data?.error || "submit failed")
      }
    } catch {
      if (slowTimer.current) clearTimeout(slowTimer.current)
      setLoading(false)
      setSubmitError(true)
      track("written_interview_submit_error", { program: "book_club" })
      reportClientError("written_submit", "서면 인터뷰 제출 실패")
      return
    }
    if (slowTimer.current) clearTimeout(slowTimer.current)
    setSlowSubmit(false)
    setLoading(false)
    track("written_interview_complete", { program: "book_club", missing_count: allMissingLabels().length })
    try { localStorage.removeItem("lazyday_written_answers") } catch {} // 제출 완료 → 임시저장 정리
    setSubmitted(true)
    window.scrollTo(0, 0)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (currentPage !== LAST_PAGE) return // Enter 등으로 다른 페이지에서 제출되는 것 방지
    track("written_interview_step", { step: "submit", answered: pageFillStatus(LAST_PAGE) })

    const missing = allMissingLabels()
    if (missing.length) {
      setMissingList(missing)
      setConfirmOpen(true)
      track("written_interview_submit_confirm", { missing_count: missing.length })
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
                e.target.style.height = "auto" // 내용에 맞춰 자동 확장 (키보드 떴을 때 초기 화면 짧게)
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
        <SimBanner mode={sim} />
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
      <SimBanner mode={sim} />
      {loading && <SubmitOverlay label="제출 중..." />}

      <div className={styles.container}>
        {/* 진행 표시 (점 6개 = 질문 6개, 상단 고정 — 컨테이너 폭 풀커버) */}
        <div className={styles.formProgress} aria-label="서면 인터뷰 진행 상황">
          <div className={styles.progressDots}>
            {QUESTIONS.map((_, i) => (
              <span
                key={i}
                aria-current={currentPage - 2 === i ? "step" : undefined}
                className={`${styles.progressDot} ${i < currentPage - 2 ? styles.progressDotDone : ""} ${i === currentPage - 2 ? styles.progressDotActive : ""}`}
              />
            ))}
          </div>
          <p className={styles.progressCaption}>{currentPage === 1 ? "정보 입력" : `질문 ${currentPage - 1} / 6`}</p>
        </div>

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
                <p>{INTRO_1}</p>
                <p>{INTRO_2}</p>
              </div>
            </div>

            {/* 3기 안내 */}
            <div className={styles.refBeigeWrap}>
              <p className={styles.ref0Title}>{SEASON.name} 안내</p>
              <div className={styles.ref0Grid}>
                <span className={styles.ref0Key}>정규모임</span>
                <span className={styles.ref0Val}>{SEASON.regularNote}</span>
                <span className={styles.ref0Key}>자유모임</span>
                <span className={styles.ref0Val}>{SEASON.freeNote}</span>
                <span className={styles.ref0Key}>장소</span>
                <span className={styles.ref0Val}>{SEASON.location.short}</span>
              </div>
              <p className={styles.ref0Note}>{SEASON.location.note}</p>
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

          {/* PAGE 2~7 — 질문 한 개씩, 마지막 페이지에 동의·제출 */}
          {QUESTION_PAGES.map((pageNum) => {
            const isLast = pageNum === LAST_PAGE
            return (
              <div key={pageNum} className={`${styles.formPage} ${currentPage === pageNum ? styles.formPageActive : ""}`}>
                {renderQuestions(pageNum)}

                {isLast && (
                  <>
                    {(submitError || slowSubmit) && (
                      <div className={styles.failBanner} role="alert">
                        <p className={styles.failTitle}>
                          {submitError ? "일시적인 오류로 제출되지 않았어요" : "제출이 오래 걸리고 있어요"}
                        </p>
                        <p className={styles.failText}>
                          작성하신 답변은 이 기기에 안전하게 저장되어 있어요.
                          {submitError ? " 잠시 후 다시 제출해주세요." : " 잠시만 기다려 주세요."}
                          {" "}{KAKAO_SUBMIT_GUIDE}
                        </p>
                        {/* 답변 전문 복사 — 전송이 끝내 실패해도 내용을 잃지 않도록 (운영자 지시 2026-08-06) */}
                        <button
                          type="button"
                          className={styles.copyAllBtn}
                          onClick={copyTranscript}
                        >
                          {copied ? "복사됐어요" : "작성 내용 전체 복사"}
                        </button>
                        {submitError && (
                          <button
                            type="button"
                            className={styles.confirmGo}
                            style={{ width: "100%" }}
                            onClick={doSubmit}
                            disabled={loading}
                          >
                            다시 제출하기
                          </button>
                        )}
                        <a
                          href={KAKAO_CHAT_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.supportLink}
                          onClick={() => reportClientError("written_kakao", "서면 인터뷰 문의 링크 클릭")}
                        >
                          {KAKAO_SUBMIT_LABEL}
                        </a>
                      </div>
                    )}
                    {confirmOpen && (
                      <div className={styles.confirmBox} role="alert">
                        <p className={styles.confirmTitle}>아직 작성하지 않은 질문이 있어요 ({missingList.join(", ")})</p>
                        <p className={styles.confirmText}>비워두고 제출하셔도 괜찮지만, 더 깊은 대화를 위해 가능하면 채워주시면 좋아요.</p>
                        <div className={styles.confirmActions}>
                          <button type="button" className={styles.confirmBack} onClick={goToFirstMissing}>돌아가서 작성</button>
                          <button type="button" className={styles.confirmGo} onClick={doSubmit}>이대로 제출</button>
                        </div>
                      </div>
                    )}
                  </>
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
      </div>
    </main>
  )
}
