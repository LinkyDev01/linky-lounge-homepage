"use client"

/**
 * 커피앤바 신청 폼 → GAS `type:"coffeebar"` → 레이지클럽 시트 '커피앤바' 탭.
 *
 * **결제가 없다** — 모임 신청 폼(MeetingApplyForm)과 갈라지는 지점이다. 접수가 끝이고,
 * 그 뒤는 운영자가 해당 번호로 직접 연락한다(카피 근거). 그래서 payUrl·주문번호·
 * 결제 안내 화면이 전부 없다.
 *
 * 접수 계약 (실배포 GAS handleCoffeeBar 와 1:1):
 *   type / name / age / phone / preferredWhen / intro / marketingConsent / consentAt
 *   ⚠ 필드 이름을 바꾸면 시트 칸이 조용히 빈다 — GAS 를 먼저 고치고 배포를 확인한 뒤
 *     여기를 고친다 (§6 순서).
 *
 * 회복 장치는 모임 폼과 같은 문법이다 — 25초 타임아웃 · 실패 시 입력값 보존 +
 * 카카오 구제 원문 복사 · 완료 상태 sessionStorage 복원.
 *
 * '희망 날짜와 시간대'는 **직접 타이핑**이다 (운영자 2026-08-24 결정 4) — 달력·시간
 * 선택기를 쓰지 않는다. 운영자가 읽고 조율하는 자유 문장이라 형식을 강제하지 않는다.
 */

import { useEffect, useRef, useState } from "react"
import {
  copyText,
  KAKAO_CHAT_URL,
  KAKAO_SUBMIT_GUIDE,
  KAKAO_SUBMIT_LABEL,
  reportClientError,
} from "@/app/(main)/lazyday/support"
import { TurtleLoader } from "../../TurtleLoader"
import cb from "./coffeebar.module.css"

const DONE_KEY = "lzc-applied-dm-gd"

