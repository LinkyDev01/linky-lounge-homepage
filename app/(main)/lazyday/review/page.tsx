"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { FadeUp } from "@/components/animation/FadeUp"
import styles from "./page.module.css"

const SUBMIT_URL = "/api/lazyday/review"

function FormField({
  label,
  name,
  optional,
  children,
}: {
  label: string
  name: string
  optional?: boolean
  children: ReactNode
}) {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={name} className={styles.formLabel}>
        {label}
        {optional && <span className={styles.optional}>(익명 가능)</span>}
      </label>
      {children}
    </div>
  )
}

export default function ReviewPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const data = new FormData(e.currentTarget)
    const body = {
      name:  data.get("name"),
      q1:    data.get("q1"),
      q2:    data.get("q2"),
      q3:    data.get("q3"),
      q4:    data.get("q4"),
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
          <p className={styles.successEmoji}>🙏</p>
          <h2 className={styles.successTitle}>후기를 남겨주셔서<br />감사해요</h2>
          <p className={styles.successDesc}>소중한 이야기가 다음 멤버들에게<br />닿을 수 있도록 잘 사용할게요.</p>
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
            <FormField label="이름" name="name" optional>
              <input
                id="name"
                type="text"
                name="name"
                className={styles.input}
                placeholder="이름 또는 닉네임 (익명 가능)"
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.12}>
            <FormField label="Q1. 모임에서 가장 기억에 남는 순간이나 대화 한 토막이 있었나요?" name="q1">
              <textarea
                id="q1"
                name="q1"
                className={styles.textarea}
                rows={4}
                placeholder="짧게 한두 문장이면 충분해요."
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.16}>
            <FormField label="Q2. 레이지데이 북클럽, 한 문장으로 표현한다면?" name="q2">
              <textarea
                id="q2"
                name="q2"
                className={styles.textarea}
                rows={3}
                placeholder="떠오르는 대로 자유롭게 적어주세요."
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.20}>
            <FormField label="Q3. 어떤 분께 권하고 싶으세요?" name="q3">
              <textarea
                id="q3"
                name="q3"
                className={styles.textarea}
                rows={3}
                placeholder="어떤 사람에게 잘 맞을 것 같은지 편하게 적어주세요."
              />
            </FormField>
          </FadeUp>

          <FadeUp delay={0.24}>
            <FormField label="Q4. 레이지데이 북클럽 1기 후기를 자유롭게 남겨주세요" name="q4">
              <textarea
                id="q4"
                name="q4"
                className={styles.textarea}
                rows={5}
                placeholder="길든 짧든 편하게 남겨주세요."
              />
            </FormField>
          </FadeUp>

          {error && <p className={styles.formError}>{error}</p>}

          <FadeUp delay={0.28}>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "제출 중..." : "후기 제출하기"}
            </button>
          </FadeUp>
        </form>
      </div>
    </div>
  )
}
