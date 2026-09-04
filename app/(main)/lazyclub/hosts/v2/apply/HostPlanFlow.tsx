"use client"

/**
 * 모임 기획서 — 한 화면에 질문 하나 (v2 시안, 2026-09-04).
 *
 * v1(HostForm)의 접수 계약을 그대로 쓴다: type:"host" / name / phone / title / format / plan / intro /
 * links / availability / consentAt → /api/lazyday/apply → GAS handleHost + 원장. 시안 구분용 `source` 만 더한다.
 *
 * 흐름 (북클럽 서면 인터뷰의 '한 페이지에 질문 하나 + 진행 점' 문법을 §9 백지+잉크로):
 *   1 이름·연락처 → 2 모임 한 줄·형식 → 3 기획 → 4 소개 → 5 참고 링크·가능한 시기 →
 *   6 **미리보기**(홈 리스트 항목 문법으로 자기 모임이 어떻게 놓이는지) + 동의 + 보내기
 *   · 걸음마다 필수 검증, 이전/다음. 입력은 sessionStorage 초안에 남아 새로고침·이탈 뒤에도 복원된다.
 *   · 제출 규율은 v1 과 동일 — 로더, 성공 판정 res.ok && success, 실패 시 원문 복사 + 카카오 구제, 완료 화면 유지.
 *
 * ⚠ 질문 문구·힌트는 초안 — 운영자 교체 대상.
 */

import { useEffect, useState } from "react"
import {
  copyText,
  KAKAO_CHAT_URL,
  KAKAO_SUBMIT_GUIDE,
  KAKAO_SUBMIT_LABEL,
  reportClientError,
} from "@/app/(main)/lazyday/support"
import { TurtleLoader } from "../../../TurtleLoader"
import h from "../hosts-v2.module.css"

const FORMATS = ["원데이 토크", "4주 과정", "정기 모임", "아직 미정"] as const
const DRAFT_KEY = "lzc-host-v2-draft"
const DONE_KEY = "lzc-host-v2-applied"
const TOTAL = 6

type Draft = {
  name: string
  phone: string
  title: string
  format: string
  plan: string
  intro: string
  links: string
  availability: string
}
const EMPTY: Draft = { name: "", phone: "", title: "", format: "", plan: "", intro: "", links: "", availability: "" }

