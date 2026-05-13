"use client"

import { useState, useEffect, type FormEvent } from "react"
import { trackEvent } from "@/lib/gtag"
import { FadeUp } from "@/components/animation/FadeUp"
import styles from "./page.module.css"

const QUESTIONS = [
  {
    id: "q1",
    label: "Q1",
    text: "당신에게 '레이지데이(= 여유롭고 느긋한 하루)'는 어떤 모습인가요?",
    sub: "그 자리에 책 한 권이 같이 있다면, 어떤 책일까요?",
    placeholder: "",
  },
  {
    id: "q2",
    label: "Q2",
    text: "한 가지 주제를 오래 붙들어본 적이 있나요?",
    sub: "'개념에 대한 정의', '일', '나 자신' 등 무엇이든 좋아요.",
    placeholder: "",
  },
  {
    id: "q3",
    label: "Q3",
    text: "최근 본인을 가장 오래 흔들었던 작품이 있나요?",
    sub: "책·영화·음악·전시·콘텐츠 등에 대해 어떤 부분에서 오래 남았는지, 그게 본인의 어떤 부분과 닿았는지 말씀해주세요.",
    placeholder: "",
  },
  {
    id: "q4",
    label: "Q4",
    text: "'다들 이렇게 받아들이는데 나는 좀 다르게 본다' 싶은 개념이나 통념이 있나요?",
    sub: "'타인에게 기대한다는 것', '카르마', '노력은 배신하지 않는다'는 통념 등 주제를 자유롭게 꺼내고 이유를 들려주세요.",
    placeholder: "",
  },
  {
    id: "q5",
    label: "Q5",
    text: "본인의 기준·가치관과 어긋났지만 매력적이었던 메시지나 사람이 있었나요?",
    sub: "또는 반대로 마음이 안 따라준 경험도 좋습니다. 그 무의식적 끌림·거부감이 이성과 마찰을 일으킨 이유는 무엇이었나요?",
    placeholder: "",
  },
  {
    id: "q6",
    label: "Q6",
    text: "행복 · 사랑 · 관계 · 성장 · 예술 · 철학",
    sub: "이 여섯 가지 주제 중 하나를 골라, 모임에 던지고 싶은 질문 하나와 그 이유를 적어주세요.",
    placeholder: "Q6에 작성하신 질문은 레이지데이의 시선으로 고민해볼게요. 추후 안내 시 저희의 답변도 함께 전해드릴게요.",
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
              src="/linky-lounge/book-club/ldbc-logo-text.png"
              alt="레이지데이 북클럽"
              className={styles.successMark}
              style={{ width: 417, height: 240, objectFit: "contain" }}
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
              src="/linky-lounge/book-club/ldbc-logo-text.png"
              alt="레이지데이 북클럽"
              className={styles.successMark}
              style={{ width: 417, height: 240, objectFit: "contain" }}
            />
            <h1 className={styles.headerTitle}>서면 인터뷰</h1>
            <div className={styles.headerSub}>
              <p>심사 자리 아니에요. 정답도 없고요. 본인 식으로, 떠오르는 대로 적어주시면 됩니다.</p>
              <p>한 질문당 3~5문장 정도. 전체 20~30분 정도 걸려요.</p>
              <p>답이 잘 안 떠오르는 질문은 "패스"라고 적으셔도 괜찮아요. 그것도 결의 한 단서가 됩니다.</p>
              <p className={styles.headerSubNote}>✱ 저희가 보는 '결'이 궁금하시면 페이지 하단 (참고) 섹션을 잠깐 훑어보셔도 좋아요.</p>
            </div>
          </div>
        </FadeUp>

        {/* 이름 / 연락처 */}
        <FadeUp delay={0.05}>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <label htmlFor="written-name" className={styles.infoLabel}>이름 <span className={styles.req}>*</span></label>
              <input
                id="written-name"
                type="text"
                className={styles.infoInput}
                placeholder="성함을 입력해주세요."
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className={styles.infoRow}>
              <label htmlFor="written-phone" className={styles.infoLabel}>연락처 <span className={styles.req}>*</span></label>
              <input
                id="written-phone"
                type="tel"
                inputMode="numeric"
                className={styles.infoInput}
                placeholder="010-0000-0000"
                value={phone}
                onChange={e => {
                  const v = e.target.value.replace(/[^\d]/g, "")
                  const fmt = v.length <= 7
                    ? v.replace(/(\d{3})(\d{1,4})/, "$1-$2")
                    : v.replace(/(\d{3})(\d{4})(\d{1,4})/, "$1-$2-$3")
                  setPhone(fmt)
                }}
              />
            </div>
            {(name || phone) && <p className={styles.infoNote}>신청 시 입력하신 정보로 자동 입력되었습니다. 수정 가능합니다.</p>}
          </div>
        </FadeUp>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {QUESTIONS.map((q, i) => (
            <FadeUp key={q.id} delay={0.1 + i * 0.06}>
              <div id={`question-${q.id}`} className={styles.questionGroup}>
                <span className={styles.questionLabel}>{q.label}</span>
                <p className={styles.questionText}>{q.text}</p>
                {q.sub && <p className={styles.questionSub}>{q.sub}</p>}
                <textarea
                  name={q.id}
                  className={`${styles.textarea} ${(answers[q.id] || "").trim() ? styles.textareaFilled : ""}`}
                  placeholder={q.placeholder}
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  rows={6}
                />
              </div>
              {i < QUESTIONS.length - 1 && <div className={styles.divider} />}
            </FadeUp>
          ))}

          {/* (참고) 접이식 섹션 */}
          <FadeUp delay={0.5}>
            <div className={styles.referenceSection}>
              <details className={styles.referenceDetails}>
                <summary className={styles.referenceSummary}>(참고) 저희가 보는 결</summary>
                <div className={styles.referenceBody}>
                  <p>사람마다 살아온 환경·경험으로 몸에 밴, 무의식적인 판단·반응의 패턴이에요.</p>
                  <p>같이 영화 보고 나왔는데 누구는 주인공의 마지막 대사를 곱씹고 누구는 카메라가 멈춘 풍경을 얘기하잖아요. 무거운 얘기가 나왔을 때 농담으로 풀어주는 사람이 있고 같이 침묵해주는 사람이 있고요. 그런 미세한 반응의 패턴 — 그게 결이에요.</p>
                  <p>부르디외라는 사회학자가 아비투스(habitus)라는 개념을 썼는데, 사회적 자본·문화적 자본을 바탕으로 한 무의식적인 판단 시스템이에요. 저희가 '결이 맞다'고 할 때는 두 사람의 아비투스가 어긋나지 않고 맞물려 움직이는 상태를 가리켜요.</p>
                  <p>친밀함이나 익숙함과는 좀 달라요. 처음 본 사이여도 결이 맞으면 통하고, 친한 사이여도 결이 다르면 어색하거든요. 굳이 설명하지 않아도 문장 사이의 맥락이 읽히는, 그런 종류의 편안함이에요.</p>
                </div>
              </details>
              <details className={styles.referenceDetails}>
                <summary className={styles.referenceSummary}>(참고) 불균형의 균형 (Dissonance in Harmony)</summary>
                <div className={styles.referenceBody}>
                  <p>비슷한 결을 가진 사람들이 모였다고 해서 같은 결론에 도달할 필요는 없거든요. 같은 곳에서 멈추는 사람들이라도 거기서 자라난 사유의 궤적은 각자 다르니까요.</p>
                  <p>바우하우스의 정갈한 비대칭처럼 — 각기 다른 궤적을 그려온 사람들의 단련된 사유가 거칠게 부딪힐 때 그 불협화음이 오히려 고전의 본질을 꿰뚫는 하나의 선율이 되는 순간이 있어요.</p>
                  <p>다 같이 고개 끄덕이는 무색무취한 공감 말고, 텍스트 너머의 날 선 논쟁을 기꺼이 즐기는 자리 — 그 부조화 속에서 이전에 없던 지적 조화를 발견하는 자리. 그게 레이지데이가 만들고 싶은 결이에요.</p>
                </div>
              </details>
            </div>
          </FadeUp>

          <FadeUp delay={0.55}>
            <div id="written-consent" className={styles.consentBox}>
              <label htmlFor="writtenConsent" className={styles.consentLabel}>
                <input
                  id="writtenConsent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked)
                    if (e.target.checked) setConsentError("")
                  }}
                  className={styles.checkbox}
                />
                <span className={styles.consentText}>
                  마케팅 활용 및 개인정보 수집에 동의합니다.{" "}
                  <span className={styles.requiredTag}>(필수)</span>
                </span>
              </label>
              <p className={styles.consentNote}>
                수집된 개인정보는 레이지데이 북클럽 운영 및 마케팅 목적으로만 활용되며, 관계 법령에 따라 안전하게 보호됩니다.
              </p>
              {consentError && <p className={styles.errorText}>{consentError}</p>}
            </div>
          </FadeUp>

          <FadeUp delay={0.6}>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "제출 중..." : "서면 인터뷰 제출하기"}
            </button>
          </FadeUp>
        </form>
      </div>
    </main>
  )
}