function formatPhone(value: string) {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function CoffeeBarForm() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [failedText, setFailedText] = useState("")
  const [failCopied, setFailCopied] = useState(false)
  /** 제출 버튼이 한 번 달아났는가 (운영자 2026-08-25 — 위트 장치) */
  const [escaped, setEscaped] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const clearError = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p))

  /** 완료 상태 복원 — useEffect 로만(초깃값 X). 서버 스냅숏과 첫 클라이언트 렌더가
   *  어긋나면 하이드레이션 불일치가 난다 (모임 폼과 같은 이유) */
  useEffect(() => {
    try {
      if (sessionStorage.getItem(DONE_KEY)) setDone(true)
    } catch {}
  }, [])

  /** 폼 값 읽기 — 제출 이벤트가 아니라 ref 에서 읽는다. 버튼이 submit 이 아니게
   *  바뀌었기 때문(도망 → 확인 모달 → 제출 순서라 클릭이 곧 제출이 아니다) */
  function readValues() {
    const data = new FormData(formRef.current ?? undefined)
    const v = (k: string) => ((data.get(k) as string) ?? "").trim()
    return { name: v("name"), age: v("age"), phone: v("phone"), preferredWhen: v("preferredWhen"), intro: v("intro") }
  }

  /** 검증만 — 통과 여부를 돌려준다. 모달을 띄우기 **전에** 부른다:
   *  빈 칸인 채로 "정말 제출하시겠습니까"를 묻는 건 허탕이다 */
  function validate() {
    const { name, age, phone, preferredWhen } = readValues()
    const next: Record<string, string> = {}
    if (!name) next.name = "이름을 입력해주세요."
    if (!age) next.age = "나이를 입력해주세요."
    if (!phone) next.phone = "전화번호를 입력해주세요."
    if (!preferredWhen) next.preferredWhen = "희망하시는 날짜와 시간대를 적어주세요."
    if (!privacyConsent) next.privacyConsent = "개인정보 수집·이용 동의가 필요합니다."
    if (Object.keys(next).length) {
      setErrors(next)
      const first = Object.keys(next)[0]
      const el =
        first === "privacyConsent"
          ? document.getElementById("privacyConsent")
          : document.querySelector(`[name="${first}"]`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      return false
    }
    setErrors({})
    return true
  }

  /** 달아날 거리를 실측해 CSS 변수로 넣는다 — 행 너비에서 버튼 너비를 뺀 만큼.
   *  CSS 만으로는 형제(행)의 폭을 알 수 없고 100% 는 자기 폭이라 쓸 수 없다 */
  function flee() {
    const row = rowRef.current
    const btn = btnRef.current
    if (row && btn) btn.style.setProperty("--cb-flee", `${Math.max(0, row.clientWidth - btn.offsetWidth)}px`)
    setEscaped(true)
  }

  /** 버튼 클릭 — 처음엔 달아나고(검증 없음), 잡아서 다시 누르면 검증 후 확인 모달 */
  function handleButtonClick() {
    if (loading) return
    if (!escaped) {
      flee()
      return
    }
    if (validate()) setConfirming(true)
  }

  async function reallySubmit() {
    setConfirming(false)
    if (loading) return
    const { name, age, phone, preferredWhen, intro } = readValues()
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
          type: "coffeebar",
          name,
          age,
          phone,
          preferredWhen,
          intro,
          marketingConsent: marketingConsent ? "동의" : "미동의",
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
          `[동민과 고든 커피앤바 신청]`,
          `이름: ${name}`,
          `나이: ${age}`,
          `연락처: ${phone}`,
          `희망 날짜와 시간대: ${preferredWhen}`,
          `자기소개: ${intro || "-"}`,
        ].join("\n"),
      )
      setFailCopied(false)
      setErrors({
        _form: timedOut
          ? "응답이 늦어 접수 여부를 확인하지 못했어요. 입력하신 내용은 그대로 남아 있으니 잠시 후 한 번만 다시 제출해주세요 — 혹시 중복으로 접수되어도 저희가 정리합니다."
          : "일시적인 오류로 신청서가 접수되지 않았어요. 입력하신 내용은 그대로 남아 있으니 잠시 후 다시 눌러주세요.",
      })
      reportClientError(timedOut ? "lzc_coffeebar_timeout" : "lzc_coffeebar_submit", "dm-gd")
      return
    } finally {
      clearTimeout(timer)
    }
    setLoading(false)
    setDone(true)
    try {
      sessionStorage.setItem(DONE_KEY, "1")
    } catch {}
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }

  // ── 접수 완료 — 결제가 없으니 여기서 끝난다 ──
  if (done) {
    return (
      <p className={cb.doneText}>
        신청서가 접수되었습니다.
        <br />
        해당 번호로 연락드리겠습니다.
      </p>
    )
  }

  return (
    <>
      {loading && (
        <div className={cb.busy}>
          <TurtleLoader label="로딩 중" />
        </div>
      )}

      {/* onSubmit 은 Enter 키 대비 — 버튼이 submit 이 아니라 도망 장치가 됐다 */}
      <form
        ref={formRef}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          handleButtonClick()
        }}
      >
        <div className={cb.field}>
          <label htmlFor="cb-name" className={cb.fieldLabel}>
            이름<span className={cb.required}>*</span>
          </label>
          <input
            id="cb-name"
            name="name"
            type="text"
            className={`${cb.input} ${errors.name ? cb.inputError : ""}`}
            onChange={() => clearError("name")}
          />
          {errors.name && <p className={cb.errorText}>{errors.name}</p>}
        </div>

        <div className={cb.field}>
          <label htmlFor="cb-age" className={cb.fieldLabel}>
            나이<span className={cb.required}>*</span>
          </label>
          <input
            id="cb-age"
            name="age"
            type="text"
            inputMode="numeric"
            maxLength={3}
            className={`${cb.input} ${errors.age ? cb.inputError : ""}`}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, "")
              clearError("age")
            }}
          />
          {errors.age && <p className={cb.errorText}>{errors.age}</p>}
        </div>

        <div className={cb.field}>
          <label htmlFor="cb-phone" className={cb.fieldLabel}>
            전화번호<span className={cb.required}>*</span>
          </label>
          <input
            id="cb-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            className={`${cb.input} ${errors.phone ? cb.inputError : ""}`}
            onChange={(e) => {
              e.target.value = formatPhone(e.target.value)
              clearError("phone")
            }}
          />
          {errors.phone && <p className={cb.errorText}>{errors.phone}</p>}
        </div>

        <div className={cb.field}>
          <label htmlFor="cb-intro" className={cb.fieldLabel}>
            자기소개
          </label>
          <textarea
            id="cb-intro"
            name="intro"
            rows={3}
            className={cb.textarea}
          />
        </div>

        <div className={cb.field}>
          <label htmlFor="cb-when" className={cb.fieldLabel}>
            희망 날짜와 시간대<span className={cb.required}>*</span>
          </label>
          <input
            id="cb-when"
            name="preferredWhen"
            type="text"
            className={`${cb.input} ${errors.preferredWhen ? cb.inputError : ""}`}
            onChange={() => clearError("preferredWhen")}
          />
          {errors.preferredWhen && <p className={cb.errorText}>{errors.preferredWhen}</p>}
        </div>

        <div className={cb.consent}>
          <label htmlFor="privacyConsent" className={cb.consentLabel}>
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
              개인정보 수집·이용에 동의합니다. <span className={cb.required}>(필수)</span>
            </span>
          </label>
          <p className={cb.consentNote}>
            <span>수집 항목: 이름·나이·연락처(선택 입력 포함)</span>
            <span>목적: 커피앤바 일정 조율 및 안내</span>
            <span>보유 기간: 만남 종료 후 1년</span>
          </p>
          {errors.privacyConsent && <p className={cb.errorText}>{errors.privacyConsent}</p>}

          <label htmlFor="marketingConsent" className={cb.consentLabel}>
            <input
              id="marketingConsent"
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
            />
            <span>마케팅 정보 수신에 동의합니다. (선택)</span>
          </label>
        </div>

        {errors._form && (
          <div className={cb.rescue} role="alert">
            <p className={cb.formError}>{errors._form}</p>
            <p className={cb.hint}>{KAKAO_SUBMIT_GUIDE}</p>
            <div className={cb.rescueActions}>
              <button
                type="button"
                className={cb.linkBtn}
                onClick={async () => {
                  setFailCopied(await copyText(failedText))
                }}
              >
                {failCopied ? "복사됐어요" : "신청 내용 복사"}
              </button>
              <a
                href={KAKAO_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => reportClientError("lzc_coffeebar_kakao", "dm-gd")}
              >
                {KAKAO_SUBMIT_LABEL}
              </a>
            </div>
          </div>
        )}

        {/* 도망가는 제출 버튼 — 처음 누르면 1.5초에 걸쳐 우측으로 달아나고,
            잡아서 다시 누르면 확인 모달이 뜬다 (운영자 2026-08-25) */}
        <div className={cb.submitRow} ref={rowRef}>
          <button
            type="button"
            ref={btnRef}
            className={`${cb.actionBtn} ${escaped ? cb.fled : ""}`}
            disabled={loading}
            onClick={handleButtonClick}
          >
            {loading ? "로딩 중" : "신청하기"}
          </button>
        </div>
      </form>

      {confirming && (
        <div
          className={cb.confirmBack}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cb-confirm-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirming(false)
          }}
        >
          <div className={cb.confirmCard}>
            <p className={cb.confirmTitle} id="cb-confirm-title">
              정말 제출하시겠습니까?
            </p>
            <p className={cb.confirmBody}>버튼은 도망쳤지만 신청서는 도망가지 않습니다.</p>
            <div className={cb.confirmActions}>
              <button type="button" className={cb.actionBtn} onClick={reallySubmit}>
                제출합니다
              </button>
              <button type="button" className={cb.confirmNo} onClick={() => setConfirming(false)}>
                아직이요
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
