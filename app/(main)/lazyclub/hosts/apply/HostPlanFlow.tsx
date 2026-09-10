"use client"

/**
 * 모임 기획서 — 한 화면에 질문 하나 (/hosts/apply. v2 시안 2026-09-04 → 09-05 승인).
 *
 * 접수 계약: type:"host" / name / phone / title / format / plan / intro / links / availability / consentAt
 * → /api/lazyday/apply → GAS handleHost + 원장. `source:"hosts-steps"` 는 원장 payload 용 표식(GAS 는 무시).
 *
 * 흐름 (북클럽 서면 인터뷰의 '한 페이지에 질문 하나 + 진행 점' 문법을 §9 백지+잉크로):
 *   1 이름·연락처 → 2 모임 한 줄·형식 → 3 기획 → 4 소개 → 5 참고 링크·가능한 시기 →
 *   6 **미리보기**(홈 리스트 항목 문법으로 자기 모임이 어떻게 놓이는지) + 동의 + 보내기
 *   · 걸음마다 필수 검증, 이전/다음. 입력은 sessionStorage 초안에 남아 새로고침·이탈 뒤에도 복원된다.
 *   · 제출 규율은 v1 과 동일 — 로더, 성공 판정 res.ok && success, 실패 시 원문 복사 + 카카오 구제, 완료 화면 유지.
 *
 * 2026-09-10 (운영자 카드뉴스 반영 + "플레이스홀더 및 텍스트 입력창의 UX" 지적):
 *   · 2번째 걸음의 선택지를 '형식'(원데이/4주/정기)에서 **진행 간격**(1주/2주/미정)으로 — 모임은 총 4회차,
 *     각 2시간이 정해져 있다(카드뉴스 3장). payload 키 `format` 과 GAS '형식' 열은 그대로(값만 바뀐다).
 *   · 가능한 시기 → **가능한 시기와 장소**(장소 6곳 중 선택) — 새 필드 없이 같은 칸(availability)에 적는다.
 *   · 플레이스홀더는 짧은 예시만(지시문은 힌트가 맡는다), 텍스트에어리어는 입력에 따라 자란다(autoGrow).
 *   · 사용자 화면 표기는 '호스트'. 동의 문구의 '모임장'은 방침 원문과 같아야 하므로 그대로 둔다.
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
import { TurtleLoader } from "../../TurtleLoader"
import { LazyclubLink } from "../../LazyclubLink"
import { BASE } from "../../base-path"
import { HOST_INTERVALS } from "../hosts-config"
import h from "../hosts.module.css"

const DRAFT_KEY = "lzc-host-draft"
const DONE_KEY = "lzc-host-applied"
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

/** 텍스트에어리어 — 내용만큼 자란다(최소 높이는 CSS). 초안 복원 직후에도 한 번 맞춘다 */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = "auto"
  el.style.height = `${el.scrollHeight}px`
}

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
      if (!d.format) next.format = "간격을 하나 골라 주세요."
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
      source: "hosts-steps",
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
          `진행 간격: ${payload.format}`,
          `가능한 시기와 장소: ${payload.availability || "-"}`,
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
      reportClientError(timedOut ? "lzc_host_timeout" : "lzc_host_submit")
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
          <p className={h.q}>잘 받았습니다.</p>
          <p>찬찬히 읽고 연락드리겠습니다.</p>
          <p className={h.infoNote}>
            덧붙이고 싶은 말이 있으면{" "}
            <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer">
              카카오톡 채널
            </a>
            로 보내 주셔도 됩니다.
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
          <p className={h.hint}>이 번호로 연락드립니다.</p>
          <div className={h.field}>
            <label htmlFor="name" className={h.fieldLabel}>
              이름<span className={h.required}>*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className={cls("name", h.input)}
              placeholder="이름"
              value={d.name}
              onChange={(e) => set("name", e.target.value)}
            />
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
              autoComplete="tel"
              className={cls("phone", h.input)}
              placeholder="010-0000-0000"
              value={d.phone}
              onChange={(e) => set("phone", formatPhone(e.target.value))}
            />
            {err("phone")}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className={h.q}>어떤 모임인가요? 한 줄이면 됩니다.</p>
          <p className={h.hint}>제목이 있으면 제목을, 아직 없다면 모임이 떠오르는 한 줄을 적어 주세요.</p>
          <div className={h.field}>
            <label htmlFor="title" className={h.fieldLabel}>
              모임 한 줄<span className={h.required}>*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={cls("title", h.input)}
              placeholder="예) 비로소, 나를 쥐어짜지 않는 법"
              value={d.title}
              onChange={(e) => set("title", e.target.value)}
            />
            {err("title")}
          </div>
          <div className={h.field}>
            <span className={h.fieldLabel}>
              네 번의 만남, 어떤 간격이 좋으신가요<span className={h.required}>*</span>
            </span>
            <p className={h.hint}>모임은 총 4회차, 한 회차에 2시간입니다. 간격은 만나서 바꿀 수 있습니다.</p>
            <div className={h.choices} id="format-choices">
              {HOST_INTERVALS.map((f) => (
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
            길이도 형식도 자유입니다. 왜 이 모임을 열고 싶은지, 네 번의 만남을 어떻게 이어 갈지, 회차마다
            무엇을 다루고(책, 영화 등 무엇이든) 어떻게 진행할지가 담겨 있으면 만나서 나눌 이야기가 한결
            빨라집니다.
          </p>
          <div className={h.field}>
            <label htmlFor="plan" className={h.fieldLabel}>
              기획<span className={h.required}>*</span>
            </label>
            <textarea
              id="plan"
              name="plan"
              ref={autoGrow}
              className={cls("plan", `${h.textarea} ${h.textareaTall}`)}
              placeholder="기획 의도, 네 번의 만남, 회차별로 다룰 것"
              value={d.plan}
              onChange={(e) => {
                set("plan", e.target.value)
                autoGrow(e.target)
              }}
            />
            {err("plan")}
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <p className={h.q}>어떤 분인지 들려주세요.</p>
          <p className={h.hint}>이력은 없어도 됩니다. 참여자에게 자신을 알릴 수 있는 소개 글이면 충분합니다.</p>
          <div className={h.field}>
            <label htmlFor="intro" className={h.fieldLabel}>
              소개<span className={h.required}>*</span>
            </label>
            <textarea
              id="intro"
              name="intro"
              ref={autoGrow}
              className={cls("intro", h.textarea)}
              placeholder="참여자에게 건네는 자기소개"
              value={d.intro}
              onChange={(e) => {
                set("intro", e.target.value)
                autoGrow(e.target)
              }}
            />
            {err("intro")}
          </div>
        </>
      )}

      {step === 5 && (
        <>
          <p className={h.q}>더 보여 주고 싶은 것이 있다면</p>
          <p className={h.hint}>둘 다 비워 두셔도 됩니다. 파일은 받지 않으니 자료가 있으면 주소로 남겨 주세요.</p>
          <div className={h.field}>
            <label htmlFor="links" className={h.fieldLabel}>참고 링크</label>
            <p className={h.hint}>포트폴리오나 글, 인스타그램 아이디. 여러 개면 줄을 바꿔 적어 주세요.</p>
            <textarea
              id="links"
              name="links"
              ref={autoGrow}
              className={`${h.textarea} ${h.textareaShort}`}
              placeholder="https:// 또는 @instagram"
              value={d.links}
              onChange={(e) => {
                set("links", e.target.value)
                autoGrow(e.target)
              }}
            />
          </div>
          <div className={h.field}>
            <label htmlFor="availability" className={h.fieldLabel}>가능한 시기와 장소</label>
            <p className={h.hint}>시작은 10월에서 11월 사이, 장소는 사당, 을지로, 시청, 강남, 성수, 홍대 가운데 고를 수 있습니다.</p>
            <input
              id="availability"
              name="availability"
              type="text"
              className={h.input}
              placeholder="예) 10월 말 이후 토요일 오전, 성수나 을지로"
              value={d.availability}
              onChange={(e) => set("availability", e.target.value)}
            />
          </div>
        </>
      )}

      {step === 6 && (
        <>
          <p className={h.q}>홈과 모임 목록에는 이렇게 놓입니다.</p>
          <p className={h.hint}>만나서 이야기를 나눈 뒤 모임 페이지가 만들어지면 이 모습으로 올라갑니다.</p>
          {/* 홈 리스트 항목 문법 — 카테고리 자리에 호스트 이름(운영자 2026-08-21 "카테고리에 이름을").
              메타는 가운뎃점 없이(운영자 2026-08-21 "' · ' 문자로 작성하지 마") */}
          <article className={h.previewItem} aria-label="모임 목록 미리보기">
            <figure className={h.previewFigure} />
            <div className={h.previewBody}>
              <div className={h.previewCat}>{d.name.trim() || "호스트"}</div>
              <div className={h.previewTitle}>{d.title.trim() || "모임 한 줄"}</div>
              <p className={h.previewMeta}>
                {d.format && d.format !== "아직 미정" ? `총 4회차, ${d.format}` : "총 4회차"}
              </p>
              {d.intro.trim() && <p className={h.previewIntro}>{d.intro.trim()}</p>}
            </div>
          </article>
          <p className={h.previewNote}>포스터는 그때 함께 준비합니다.</p>

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
                <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" onClick={() => reportClientError("lzc_host_kakao")}>
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
          <LazyclubLink href={`${BASE}/hosts`} className={h.linkBtn}>
            안내로 돌아가기
          </LazyclubLink>
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
