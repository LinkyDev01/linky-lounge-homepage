"use client"

/**
 * 모임 기획서 접수란 (2026-09-03 초안).
 *
 * 서식은 레이지클럽 폼 문법(meetings/[slug]/apply/MeetingApplyForm) — 값은 hosts.module.css 에
 * 자체 선언(§9 미임포트). 여정 규율도 같다:
 *   ① 제출 중 전면 로더(중복 제출 차단) ② 성공 판정은 `res.ok && result.success`
 *   ③ 실패 시 입력값 유지 + 원문 복사 + 카카오톡 채널 구제 ④ 완료 화면은 새로고침에도 유지
 *
 * **항목 설계 (운영자 "포트폴리오 업로드냐 메일이냐 완전 자유냐" 고민에 대한 초안의 선택)**:
 *   자유 서술 한 칸(기획)이 중심이고, 협의를 준비하는 데 꼭 필요한 사실 3개(한 줄 제목·형식·
 *   가능한 시기)만 따로 받는다. **파일 업로드는 받지 않고 링크 칸만 둔다** — 파일은 스토리지·
 *   파기 대상·방침 항목이 늘고 시트(GAS)에 실리지 않는다. 링크면 지원자가 자기 자료를 자기
 *   자리에 두고 우리는 주소만 보관한다(프로필 사진 URL 만 담는 0014 와 같은 판단).
 *   메일 접수는 원장에 남지 않아 CRM 밖이 되므로 쓰지 않는다.
 *
 * payload 계약 (GAS handleHost 와 값 집합 일치): type:"host" / name / phone / title / format /
 *   plan / intro / links / availability / consentAt. 마케팅 동의는 받지 않는다(모임장 접수에 무관).
 */

import { useEffect, useState } from "react"
import {
  copyText,
  KAKAO_CHAT_URL,
  KAKAO_SUBMIT_GUIDE,
  KAKAO_SUBMIT_LABEL,
  reportClientError,
} from "@/app/(main)/lazyday/support"
import { TurtleLoader } from "../TurtleLoader"
import h from "./hosts.module.css"

const FORMATS = ["원데이 토크", "4주 과정", "기수제", "아직 정하지 않음"] as const
const DONE_KEY = "lzc-host-applied"