function formatPhone(value: string) {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function HostPlanFlow() {
  const [step, setStep] = useState(1)
  const [d, setD] = useState<Draft>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [failedText, setFailedText] = useState("")
  const [failCopied, setFailCopied] = useState(false)

  // 초안·완료 복원 — useEffect 에서만 (서버 스냅숏과 첫 렌더가 갈리면 하이드레이션 불일치)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(DONE_KEY)) {
        setDone(true)
        return
      }
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Draft> & { step?: number }
        setD({ ...EMPTY, ...saved })
        if (saved.step && saved.step >= 1 && saved.step <= TOTAL) setStep(saved.step)
      }
    } catch {}
  }, [])

  const set = (k: keyof Draft, v: string) => {
    setD((p) => {
      const next = { ...p, [k]: v }
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...next, step }))
      } catch {}
      return next
    })
    setErrors((p) => (p[k] ? { ...p, [k]: "" } : p))
  }
  const go = (n: number) => {
    setStep(n)
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, step: n }))
    } catch {}
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }

  function validate(n: number): boolean {
    const next: Record<string, string> = {}
    if (n === 1) {
      if (!d.name.trim()) next.name = "이름을 적어 주세요."
      if (!d.phone.trim()) next.phone = "연락처를 적어 주세요."
    }
    if (n === 2) {
      if (!d.title.trim()) next.title = "모임을 한 줄로 적어 주세요."
      if (!d.format) next.format = "형식을 하나 골라 주세요."
    }
    if (n === 3 && !d.plan.trim()) next.plan = "기획을 적어 주세요."
    if (n === 4 && !d.intro.trim()) next.intro = "소개를 적어 주세요."
    if (n === 6 && !privacyConsent) next.privacyConsent = "개인정보 수집·이용 동의가 필요합니다."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit() {
    if (loading) return
    if (!validate(6)) return
    setLoading(true)
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 25_000)
    let timedOut = false
    const payload = {
      type: "host",
      name: d.name.trim(),
      phone: d.phone.trim(),
      title: d.title.trim(),
      format: d.format,
      plan: d.plan.trim(),
      intro: d.intro.trim(),
      links: d.links.trim(),
      availability: d.availability.trim(),
      source: "hosts-v2",
      consentAt: new Date().toISOString(),
    }
    try {
      const res = await fetch("/api/lazyday/apply", {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json().catch(() => null)
      if (!res.ok || !result?.success) throw new Error("submit failed")
    } catch (err) {
      timedOut = err instanceof DOMException && err.name === "AbortError"
      setLoading(false)
      setFailedText(
        [
          `[레이지클럽 모임 기획서]`,
          `이름: ${payload.name}`,
          `연락처: ${payload.phone}`,
          `모임: ${payload.title}`,
          `형식: ${payload.format}`,
          `가능한 시기: ${payload.availability || "-"}`,
          `참고 링크: ${payload.links || "-"}`,
          ``,
          `[기획]`,
          payload.plan,
          ``,
          `[소개]`,
          payload.intro,
        ].join("\n"),
      )
      setFailCopied(false)
      setErrors({
        _form: timedOut
          ? "응답이 늦어져 접수 여부를 확인하지 못했습니다. 적으신 내용은 그대로 남아 있으니 잠시 뒤 한 번만 다시 보내 주세요. 두 번 접수되더라도 저희가 정리하겠습니다."
          : "일시적인 문제로 기획서가 접수되지 않았습니다. 적으신 내용은 그대로 남아 있으니 잠시 뒤 다시 보내 주세요.",
      })
      reportClientError(timedOut ? "lzc_host_v2_timeout" : "lzc_host_v2_submit")
      return
    } finally {
      clearTimeout(timer)
    }
    try {
      sessionStorage.setItem(DONE_KEY, "1")
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {}
    setLoading(false)
    setDone(true)
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }

  if (done) {
    return (
      <div className={h.flow}>
        <div className={h.done}>
          <p className={h.q}>기획서가 잘 도착했습니다.</p>
          <p>차례로 읽어 보고 연락드리겠습니다.</p>
          <p className={h.infoNote}>
            덧붙이고 싶은 이야기가 있다면{" "}
            <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer">
              카카오톡 채널
            </a>
            로 보내 주셔도 좋습니다.
          </p>
        </div>
      </div>
    )
  }

  const err = (k: string) => errors[k] && <p className={h.errorText}>{errors[k]}</p>
  const cls = (k: string, base: string) => `${base} ${errors[k] ? h.inputError : ""}`

  return (
    <div className={h.flow}>
      {loading && (
        <div className={h.busy}>
          <TurtleLoader label="로딩 중" />
        </div>
      )}

      <div className={h.progress} role="status" aria-label={`${step} / ${TOTAL}`}>
        <div className={h.dots} aria-hidden="true">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className={`${h.dot} ${i + 1 <= step ? h.dotOn : ""}`} />
          ))}
        </div>
        <span className={h.progressCap}>
          {step} / {TOTAL}
        </span>
      </div>

      {step === 1 && (
        <>
          <p className={h.q}>먼저 이름과 연락처를 남겨 주세요.</p>
          <p className={h.hint}>협의 일정은 이 번호로 안내드립니다.</p>
          <div className={h.field}>
            <label htmlFor="name" className={h.fieldLabel}>
              이름<span className={h.required}>*</span>
            </label>
            <input id="name" name="name" type="text" className={cls("name", h.input)} value={d.name} onChange={(e) => set("name", e.target.value)} />
            {err("name")}
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
              className={cls("phone", h.input)}
              placeholder="휴대전화 번호"
              value={d.phone}
              onChange={(e) => set("phone", formatPhone(e.target.value))}
            />
            {err("phone")}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className={h.q}>어떤 모임인지 한 줄로 적어 주세요.</p>
          <p className={h.hint}>제목이어도 좋고, 아직 제목이 없다면 모임을 떠올리게 하는 한 줄이어도 좋습니다.</p>
          <div className={h.field}>
            <label htmlFor="title" className={h.fieldLabel}>
              모임 한 줄<span className={h.required}>*</span>
            </label>
            <input id="title" name="title" type="text" className={cls("title", h.input)} value={d.title} onChange={(e) => set("title", e.target.value)} />
            {err("title")}
          </div>
          <div className={h.field}>
            <span className={h.fieldLabel}>
              어떤 방식으로 만나고 싶으신가요<span className={h.required}>*</span>
            </span>
            <div className={h.choices} id="format-choices">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`${h.choice} ${d.format === f ? h.choiceOn : ""}`}
                  aria-pressed={d.format === f}
                  onClick={() => set("format", f)}
                >
                  {f}
                </button>
              ))}
            </div>
            {err("format")}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className={h.q}>모임을 어떻게 그리고 계신지 들려주세요.</p>
          <p className={h.hint}>
            길이도 형식도 자유롭게 적어 주세요. 어떤 이야기를 나누고 싶은지, 한 번의 모임을 어떻게 이끌어 가고
            싶은지, 그리고 왜 이 모임을 열고 싶은지가 담겨 있다면 이야기가 한결 수월해집니다.
          </p>
          <div className={h.field}>
            <label htmlFor="plan" className={h.fieldLabel}>
              기획<span className={h.required}>*</span>
            </label>
            <textarea id="plan" name="plan" className={cls("plan", `${h.textarea} ${h.textareaTall}`)} value={d.plan} onChange={(e) => set("plan", e.target.value)} />
            {err("plan")}
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <p className={h.q}>어떤 분인지 소개해 주세요.</p>
          <p className={h.hint}>이력을 나열하지 않으셔도 괜찮습니다. 어떤 분인지 알 수 있는 소개면 충분합니다.</p>
          <div className={h.field}>
            <label htmlFor="intro" className={h.fieldLabel}>
              소개<span className={h.required}>*</span>
            </label>
            <textarea id="intro" name="intro" className={cls("intro", h.textarea)} value={d.intro} onChange={(e) => set("intro", e.target.value)} />
            {err("intro")}
          </div>
        </>
      )}

      {step === 5 && (
        <>
          <p className={h.q}>더 보여 주고 싶은 것이 있다면 남겨 주세요.</p>
          <p className={h.hint}>둘 다 비워 두셔도 됩니다. 파일은 따로 받지 않으니, 자료가 있다면 주소로 남겨 주세요.</p>
          <div className={h.field}>
            <label htmlFor="links" className={h.fieldLabel}>참고 링크</label>
            <p className={h.hint}>포트폴리오나 글, 인스타그램처럼 보여 주고 싶은 것이 있다면 주소를. 여러 개라면 줄을 바꿔 적어 주시면 됩니다.</p>
            <textarea id="links" name="links" className={`${h.textarea} ${h.textareaShort}`} value={d.links} onChange={(e) => set("links", e.target.value)} />
          </div>
          <div className={h.field}>
            <label htmlFor="availability" className={h.fieldLabel}>가능한 시기</label>
            <input
              id="availability"
              name="availability"
              type="text"
              className={h.input}
              placeholder="10월 이후 평일 저녁, 주말 오전처럼 적어 주세요."
              value={d.availability}
              onChange={(e) => set("availability", e.target.value)}
            />
          </div>
        </>
      )}

      {step === 6 && (
        <>
          <p className={h.q}>홈과 모임 목록에서는 이렇게 보입니다.</p>
          <p className={h.hint}>협의를 거쳐 모임 페이지가 만들어지면, 이 자리에 이렇게 놓입니다.</p>
          {/* 홈 리스트 항목 문법 — 카테고리 자리에 모임장 이름(운영자 2026-08-21 "카테고리에 이름을") */}
          <article className={h.previewItem} aria-label="모임 목록 미리보기">
            <figure className={h.previewFigure} />
            <div className={h.previewBody}>
              <div className={h.previewCat}>{d.name.trim() || "모임장"}</div>
              <div className={h.previewTitle}>{d.title.trim() || "모임 한 줄"}</div>
              <p className={h.previewMeta}>
                {d.format && d.format !== "아직 미정" ? d.format : "형식 미정"} · 링키라운지
              </p>
              {d.intro.trim() && <p className={h.previewIntro}>{d.intro.trim()}</p>}
            </div>
          </article>
          <p className={h.previewNote}>이미지 자리는 비워 두었습니다.</p>

          <div className={h.consent}>
            <label htmlFor="privacyConsent" className={h.consentLabel}>
              <input
                id="privacyConsent"
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => {
                  setPrivacyConsent(e.target.checked)
                  if (e.target.checked) setErrors((p) => ({ ...p, privacyConsent: "" }))
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
            {err("privacyConsent")}
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
                  {failCopied ? "복사했습니다" : "기획서 내용 복사"}
                </button>
                <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" onClick={() => reportClientError("lzc_host_v2_kakao")}>
                  {KAKAO_SUBMIT_LABEL}
                </a>
              </div>
            </div>
          )}
        </>
      )}

      <div className={h.nav}>
        {step > 1 ? (
          <button type="button" className={h.linkBtn} onClick={() => go(step - 1)}>
            이전
          </button>
        ) : (
          <span />
        )}
        {step < TOTAL ? (
          <button
            type="button"
            className={h.actionBtn}
            onClick={() => {
              if (validate(step)) go(step + 1)
            }}
          >
            다음
          </button>
        ) : (
          <button type="button" className={h.actionBtn} disabled={loading} onClick={submit}>
            {loading ? "로딩 중" : "보내기"}
          </button>
        )}
      </div>
    </div>
  )
}
