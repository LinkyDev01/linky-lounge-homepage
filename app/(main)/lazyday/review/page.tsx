"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import Image from "next/image"
import { FadeUp } from "@/components/animation/FadeUp"
import styles from "./page.module.css"

const SUBMIT_URL = "/api/lazyday/review"

function FormField({
  label,
  name,
  required,
  optional,
  children,
}: {
  label: string
  name: string
  required?: boolean
  optional?: boolean
  children: ReactNode
}) {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={name} className={styles.formLabel}>
        {label}
        {required && <span className={styles.required}> *</span>}
        {optional && <span className={styles.optional}>(선택)</span>}
      </label>
      {children}
    </div>
  )
}

export default function ReviewPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const data = new FormData(e.currentTarget)
    const body = {
      name:      data.get("name"),
      q1:        data.get("q1"),
      q2:        data.get("q2"),
      q3_good:   data.get("q3_good"),
      q3_bad:    data.get("q3_bad"),
      q4:        data.get("q4"),
      q5:        data.get("q5"),
      marketing: marketing ? "동의" : "미동의",
    }

    try {
      await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      setSubmitted(true)
    } catch {
      setError("제출 중 오류가 발생했어요. 다시 시도해 주세요.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successInner}>
          <Image
            src="/linky-lounge/book-club/ldbc-logo-text.png"
            alt="레이지데이 북클럽"
            width={417}
            height={240}
            className={styles.successLogo}
          />
          <h2 className={styles.successTitle}>후기를 남겨주셔서<br />감사해요</h2>
          <p className={styles.successDesc}>소중한 이야기가 다음 멤버들에게<br />닿을 수 있도록 잘 사용할게요.</p>
          <a
            href="https://www.instagram.com/lazyday_bookclub"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.successButton}
          >
            인스타그램 보러가기
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.reviewPage}>
      <div className={styles.container}>
        <FadeUp>
          <div className={styles.header}>
            <h1 className={styles.headerTitle}>
              레이지데이 북클럽<br />
              <span className={styles.headerSeason}>1기 후기</span>
            </h1>
            <p className={styles.headerDesc}>
              함께해주셔서 감사했어요.<br />
              짧게라도 남겨주시면 큰 힘이 돼요.
            </p>
          </div>
        </FadeUp>

        <form onSubmit={handleSubmit} className={styles.form}>

          <FadeUp delay={0.08}>
            <FormField label="이름" name="name">
              <input
                id="name"
                type="text"
                name="name"
                className={styles.input}
                placeholder="익명 가능"
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.12}>
            <FormField label="Q1. 레이지데이 북클럽, 한 문장으로 표현한다면?" name="q1" required>
              <input
                id="q1"
                type="text"
                name="q1"
                required
                className={styles.input}
                placeholder="짧게 떠오르는 대로 적어주세요."
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.16}>
            <FormField label="Q2. 어떤 분께 권하고 싶으세요?" name="q2" optional>
              <input
                id="q2"
                type="text"
                name="q2"
                className={styles.input}
                placeholder="어떤 사람에게 잘 맞을 것 같은지 편하게."
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.20}>
            <FormField label="Q3. 모임에서 마음에 들었던 점이 있다면?" name="q3_good" optional>
              <textarea
                id="q3_good"
                name="q3_good"
                className={styles.textarea}
                rows={3}
                placeholder="좋았던 점, 인상적이었던 점."
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.23}>
            <FormField label="Q4. 아쉬웠던 점이 있다면?" name="q3_bad" optional>
              <textarea
                id="q3_bad"
                name="q3_bad"
                className={styles.textarea}
                rows={3}
                placeholder="솔직하게 남겨주시면 다음 모임에 반영할게요."
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.26}>
            <FormField label="Q5. 모임에서 가장 기억에 남는 순간이나 생각의 발견이 있었다면 공유해주세요." name="q4" optional>
              <textarea
                id="q4"
                name="q4"
                className={styles.textarea}
                rows={4}
                placeholder="어떤 대화, 문장, 순간이든 좋아요."
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.29}>
            <FormField label="Q6. 레이지데이 북클럽 1기 후기를 자유롭게 남겨주세요." name="q5" required>
              <textarea
                id="q5"
                name="q5"
                required
                className={styles.textarea}
                rows={5}
                placeholder="길든 짧든 편하게 남겨주세요."
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.32}>
            <label className={styles.consentLabel}>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.consentText}>
                후기를 마케팅 목적으로 활용하는 것에 동의합니다.
              </span>
            </label>
          </FadeUp>

          {error && <p className={styles.formError}>{error}</p>}

          <FadeUp delay={0.36}>
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? "제출 중..." : "후기 제출하기"}
            </button>
          </FadeUp>

        </form>
      </div>
    </div>
  )
}