function formatPhone(value: string) {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function HostForm() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [format, setFormat] = useState<string | null>(null)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [failedText, setFailedText] = useState("")
  const [failCopied, setFailCopied] = useState(false)

  const clearError = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p))

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DONE_KEY)) setDone(true)
    } catch {}
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    const data = new FormData(e.currentTarget)
    const v = (k: string) => ((data.get(k) as string) ?? "").trim()
    const name = v("name")
    const phone = v("phone")
    const title = v("title")
    const plan = v("plan")
    const intro = v("intro")
    const links = v("links")
    const availability = v("availability")

    const next: Record<string, string> = {}
    if (!name) next.name = "이름을 입력해 주세요."
    if (!phone) next.phone = "연락처를 입력해 주세요."
    if (!title) next.title = "모임을 한 줄로 적어 주세요."
    if (!format) next.format = "형식을 골라 주세요."
    if (!plan) next.plan = "기획을 적어 주세요."
    if (!intro) next.intro = "소개를 적어 주세요."
    if (!privacyConsent) next.privacyConsent = "개인정보 수집·이용 동의가 필요합니다."
    if (Object.keys(next).length) {
      setErrors(next)
      const first = Object.keys(next)[0]
      const el =
        first === "privacyConsent"
          ? document.getElementById("privacyConsent")
          : first === "format"
            ? document.getElementById("format-choices")
            : document.querySelector(`[name="${first}"]`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setErrors({})
    setLoading(true)
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 25_000)
    let timedOut = false
    try {
      const res = await fetch("/api/lazyday/apply", {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "host",
          name,
          phone,
          title,
          format,
          plan,
          intro,
          links,
          availability,
          consentAt: new Date().toISOString(),
        }),
      })
      const result = await res.json().catch(() => null)
      if (!res.ok || !result?.success) throw new Error("submit failed")
    } catch (err) {
      timedOut = err instanceof DOMException && err.name === "AbortError"
      setLoading(false)
      setFailedText(
        [
          `[레이지클럽 모임 기획서]`,
          `이름: ${name}`,
          `연락처: ${phone}`,
          `모임: ${title}`,
          `형식: ${format}`,
          `가능한 시기: ${availability || "-"}`,
          `참고 링크: ${links || "-"}`,
          ``,
          `[기획]`,
          plan,
          ``,
          `[소개]`,
          intro,
        ].join("\n"),
      )
      setFailCopied(false)
      setErrors({
        _form: timedOut
          ? "응답이 늦어 접수 여부를 확인하지 못했습니다. 입력하신 내용은 그대로 남아 있으니 잠시 후 한 번만 다시 제출해 주세요. 중복으로 접수되어도 저희가 정리합니다."
          : "일시적인 오류로 기획서가 접수되지 않았습니다. 입력하신 내용은 그대로 남아 있으니 잠시 후 다시 눌러 주세요.",
      })
      reportClientError(timedOut ? "lzc_host_timeout" : "lzc_host_submit")
      return
    } finally {
      clearTimeout(timer)
    }
    try {
      sessionStorage.setItem(DONE_KEY, "1")
    } catch {}
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <section className={h.section} id="apply">
        <span className={h.sectionLabel}>모임 기획서</span>
        <div className={h.done}>
          <p>기획서가 접수되었습니다. 순차 확인 후 협의 일정을 안내드립니다.</p>
          <p className={h.infoNote}>
            내용을 고치거나 덧붙일 것이 있으면{" "}
            <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer">
              카카오톡 채널
            </a>
            로 알려 주세요.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className={h.section} id="apply">
      {loading && (
        <div className={h.busy}>
          <TurtleLoader label="로딩 중" />
        </div>
      )}

      <span className={h.sectionLabel}>모임 기획서</span>
      <p className={h.sectionBody}>
        아래에 직접 작성해 접수합니다. 형식은 자유이고, 파일은 받지 않습니다. 보여 줄 자료가 있으면
        링크로 남겨 주시면 됩니다.
      </p>

      <form onSubmit={handleSubmit} noValidate style={{ marginTop: 26 }}>
        <div className={h.field}>
          <label htmlFor="name" className={h.fieldLabel}>
            이름<span className={h.required}>*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`${h.input} ${errors.name ? h.inputError : ""}`}
            onChange={() => clearError("name")}
          />
          {errors.name && <p className={h.errorText}>{errors.name}</p>}
        </div>

        <div className={h.field}>
          <label htmlFor="phone" className={h.fieldLabel}>
            연락처<span className={h.required}>*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            className={`${h.input} ${errors.phone ? h.inputError : ""}`}
            placeholder="휴대전화 번호"
            onChange={(e) => {
              e.target.value = formatPhone(e.target.value)
              clearError("phone")
            }}
          />
          {errors.phone && <p className={h.errorText}>{errors.phone}</p>}
        </div>

        <div className={h.field}>
          <label htmlFor="title" className={h.fieldLabel}>
            모임 한 줄<span className={h.required}>*</span>
          </label>
          <p className={h.fieldHint}>제목이어도, 함께 읽고 볼 것의 이름이어도 좋습니다.</p>
          <input
            id="title"
            name="title"
            type="text"
            className={`${h.input} ${errors.title ? h.inputError : ""}`}
            onChange={() => clearError("title")}
          />
          {errors.title && <p className={h.errorText}>{errors.title}</p>}
        </div>

        <div className={h.field}>
          <span className={h.fieldLabel}>
            형식<span className={h.required}>*</span>
          </span>
          <div className={h.choices} id="format-choices">
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                className={`${h.choice} ${format === f ? h.choiceOn : ""}`}
                aria-pressed={format === f}
                onClick={() => {
                  setFormat(f)
                  clearError("format")
                }}
              >
                {f}
              </button>
            ))}
          </div>
          {errors.format && <p className={h.errorText}>{errors.format}</p>}
        </div>

        <div className={h.field}>
          <label htmlFor="plan" className={h.fieldLabel}>
            기획<span className={h.required}>*</span>
          </label>
          <p className={h.fieldHint}>
            형식은 자유입니다. 무엇을 함께 읽고 보는지, 한 회를 어떻게 여는지, 왜 이 모임인지가
            담겨 있으면 협의가 빨라집니다.
          </p>
          <textarea
            id="plan"
            name="plan"
            className={`${h.textarea} ${h.textareaTall} ${errors.plan ? h.inputError : ""}`}
            onChange={() => clearError("plan")}
          />
          {errors.plan && <p className={h.errorText}>{errors.plan}</p>}
        </div>

        <div className={h.field}>
          <label htmlFor="intro" className={h.fieldLabel}>
            소개<span className={h.required}>*</span>
          </label>
          <p className={h.fieldHint}>이력보다 결이 보이는 소개면 충분합니다.</p>
          <textarea
            id="intro"
            name="intro"
            className={`${h.textarea} ${errors.intro ? h.inputError : ""}`}
            onChange={() => clearError("intro")}
          />
          {errors.intro && <p className={h.errorText}>{errors.intro}</p>}
        </div>

        <div className={h.field}>
          <label htmlFor="links" className={h.fieldLabel}>참고 링크</label>
          <p className={h.fieldHint}>포트폴리오, 글, 인스타그램 등 주소. 여러 개면 줄을 바꿔 적습니다.</p>
          <textarea id="links" name="links" className={h.textarea} style={{ minHeight: 60 }} />
        </div>

        <div className={h.field}>
          <label htmlFor="availability" className={h.fieldLabel}>가능한 시기</label>
          <input
            id="availability"
            name="availability"
            type="text"
            className={h.input}
            placeholder="예: 10월 이후 평일 저녁, 주말 오전"
          />
        </div>

        <div className={h.consent}>
          <label htmlFor="privacyConsent" className={h.consentLabel}>
            <input
              id="privacyConsent"
              type="checkbox"
              checked={privacyConsent}
              onChange={(e) => {
                setPrivacyConsent(e.target.checked)
                if (e.target.checked) clearError("privacyConsent")
              }}
            />
            <span>
              개인정보 수집·이용에 동의합니다. <span className={h.required}>(필수)</span>
            </span>
          </label>
          <p className={h.consentNote}>
            <span>수집 항목: 이름·연락처·기획서 본문(선택 입력 포함)</span>
            <span>목적: 모임장 협의 및 안내</span>
            <span>보유 기간: 접수 후 1년</span>
          </p>
          {errors.privacyConsent && <p className={h.errorText}>{errors.privacyConsent}</p>}
        </div>

        {errors._form && (
          <div className={h.rescue} role="alert">
            <p className={h.formError}>{errors._form}</p>
            <p className={h.infoNote}>{KAKAO_SUBMIT_GUIDE}</p>
            <div className={h.rescueActions}>
              <button
                type="button"
                className={h.linkBtn}
                onClick={async () => {
                  setFailCopied(await copyText(failedText))
                }}
              >
                {failCopied ? "복사됐습니다" : "기획서 내용 복사"}
              </button>
              <a
                href={KAKAO_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => reportClientError("lzc_host_kakao")}
              >
                {KAKAO_SUBMIT_LABEL}
              </a>
            </div>
          </div>
        )}

        <button type="submit" className={h.actionBtn} disabled={loading}>
          {loading ? "로딩 중" : "제출"}
        </button>
      </form>
    </section>
  )
}
