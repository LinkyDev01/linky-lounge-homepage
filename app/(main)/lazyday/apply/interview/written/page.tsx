"use client"

import { useState, useEffect, type FormEvent } from "react"
import { trackEvent } from "@/lib/gtag"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import styles from "./page.module.css"

const QUESTIONS = [
  {
    id: "q1",
    label: "Q1",
    text: "당신에게 '레이지데이(= 여유롭고 느긋한 하루)'는 어떤 모습인가요?",
    sub: "그 자리에 책 한 권이 같이 있다면, 어떤 책일까요?",
    placeholder: "어울리는 책과 함께 나만의 레이지데이를 묘사해주세요. 레이지데이가 당신에게 선사하는 것이 있다면 함께 들려주세요.",
  },
  {
    id: "q2",
    label: "Q2",
    text: "한 가지 주제를 오래 붙들어본 적이 있나요?",
    sub: "'추상적 개념', '일', '나 자신' 등 무엇이든 좋아요.",
    placeholder: "어떤 주제였는지, 그 주제를 오래 붙들고 있던 이유와 함께, 그것에 의해 바뀐 태도나 행동이 있는 부분이 있다면 공유해주세요.",
  },
  {
    id: "q3",
    label: "Q3",
    text: "최근 본인을 가장 오래 흔들었던 작품이 있나요?",
    sub: "책·영화·음악·전시·콘텐츠 등에 대해 어떤 부분에서 오래 남았는지, 그게 본인의 어떤 부분과 닿았는지 말씀해주세요.",
    placeholder: "어떤 장면이나 메시지가 오래 남았는지, 본인의 어떤 면과 닿았는지 적어주세요.",
  },
  {
    id: "q4",
    label: "Q4",
    text: "'다들 이렇게 받아들이는데 나는 좀 다르게 본다' 싶은 개념이나 통념이 있나요?",
    sub: "'타인에게 기대한다는 것', '카르마', '노력은 배신하지 않는다'는 통념 등 주제를 자유롭게 꺼내고 이유를 들려주세요.",
    placeholder: "어떤 개념·통념인지, 왜 다르게 보게 됐는지 자유롭게 풀어주세요.",
  },
  {
    id: "q5",
    label: "Q5",
    text: "본인의 기준·가치관과 어긋났지만 매력적이었던 메시지나 사람이 있었나요?",
    sub: "또는 반대로 마음이 안 따라준 경험도 좋습니다. 그 무의식적 끌림·거부감이 이성과 마찰을 일으킨 이유는 무엇이었나요?",
    placeholder: "어떤 메시지나 사람이었는지, 그 끌림이나 거부감의 이유를 적어주세요.",
  },
  {
    id: "q6",
    label: "Q6",
    text: "행복 · 사랑 · 관계 · 성장 · 예술 · 철학",
    sub: "이 여섯 가지 주제 중 하나를 골라, 모임에 던지고 싶은 질문 하나와 그 이유를 적어주세요.",
    placeholder: "적어주신 질문은 레이지데이의 시선으로 함께 고민해볼게요. 추후 안내 시 저희의 답변도 함께 전해드릴게요.",
  },
]

