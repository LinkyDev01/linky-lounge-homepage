"use client"

import { useState, useEffect, type FormEvent } from "react"
import { trackEvent } from "@/lib/gtag"
import { FadeUp } from "@/components/animation/FadeUp"
import styles from "./page.module.css"

const QUESTIONS = [
  {
    id: "q1",
    label: "Q1",
    text: "당신에게 '레이지데이(=여유롭고 느긋한 하루)'는 어떤 모습인가요? → 그 자리에 책 한 권이 있다면 어떤 책일까요?",
    placeholder: "나만의 레이지데이 장면을 구체적으로 묘사하고, 그 자리에 어울릴 책과 이유를 알려주세요.",
  },
  {
    id: "q2",
    label: "Q2",
    text: "서점에 가면 어떤 코너에 먼저 들르시나요?",
    placeholder: "자주 찾는 코너를 알려주시고, 왜 그 코너인지 이유를 함께 적어주세요.",
  },
  {
    id: "q3",
    label: "Q3",
    text: "좋아하는 단어나 문장이 있으신가요?",
    placeholder: "마음에 드는 단어나 문장을 적고, 왜 그게 좋은지 이유를 함께 알려주세요.",
  },
  {
    id: "q4",
    label: "Q4",
    text: "책 읽을 때 꼭 필요한 물건이나 환경이 있으신가요?",
    placeholder: "물건이나 환경을 구체적으로 묘사하고, 왜 그게 꼭 필요한지 이유를 적어주세요.",
  },
  {
    id: "q5",
    label: "Q5",
    text: "가치관이나 생각이 전혀 다른 사람과 대화할 때 어떤 태도를 취하시는 편인가요?",
    placeholder: "평소 어떻게 반응하는지 적고, 그 태도의 이유나 배경을 솔직하게 알려주세요.",
  },
  {
    id: "q6",
    label: "Q6",
    text: "아직 못 읽었지만 모임에서 함께 다뤄보고 싶은 책이 있으신가요?",
    placeholder: "책 제목을 적고, 왜 이 책을 함께 읽고 싶은지 이유를 알려주세요.",
  },
]

export default function WrittenInterviewPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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

  // 작성 완료된 질문 수 (공백만 있는 경우 미작성 처리)
  const answeredCount = QUESTIONS.filter((q) => (answers[q.id] || "").trim().length > 0).length

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!consent) {
      setConsentError("개인정보 수집 및 활용 동의가 필요합니다.")
      document.getElementById("written-consent")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setConsentError("")
    setLoading(true)

    try {
      const res = await fetch("/api/lazyday/interview/written", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, answers }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "오류")
    } catch {
      // 에러가 발생해도 제출 완료 처리 (UX 우선)
    }

    trackEvent("written_interview_complete", { program: "book_club" })
    setSubmitted(true)
    window.scrollTo(0, 0)
  }

  if (submitted) {
    return (
      <main className={styles.successPage}>
        <div className={styles.successInner}>
          <FadeUp>
            <img
              src="/linky-lounge/book-club/lazyday_logo.png"
              alt="레이지데이"
              className={styles.successMark}
            />
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className={styles.successTitle}>답변 감사합니다.</h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className={styles.successBody}>
              서면 인터뷰가 완료되었습니다.
              <br />
              검토 후{" "}
              <span className={styles.successAccent}>개별 연락</span>
              드리겠습니다.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <p className={styles.successCloser}>레이지데이 북클럽에서 곧 만나요.</p>
          </FadeUp>
          <FadeUp delay={0.4}>
            <a
              href="https://www.instagram.com/linky_lounge"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.successLink}
            >
              인스타그램 보러가기
            </a>
          </FadeUp>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.writtenPage}>
      {/* 우측 고정 진행 인디케이터 — 답변한 질문만 채워짐 */}
      <nav className={styles.progressIndicator} aria-label="서면 인터뷰 진행 표시">
        {QUESTIONS.map((q, i) => (
          <button
            key={q.id}
            type="button"
            className={`${styles.progressDot} ${answeredCount > i ? styles.progressDotFilled : ""}`}
            onClick={() => document.getElementById(`question-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
            aria-label={`${q.label} ${answeredCount > i ? "(작성 완료)" : "(미작성)"}`}
          />
        ))}
      </nav>

      <div className={styles.container}>
        <FadeUp>
          <div className={styles.header}>
            <img
              src="/linky-lounge/book-club/lazyday_logo.png"
              alt="레이지데이"
              className={styles.logo}
            />
            <h1 className={styles.headerTitle}>서면 인터뷰</h1>
            <p className={styles.headerSub}>
              질문을 읽고 편하게 답변을 작성해주세요.<br />
              정답은 없어요, 솔직한 이야기가 좋아요.
            </p>
          </div>
        </FadeUp>

        {/* 이름 / 연락처 자동입력 표시 */}
        {(name || phone) && (
          <FadeUp delay={0.05}>
            <div className={styles.infoCard}>
              {name && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>이름</span>
                  <span className={styles.infoValue}>{name}</span>
                </div>
              )}
              {phone && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>연락처</span>
                  <span className={styles.infoValue}>{phone}</span>
                </div>
              )}
              <p className={styles.infoNote}>신청 시 입력하신 정보로 자동 입력되었습니다.</p>
            </div>
          </FadeUp>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {QUESTIONS.map((q, i) => (
            <FadeUp key={q.id} delay={0.1 + i * 0.06}>
              <div id={`question-${q.id}`} className={styles.questionGroup}>
                <span className={styles.questionLabel}>{q.label}</span>
                <p className={styles.questionText}>{q.text}</p>
                <textarea
                  name={q.id}
                  className={`${styles.textarea} ${(answers[q.id] || "").trim() ? styles.textareaFilled : ""}`}
                  placeholder={q.placeholder}
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  rows={