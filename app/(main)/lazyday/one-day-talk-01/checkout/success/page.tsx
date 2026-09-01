"use client"

import { Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import { FadeUp } from "@/components/animation/FadeUp"
import { BlurReveal } from "@/components/animation/BlurReveal"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import { LazydayLink } from "@/components/common/LazydayLink"
import { trackStandard } from "@/lib/meta-pixel"
import { readTrafficSrc } from "@/lib/traffic-src"
import { trackEvent } from "@/lib/gtag"
import {
  KAKAO_CHAT_URL,
  KAKAO_SUBMIT_GUIDE,
  KAKAO_SUBMIT_LABEL,
  copyText,
  reportClientError,
} from "../../../support"
import { parseOrderCodes, resolveItems } from "@/lib/order-catalog"
import { ONEDAY, sessionDateLabel, sessionKey } from "../../oneday-shared"
import applyStyles from "../../../apply/page.module.css"
import cal from "../../apply/oneday.module.css"
import styles from "../checkout.module.css"

/**
 * 결제 성공 리다이렉트 — 토스가 paymentKey/orderId/amount 쿼리를 붙여 보낸다.
 * 여기서 서버 승인(/api/lazyday/payment/confirm)을 호출해야 결제가 최종 완료된다
 * (승인 전 이탈 시 결제는 만료 — 돈이 빠져나가지 않는다).
 *
 * 선결제→후신청 (2026-08-11 운영자 확정 여정):
 * 모임이 포함된 주문은 승인 직후 완료 화면 대신 **신청서가 곧 화면**이다 — 건너뛸
 * UI를 주지 않는다. 이름·연락처는 결제 때 입력한 값을 프리필(sessionStorage,
 * checkout 이 저장)하되 수정 가능 — 결제 1번 + 폼 1번, 사실상 이중 확인.
 * 제출이 되어야 GAS 접수·완료 화면 — 결제된 사람만 시트에 남는다.
 *
 * 이탈 구제: ?orderId=...&reentry=1 로 들어오면 승인 없이 신청서만 다시 연다
 * (결제는 이미 승인된 주문 — 운영자가 토스 상점관리자의 orderId 로 링크를 만들어
 * 알림톡/카카오로 재발송하는 운영 루틴).
 */

type Phase = "confirming" | "form" | "done" | "error"

/** checkout 이 결제 직전 sessionStorage("lz-buyer")에 보관하는 값 */
type SavedBuyer = {
  orderId?: string
  name?: string
  phone?: string
  shipping?: { method: "pickup" | "parcel"; zip?: string; addr1?: string; addr2?: string }
}

/** 주문 코드(dNNN) → 신청 회차 목록. 모임이 없으면 빈 배열 */
function meetingSessionsOf(codes: string[] | null) {
  if (!codes) return []
  const keys = codes
    .filter((c) => /^d[0-9]+$/.test(c))
    .map((c) => Number(c.slice(1)))
  return ONEDAY.sessions.filter((s) => keys.includes(sessionKey(s)))
}

function formatPhone(value: string) {
  const nums = value.replace(/[^0-9]/g, "")
  if (nums.length <= 3) return nums
  if (nums.length <= 7) return nums.slice(0, 3) + "-" + nums.slice(3)
  return nums.slice(0, 3) + "-" + nums.slice(3, 7) + "-" + nums.slice(7, 11)
}

function SuccessInner() {
  const params = useSearchParams()
  const [phase, setPhase] = useState<Phase>("confirming")
  const [errorMsg, setErrorMsg] = useState("")
  // 오류 종류 — 결제 실패와 재진입 링크 오류는 문구·행동이 정반대다.
  // 재진입은 **이미 결제가 끝난** 주문이라 결제 실패 문구·재시도 버튼을 보이면
  // 중복 결제로 이어진다 (2026-08-11 실측에서 발견)
  const [errorKind, setErrorKind] = useState<"payment" | "reentry">("payment")
  const calledRef = useRef(false)

  const paymentKey = params.get("paymentKey") || ""
  const orderId = params.get("orderId") || ""
  const amount = Number(params.get("amount") || 0)
  const isReentry = params.get("reentry") === "1"
  // 승인 실패 시 같은 주문으로 다시 시도할 수 있게 orderId에서 상품 코드 복원
  const codes = parseOrderCodes(orderId)
  const items = codes ? resolveItems(codes) : null
  const retryHref = codes ? `/one-day-talk-01/checkout?items=${codes.join(",")}` : "/one-day-talk-01/apply"
  // 굿즈가 섞여 있으면 완료 문구를 수령 안내로 (배송은 결제 때 입력한 배송지로)
  const hasGoods = items?.some((i) => i.kind === "goods") ?? false
  const sessions = meetingSessionsOf(codes)
  const hasMeeting = sessions.length > 0

  useEffect(() => {
    // 재진입 (이탈 구제): 승인은 이미 끝난 주문 — 신청서만 다시 연다
    if (isReentry) {
      if (orderId && hasMeeting) setPhase("form")
      else {
        // ⚠ 결제 실패 문구를 쓰면 안 된다 — 이미 결제한 사람이 중복 결제한다 (2026-08-11)
        setErrorKind("reentry")
        setPhase("error")
        setErrorMsg("주소가 올바르지 않아 신청서를 열지 못했어요. 안내받은 링크를 그대로 다시 열어주세요.")
      }
      return
    }
    // 토스 리다이렉트 3종(paymentKey·orderId·amount)이 모두 있어야 승인 가능
    if (!(paymentKey && orderId && amount)) {
      setPhase("error")
      setErrorMsg("결제 정보가 올바르지 않습니다. 결제를 다시 시도해주세요.")
      return
    }
    if (calledRef.current) return // StrictMode 중복 호출 방지 (승인은 1회만)
    calledRef.current = true
    ;(async () => {
      try {
        // 주문 원장(2026-08-18)용 구매자·배송지 — checkout 이 결제 직전 보관한 값.
        // 금액과 달리 **검증 대상이 아니다** (접수용 정보). 없으면 그냥 빠진 채 기록된다.
        let ledger: { buyer?: { name?: string; phone?: string }; shipping?: unknown } = {}
        try {
          const raw = sessionStorage.getItem("lz-buyer")
          const saved = raw ? (JSON.parse(raw) as SavedBuyer) : null
          if (saved && saved.orderId === orderId) {
            ledger = { buyer: { name: saved.name, phone: saved.phone }, shipping: saved.shipping }
          }
        } catch {}
        const res = await fetch("/api/lazyday/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount, ...ledger }),
        })
        const result = await res.json().catch(() => null)
        if (!res.ok || !result?.success) {
          throw new Error(result?.error || "결제 승인에 실패했습니다.")
        }
        // 모임 포함 = 신청서 단계로, 굿즈만 = 곧장 완료
        setPhase(hasMeeting ? "form" : "done")
      } catch (err) {
        setPhase("error")
        setErrorMsg(err instanceof Error ? err.message : "결제 승인에 실패했습니다.")
        reportClientError("oneday_confirm", err instanceof Error ? err.message : "승인 실패")
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === "confirming") {
    return <SubmitOverlay label="결제 승인 중..." />
  }

  if (phase === "error") {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          {/* 좌측 위 내비 — 승인 실패 화면에서도 이동 수단 유지 (운영자 2026-08-11) */}
          <div className={styles.navBar}>
            <LazydayLink href="/" className={styles.backLink}>
              홈
            </LazydayLink>
          </div>
          <div className={styles.stateBox}>
            <h1 className={styles.stateTitle}>
              {errorKind === "reentry" ? "신청서를 열지 못했어요" : "결제가 완료되지 않았어요"}
            </h1>
            <p className={styles.stateBody}>{errorMsg}</p>
            {errorKind === "reentry" ? (
              /* 결제는 이미 끝난 주문 — 재시도 버튼을 주면 중복 결제가 된다 */
              <p className={styles.stateDetail}>
                <strong>결제는 이미 정상 처리되었으니 다시 결제하지 마세요.</strong>
                <br />
                링크가 계속 열리지 않으면{" "}
                <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" className={styles.refundLink}>
                  카카오톡 채널
                </a>
                로 알려주시면 바로 도와드릴게요.
              </p>
            ) : (
              <>
                <p className={styles.stateDetail}>
                  카드 승인 문제일 수 있어요. 먼저 <strong>승인 상태 다시 확인</strong>을 눌러보고,
                  <br />
                  문제가 반복되면{" "}
                  <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" className={styles.refundLink}>
                    카카오톡 채널
                  </a>
                  로 문의해주세요.
                </p>
                {/* 네트워크 문제로 승인은 됐는데 응답만 유실된 경우가 있다 — 새로고침 재확인이
                    먼저다 (같은 orderId 재승인은 토스가 멱등 처리). 곧장 '다시 결제'로 가면
                    이 경우 중복 결제가 된다 (2026-08-11 디버깅) */}
                <button type="button" className={styles.emptyLink} onClick={() => window.location.reload()}>
                  승인 상태 다시 확인
                </button>
                <LazydayLink href={retryHref} className={styles.emptyLink}>
                  결제 다시 시도하기
                </LazydayLink>
              </>
            )}
          </div>
        </div>
      </main>
    )
  }

  if (phase === "form") {
    return (
      <PostPayApplyForm
        orderId={orderId}
        sessions={sessions}
        onDone={() => {
          window.scrollTo(0, 0)
          setPhase("done")
        }}
      />
    )
  }

  return (
    <main className={applyStyles.successPage}>
      <div className={`${applyStyles.successInner} ${cal.doneInner}`}>
        <BlurReveal duration={1.0} blur={10} fromScale={1.03}>
          <img
            src="/linky-lounge/book-club/lazyday_logo.png"
            alt="레이지데이"
            className={`${applyStyles.successMark} ${cal.doneMark}`}
          />
        </BlurReveal>
        <FadeUp delay={0.15}>
          <h1 className={`${applyStyles.successTitle} ${cal.doneTitle}`}>
            {hasMeeting ? "신청이 완료되었습니다." : "결제가 완료되었습니다."}
          </h1>
        </FadeUp>
        <FadeUp delay={0.3}>
          {hasMeeting ? (
            <p className={`${applyStyles.successBody} ${cal.doneBody}`}>
              참여가 확정되었어요.
              {hasGoods && (
                <>
                  <br />
                  함께 주문하신 제품의 <span className={applyStyles.successAccent}>수령 안내</span>도 함께 보내드립니다.
                </>
              )}
              <br />
              모임 안내는 신청하신 <span className={applyStyles.successAccent}>연락처</span>로 보내드립니다.
            </p>
          ) : (
            <p className={`${applyStyles.successBody} ${cal.doneBody}`}>
              주문이 완료되었어요.
              <br />
              제품 <span className={applyStyles.successAccent}>수령 방법(현장 수령/택배)</span>은 연락처로 안내드립니다.
            </p>
          )}
        </FadeUp>
        <FadeUp delay={0.6}>
          <p className={`${applyStyles.successCloser} ${cal.doneCloser}`}>레이지데이 북클럽에서 곧 만나요.</p>
        </FadeUp>
      </div>
    </main>
  )
}

/* ── 결제 후 신청서 (선결제→후신청) ──────────────────────────
   기존 원데이 신청 폼과 같은 문항·서식(apply/page.module.css 재사용).
   회차는 결제로 이미 확정 — 선택이 아니라 표시. 이름·연락처는 프리필(수정 가능). */

type FormErrors = Partial<Record<"name" | "gender" | "age" | "phone" | "marketingConsent" | "_form", string>>

function FormField({
  label,
  name,
  required,
  optional,
  error,
  children,
}: {
  label: string
  name: string
  required?: boolean
  optional?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className={applyStyles.formGroup}>
      <label htmlFor={name} className={applyStyles.formLabel}>
        {label}
        {required && <span className={applyStyles.required}>*</span>}
        {optional && <span className={applyStyles.optional}>(선택)</span>}
      </label>
      {children}
      {error && <p className={applyStyles.errorText}>{error}</p>}
    </div>
  )
}

function PostPayApplyForm({
  orderId,
  sessions,
  onDone,
}: {
  orderId: string
  sessions: typeof ONEDAY.sessions
  onDone: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [marketingConsent, setMarketingConsent] = useState(false)
  // 프리필 — checkout 이 결제 직전 저장한 주문자 정보 (같은 orderId 일 때만)
  const [prefill, setPrefill] = useState<{ name: string; phone: string }>({ name: "", phone: "" })
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lz-buyer")
      if (!raw) return
      const saved = JSON.parse(raw) as SavedBuyer
      if (saved.orderId === orderId) {
        setPrefill({ name: saved.name || "", phone: formatPhone(saved.phone || "") })
      }
    } catch {}
  }, [orderId])

  // 접수 실패 시 카카오톡으로 대신 보낼 수 있게 입력 내용을 보관·복사 (기존 구제 문법)
  const [failedText, setFailedText] = useState("")
  const [failCopied, setFailCopied] = useState(false)
  async function copyFailed() {
    if (await copyText(failedText)) {
      setFailCopied(true)
      setTimeout(() => setFailCopied(false), 2500)
    }
  }

  function clearError(name: keyof FormErrors) {
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const meetingDates = sessions.map((s) => `${s.month}/${s.day} ${s.work}`).join(", ")

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const newErrors: FormErrors = {}

    const name = (data.get("name") as string)?.trim() || ""
    const gender = (data.get("gender") as string) || ""
    const age = (data.get("age") as string)?.trim() || ""
    const phone = (data.get("phone") as string)?.trim() || ""
    const greeting = (data.get("greeting") as string)?.trim() || ""
    const instagram = (data.get("instagram") as string)?.trim() || ""

    if (!name) newErrors.name = "이름을 입력해주세요."
    if (!gender) newErrors.gender = "성별을 선택해주세요."
    if (!age) newErrors.age = "나이를 입력해주세요."
    if (!phone) newErrors.phone = "전화번호를 입력해주세요."
    if (!marketingConsent) newErrors.marketingConsent = "마케팅 활용 및 개인정보 수집 동의가 필요합니다."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstKey = Object.keys(newErrors)[0]
      const target =
        firstKey === "marketingConsent"
          ? document.getElementById("marketingConsent")
          : document.querySelector(`[name="${firstKey}"]`)
      target?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setErrors({})
    setLoading(true)
    const payload = {
      type: "oneday",
      name,
      gender,
      age,
      phone,
      greeting,
      instagram,
      meetingDates,
      orderId, // 결제와 신청을 잇는 열쇠 — 시트 '주문번호' 컬럼 (GAS ensureColumn)
      marketingConsent: marketingConsent ? "동의" : "미동의",
      consentAt: new Date().toISOString(), // 동의 시각 기록 (법적 증빙)
    }

    try {
      const res = await fetch("/api/lazyday/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json().catch(() => null)
      if (!res.ok || !result?.success) throw new Error("submit failed")
    } catch {
      setLoading(false)
      setFailedText(
        [
          "[레이지데이 일회성 모임 신청 (결제 완료)]",
          `주문번호: ${orderId}`,
          `신청 회차: ${meetingDates || "-"}`,
          `이름: ${name}`,
          `성별: ${gender}`,
          `나이: ${age}`,
          `연락처: ${phone}`,
          `한 줄 인사: ${greeting || "-"}`,
          `인스타그램: ${instagram || "-"}`,
        ].join("\n"),
      )
      setErrors({
        _form: "일시적인 오류로 신청서가 접수되지 않았어요. 결제는 정상 완료된 상태이니 안심하세요. 입력하신 내용은 그대로 남아 있으니, 잠시 후 '신청서 제출하기'를 다시 눌러주세요.",
      })
      reportClientError("oneday_postpay_submit", "결제 후 신청서 접수 실패")
      return
    }

    // 세 번째 인자는 서버 미러(전환 API) 전용 — 픽셀 파라미터는 불변.
    // orderId 는 이 사이트에서 유일한 내부 식별자라 external_id 로 쓴다(서버에서 해싱)
    trackStandard(
      "Lead",
      { content_name: "OneDayTalk_신청완료" },
      { phone, externalId: orderId, trafficSrc: readTrafficSrc() ?? undefined },
    )
    trackEvent("oneday_apply_complete", { program: "book_club" })
    setLoading(false)
    onDone()
  }

  return (
    <main className={applyStyles.applyPage} data-track-section="bookclub_oneday_postpay">
      {loading && <SubmitOverlay label="신청서 접수 중..." />}
      <div className={applyStyles.container}>
        <FadeUp y={12} duration={0.9}>
          <div className={applyStyles.header}>
            <img
              src="/linky-lounge/book-club/ldbc-logo-text.png"
              alt="레이지데이 북클럽"
              className={applyStyles.headerImage}
            />
            <h1 className={applyStyles.headerTitle}>
              결제가 완료되었습니다.
              <br />
              <span className={applyStyles.headerSeason}>신청서</span>를 작성해주세요
            </h1>
          </div>
        </FadeUp>

        {/* 결제 확정 안심 문구 + 확정된 회차 표시 (선택이 아니라 확인) */}
        <section className={applyStyles.scheduleNotice}>
          <div className={cal.infoRows}>
            {sessions.map((s) => (
              <div key={sessionKey(s)} className={cal.infoRow}>
                <span className={cal.infoLabel}>{s.label}</span>
                <span className={cal.infoValue}>
                  {sessionDateLabel(s)} {s.time} · 『{s.work}』
                </span>
              </div>
            ))}
            <div className={cal.infoRow}>
              <span className={cal.infoLabel}>장소</span>
              <span className={cal.infoValue}>링키라운지(사당역 도보 3분)</span>
            </div>
            <p className={cal.infoNote}>
              *위 모임의 결제가 완료되었어요. 아래 신청서를 제출하시면 참여가 최종 확정됩니다.
            </p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className={applyStyles.form} noValidate>
          <FormField label="이름" name="name" required error={errors.name}>
            <input
              id="name"
              type="text"
              name="name"
              key={`n-${prefill.name}`}
              defaultValue={prefill.name}
              className={`${applyStyles.input} ${errors.name ? applyStyles.inputError : ""}`}
              placeholder="성함을 기입해주세요."
              onChange={() => clearError("name")}
            />
          </FormField>

          <div className={applyStyles.formGroup}>
            <span className={applyStyles.formLabel}>
              성별
              <span className={applyStyles.required}>*</span>
            </span>
            <div className={applyStyles.radioGroup}>
              <label className={applyStyles.radioLabel}>
                <input type="radio" name="gender" value="남성" onChange={() => clearError("gender")} />
                <span className={applyStyles.radioText}>남성</span>
              </label>
              <label className={applyStyles.radioLabel}>
                <input type="radio" name="gender" value="여성" onChange={() => clearError("gender")} />
                <span className={applyStyles.radioText}>여성</span>
              </label>
            </div>
            {errors.gender && <p className={applyStyles.errorText}>{errors.gender}</p>}
          </div>

          <FormField label="나이" name="age" required error={errors.age}>
            <input
              id="age"
              type="text"
              name="age"
              inputMode="numeric"
              autoComplete="off"
              maxLength={3}
              className={`${applyStyles.input} ${errors.age ? applyStyles.inputError : ""}`}
              placeholder="만 나이를 입력해주세요."
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "")
                clearError("age")
              }}
            />
          </FormField>

          <FormField label="전화번호" name="phone" required error={errors.phone}>
            <input
              id="phone"
              type="tel"
              name="phone"
              inputMode="numeric"
              key={`p-${prefill.phone}`}
              defaultValue={prefill.phone}
              className={`${applyStyles.input} ${errors.phone ? applyStyles.inputError : ""}`}
              placeholder="휴대전화 번호를 입력해주세요."
              onChange={(e) => {
                e.target.value = formatPhone(e.target.value)
                clearError("phone")
              }}
            />
          </FormField>

          <FormField label="한 줄 인사" name="greeting" optional>
            <input
              id="greeting"
              type="text"
              name="greeting"
              className={applyStyles.input}
              placeholder="짧은 인삿말도, 간단한 소개도 모두 좋습니다."
            />
          </FormField>

          <FormField label="인스타그램 아이디" name="instagram" optional>
            <input
              id="instagram"
              type="text"
              name="instagram"
              className={applyStyles.input}
              placeholder="@your_instagram"
            />
          </FormField>

          <div className={applyStyles.consentBox}>
            <label htmlFor="marketingConsent" className={applyStyles.consentLabel}>
              <input
                id="marketingConsent"
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => {
                  setMarketingConsent(e.target.checked)
                  if (e.target.checked) clearError("marketingConsent")
                }}
                className={applyStyles.checkbox}
              />
              <span className={applyStyles.consentText}>
                마케팅 활용 및 개인정보 수집에 동의합니다.{" "}
                <span className={applyStyles.requiredTag}>(필수)</span>
              </span>
            </label>
            <p className={applyStyles.consentNote}>
              수집된 개인정보는 레이지데이 북클럽 운영 및 마케팅 목적으로만 활용되며, 관계 법령에 따라 안전하게 보호됩니다.
            </p>
            {errors.marketingConsent && <p className={applyStyles.errorText}>{errors.marketingConsent}</p>}
          </div>

          {errors._form && (
            <div className={applyStyles.rescueBox} role="alert">
              <p className={applyStyles.formError}>{errors._form}</p>
              <p className={applyStyles.rescueGuide}>{KAKAO_SUBMIT_GUIDE}</p>
              <button type="button" className={applyStyles.rescueCopyBtn} onClick={copyFailed}>
                {failCopied ? "복사됐어요" : "신청 내용 복사"}
              </button>
              <a
                href={KAKAO_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={applyStyles.rescueLink}
                onClick={() => reportClientError("oneday_postpay_kakao", "결제 후 신청서 실패 → 카카오톡 제출")}
              >
                {KAKAO_SUBMIT_LABEL}
              </a>
            </div>
          )}

          <button type="submit" className={applyStyles.submitButton} disabled={loading}>
            {loading ? "접수 중입니다..." : "신청서 제출하기"}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function OnedayCheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  )
}