function scrollToRef() {
  document.getElementById("reference-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export default function WrittenInterviewPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ref1Open, setRef1Open] = useState(false)
  const [ref2Open, setRef2Open] = useState(false)

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
    } catch {}
    trackEvent("written_interview_complete", { program: "book_club" })
    setSubmitted(true)
    window.scrollTo(0, 0)
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
      {/* 우측 진행 인디케이터 — 질문별 개별 매핑 */}
      <nav className={styles.progressIndicator} aria-label="서면 인터뷰 진행 표시">
        {QUESTIONS.map((q) => (
          <button
            key={q.id}
            type="button"
            className={`${styles.progressDot} ${isFilled(q.id) ? styles.progressDotFilled : ""}`}
            onClick={() => document.getElementById(`question-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
            aria-label={`${q.label} ${isFilled(q.id) ? "(작성 완료)" : "(미작성)"}`}
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
              <p><span className={styles.accent}>결</span>이 맞는 사람과의 대화를 위한 레이지데이 북클럽의 서면 인터뷰 세션입니다. 떠오르는 대로, 작성하고 싶은 만큼 이야기를 들려주세요.</p>
              <p className={styles.headerSubNote}>
                ✱ 레이지데이가 보는 '결'이 궁금하시면{" "}
                <button type="button" onClick={scrollToRef} className={styles.refLink}>
                  페이지 하단 (참고) 섹션
                </button>
                을 잠깐 훑어보셔도 좋아요.
              </p>
            </div>
          </div>
        </FadeUp>

        <FadeUp>
        {/* 3기 구성 및 참가비 */}
          <div className={styles.refBeigeWrap}>
            <p className={styles.ref0Title}>3기 구성 및 참가비</p>
            <div className={styles.ref0Grid}>
              <span className={styles.ref0Key}>정규모임</span>
              <span className={styles.ref0Val}>1–4회차 · 7월 15일부터 격주, 수·목·일 선택</span>
              <span className={styles.ref0Key}>자유모임</span>
              <span className={styles.ref0Val}>5회차 · 정규 4회 이후 추가</span>
              <span className={styles.ref0Key}>장소</span>
              <span className={styles.ref0Val}>사당역 부근</span>
              <span className={styles.ref0Key}>참가비</span>
              <span className={styles.ref0Val}><strong>150,000원</strong> (인터뷰 후 결제 안내)</span>
            </div>
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
        </FadeUp>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {QUESTIONS.map((q, i) => (
            <FadeUp key={q.id}>
              <div id={`question-${q.id}`} className={styles.questionGroup}>
                <span className={styles.questionLabel}>{q.label}</span>
                <p className={styles.questionText}>{q.text}</p>
                {q.sub && <p className={styles.questionSub}>{q.sub}</p>}
                <textarea
                  name={q.id}
                  className={`${styles.textarea} ${isFilled(q.id) ? styles.textareaFilled : ""}`}
                  placeholder={q.placeholder}
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  rows={6}
                />
              </div>
              {i < QUESTIONS.length - 1 && <div className={styles.divider} />}
            </FadeUp>
          ))}

          {/* (참고) 섹션 — FAQ 서식 동일 */}
          <FadeUp>
            <div id="reference-section" className={styles.referenceSection}>

              {/* 참고 1: 결 */}
              <div className={styles.refItem}>
                <button type="button" className={styles.refTitleBox} onClick={() => setRef1Open(v => !v)} aria-expanded={ref1Open}>
                  <span className={styles.refQuestion}>(참고) 레이지데이가 보는 '결'</span>
                  <span className={`${styles.refArrow} ${ref1Open ? styles.refArrowOpen : ""}`}>▾</span>
                </button>
                <div
                  className={`${styles.refPeekWrap} ${ref1Open ? styles.refPeekOpen : ""}`}
                  onClick={() => setRef1Open(v => !v)}
                  role="button"
                  aria-expanded={ref1Open}
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && setRef1Open(v => !v)}
                >
                  <div className={styles.refQuote}>
                    <p className={styles.refAnswer}>저희가 정의 내린 결은, 사람마다 살아온 환경·경험으로 몸에 밴, 무의식적인 판단·반응의 패턴이에요. 한 줄로 정리하면 <strong className={styles.refStrong}>결 = 한 사람의 아비투스</strong>입니다.</p>
                    <p className={styles.refFootnote}>* 아비투스(Habitus) : 부르디외라는 사회학자가 쓴 개념. 의식하지 않고 저절로 작동하는 감각·반응·선택의 패턴. "왜 이게 좋지? 왜 저건 거슬리지?"의 답이 이미 몸 안에 있는 상태.</p>
                    <p className={styles.refAnswer}>아비투스는 그 사람이 쌓아온 것들이 담기는 그릇이지만, 그것들이 작동하는 방식까지 포함합니다. 즉 책·경험·말투 같은 쌓인 문화자본만이 아니라, 그 사람의 기질·리듬·감도까지 함께 품는 더 큰 개념이에요.</p>
                    <p className={styles.refAnswer}>결국 "결이 맞다"는 두 사람의 아비투스가 어긋나지 않고 맞물려 움직이는 상태예요. 단순히 취향이 비슷하다는 게 아니에요.</p>
                    <p className={styles.refAnswer}>한 사람이 어떤 문장 앞에서 한참 멈춰 있을 때 다른 사람이 그 멈춤을 같이 견디는 것. 한 사람이 풀어내려 한 생각을 다른 사람이 자기 언어로 이어받는 것. 같은 자리에서 누가 말하고 누가 침묵할지가 자연스럽게 정해지는 것. 이게 두 사람의 결이 맞물려 움직이는 모습이에요.</p>
                    <p className={styles.refAnswer}>결이 맞으면 자연스럽게 따라오는 게 있어요. 굳이 설명하지 않아도 맥락이 읽히는 편안함. 친밀함이나 익숙함과는 좀 다른 편안함이에요. 처음 본 사이여도 결이 맞으면 그 편안함이 생기고, 오래 본 사이여도 결이 다르면 안 생기거든요.</p>
                    <p className={styles.refAnswer}>정리하면, 결이 맞는다는 건 두 사람의 아비투스가 공명한다는 뜻이에요.</p>
                  </div>
                  {!ref1Open && (
                    <div className={styles.refFadeWrap}>
                      <div className={styles.refFadeBg} />
                      <span className={styles.refMoreHint}>...더보기</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 참고 2: 불균형의 균형 */}
              <div className={styles.refItem}>
                <button type="button" className={styles.refTitleBox} onClick={() => setRef2Open(v => !v)} aria-expanded={ref2Open}>
                  <span className={styles.refQuestion}>(참고) 불균형의 균형 (Dissonance in Harmony)</span>
                  <span className={`${styles.refArrow} ${ref2Open ? styles.refArrowOpen : ""}`}>▾</span>
                </button>
                <div
                  className={`${styles.refPeekWrap} ${ref2Open ? styles.refPeekOpen : ""}`}
                  onClick={() => setRef2Open(v => !v)}
                  role="button"
                  aria-expanded={ref2Open}
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && setRef2Open(v => !v)}
                >
                  <div className={styles.refQuote}>
                    <p className={styles.refAnswer}>비슷한 결을 가진 사람들이 모였다고 해서 같은 결론에 도달할 필요는 없거든요. 같은 곳에서 멈추는 사람들이라도 거기서 자라난 사유의 궤적은 각자 다르니까요.</p>
                    <p className={styles.refAnswer}>바우하우스의 정갈한 비대칭처럼, 각기 다른 궤적을 그려온 사람들의 단련된 사유가 거칠게 부딪힐 때 그 불협화음이 오히려 고전의 본질을 꿰뚫는 하나의 선율이 되는 순간이 있어요.</p>
                    <p className={styles.refAnswer}>다 같이 고개 끄덕이는 무색무취한 공감 말고, 각자의 뚜렷한 철학을 바탕으로 사유의 밀도를 높일 수 있는 자리, 그 부조화 속에서 이전에 없던 지적 조화를 발견하는 자리. 그게 레이지데이가 만들고 싶은 자리예요.</p>
                  </div>
                  {!ref2Open && (
                    <div className={styles.refFadeWrap}>
                      <div className={styles.refFadeBg} />
                      <span className={styles.refMoreHint}>...더보기</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </FadeUp>

          <FadeUp>
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

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "제출 중..." : "서면 인터뷰 제출하기"}
            </button>
          </FadeUp>
        </form>
      </div>
    </main>
  )
}
