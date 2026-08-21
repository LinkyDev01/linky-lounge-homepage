"use client"

/**
 * 모임 신청 폼 → GAS 접수 → 토스페이먼츠 결제 안내 (운영자 2026-08-21 여정).
 *
 * 순서가 뒤집혔다: 종전 원데이 토크는 **선결제 → 후신청**(결제 위젯 승인 후
 * checkout/success 가 신청서를 띄움)이었는데, 이제 레이지클럽 모임은
 * **선신청 → 후결제**다. 결제는 우리가 띄우는 위젯이 아니라 운영자가 발급한
 * **토스페이먼츠 상품 링크**로 손님이 직접 넘어간다.
 *
 * 그래서 이 화면이 지켜야 할 것 (운영자: "전송이 온전히 되고, 전송 중 로딩은
 * 인지시키고, 전송 후 결제해야 함을 인지시켜서 직접 누르게 하고"):
 *   ① 제출 중에는 전면 로더(SubmitOverlay)로 진행을 알린다 — 중복 제출도 막힌다
 *   ② GAS 접수가 **성공한 뒤에만** 결제 안내로 넘어간다(실패 시 폼 유지 + 구제 안내)
 *   ③ 자동 리다이렉트하지 않는다 — "결제하기"를 **손님이 직접** 누른다
 *
 * ⚠ 이 여정에는 orderId 가 없다(우리가 결제창을 띄우지 않으므로). `/api/lazyday/apply`
 *   의 markSubmitted 는 orderId 가 비면 조용히 건너뛴다 — 주문 원장과 무관하게
 *   시트 접수만 이뤄진다. 금액 검증은 토스 상품 페이지가 한다.
 * ⚠ 폼 서식은 기존 신청서와 같은 `apply/page.module.css` 를 그대로 쓴다(신규 CSS 0) —
 *   §9 의 "신규 CSS 는 기존 module.css 를 import 하지 않는다" 는 CSS→CSS 규칙이고,
 *   여기는 TSX 가 기존 모듈을 소비하는 기존 선례(one-day-talk-01/apply)와 같다.
 */

import { useState } from "react"
import { SubmitOverlay } from "@/components/animation/SubmitOverlay"
import { FadeUp } from "@/components/animation/FadeUp"
import styles from "@/app/(main)/lazyday/apply/page.module.css"
import local from "./meeting-apply.module.css"

type Meeting = {
  slug: string
  title: string
  date: string
  place: string
  price: number | null
  payUrl: string
  sessions?: { week: string; date: string; work: string }[]
}

/** 카카오톡 구제 창구 — 접수가 실패했을 때 손으로라도 접수되게 (기존 신청서 문법) */
const KAKAO_CHAT_URL = "http://pf.kakao.com/_XxnHxexj/chat"

function formatPhone(value: string) {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function MeetingApplyForm({ meeting }: { meeting: Meeting }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  const clearError = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p))

  /** 시트 '신청 회차' 칸에 들어갈 문자열 — 4주 과정은 회차를 펼쳐 적는다 */
  const meetingDates = meeting.sessions
    ? `${meeting.title} · ${meeting.sessions.map((s) => `${s.week} ${s.date}`).join(" / ")}`
    : `${meeting.title} · ${meeting.date}`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    const data = new FormData(e.currentTarget)
    const v = (k: string) => ((data.get(k) as string) ?? "").trim()
    const name = v("name")
    const gender = (data.get("gender") as string) || ""
    const age = v("age")
    const phone = v("phone")

    const next: Record<string, string> = {}
    if (!name) next.name = "이름을 입력해주세요."
    if (!gender) next.gender = "성별을 선택해주세요."
    if (!age) next.age = "나이를 입력해주세요."
    if (!phone) next.phone = "전화번호를 입력해주세요."
    if (!privacyConsent) next.privacyConsent = "개인정보 수집·이용 동의가 필요합니다."
    if (Object.keys(next).length) {
      setErrors(next)
      const first = Object.keys(next)[0]
      const el =
        first === "privacyConsent"
          ? document.getElementById("privacyConsent")
          : document.querySelector(`[name="${first}"]`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const res = await fetch("/api/lazyday/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "oneday",
          name,
          gender,
          age,
          phone,
          greeting: v("greeting"),
          instagram: v("instagram"),
          meetingDates,
          // 결제를 우리가 띄우지 않아 주문번호가 없다 — 시트 '주문번호'는 비운다
          orderId: "",
          marketingConsent: marketingConsent ? "동의" : "미동의",
          consentAt: new Date().toISOString(), // 필수 동의 시각 (법적 증빙)
        }),
      })
      const result = await res.json().catch(() => null)
      if (!res.ok || !result?.success) throw new Error("submit failed")
    } catch {
      setLoading(false)
      setErrors({
        _form:
          "일시적인 오류로 신청서가 접수되지 않았어요. 입력하신 내용은 그대로 남아 있으니 잠시 후 다시 눌러주세요. 계속 안 되면 카카오톡 채널로 보내주시면 저희가 대신 접수해 드릴게요.",
      })
      return
    }
    setLoading(false)
    setDone(true) // ⚠ 접수 성공 후에만 결제 안내로 — 자동 이동은 하지 않는다
    // ⚠ 스크롤을 맨 위로 되돌린다 — 제출 버튼은 폼 하단이라 그 자리에 머물면 완료
    //   화면(짧다)이 통째로 뷰포트 위로 빠져 "아무것도 안 뜬 화면"이 된다(실측)
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }

  // ── 접수 완료 → 결제 안내 (손님이 직접 누른다) ──
  if (done) {
    return (
      <main className={`${styles.applyPage} ${local.shellOffset}`}>
        <div className={styles.container}>
          {/* ⚠ FadeUp 을 쓰지 않는다 — 스크롤 리빌용이라 상태 전환으로 나타난 요소에는
              관찰자가 안 걸려 opacity 0 으로 남을 수 있다(실측) */}
          <div className={styles.header}>
            <h1 className={styles.headerTitle}>
              신청서가 접수되었습니다.
              <br />
              <span className={styles.headerSeason}>결제</span>를 완료해주세요
            </h1>
          </div>
          <section className={styles.scheduleNotice}>
            <p className={styles.scheduleNote}>
              아직 참여가 확정된 것은 아니에요. 아래 <strong>결제하기</strong>를 눌러 결제까지 마치면
              신청이 최종 확정됩니다.
            </p>
            <p className={styles.scheduleNote}>
              {meetingDates}
              {meeting.price != null && ` · ${meeting.price.toLocaleString("ko-KR")}원`}
            </p>
          </section>
          <a
            href={meeting.payUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.submitButton} ${local.payButton}`}
          >
            결제하기
          </a>
          <p className={styles.scheduleNote} style={{ marginTop: 14 }}>
            결제 페이지는 새 창에서 열립니다. 결제가 끝나면 창을 닫으셔도 좋아요.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={`${styles.applyPage} ${local.shellOffset}`}>
      {/* ① 제출 중 전면 로더 — 진행 인지 + 중복 제출 차단 */}
      {loading && <SubmitOverlay label="신청서 접수 중..." />}
      <div className={styles.container}>
        <FadeUp y={12} duration={0.9}>
          <div className={styles.header}>
            <h1 className={styles.headerTitle}>
              {meeting.title}
              <br />
              <span className={styles.headerSeason}>신청서</span>를 작성해주세요
            </h1>
          </div>
        </FadeUp>

        <section className={styles.scheduleNotice}>
          <p className={styles.scheduleNote}>{meetingDates}</p>
          <p className={styles.scheduleNote}>장소 · {meeting.place}</p>
          <p className={styles.scheduleNote}>
            신청서를 제출하시면 <strong>결제 안내</strong>가 이어집니다. 결제까지 마쳐야 참여가 확정돼요.
          </p>
        </section>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.formLabel}>
              이름<span className={styles.required}>*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
              placeholder="성함을 기입해주세요."
              onChange={() => clearError("name")}
            />
            {errors.name && <p className={styles.errorText}>{errors.name}</p>}
          </div>

          <div className={styles.formGroup}>
            <span className={styles.formLabel}>
              성별<span className={styles.required}>*</span>
            </span>
            <div className={styles.radioGroup}>
              {["남성", "여성"].map((g) => (
                <label key={g} className={styles.radioLabel}>
                  <input type="radio" name="gender" value={g} onChange={() => clearError("gender")} />
                  <span className={styles.radioText}>{g}</span>
                </label>
              ))}
            </div>
            {errors.gender && <p className={styles.errorText}>{errors.gender}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="age" className={styles.formLabel}>
              나이<span className={styles.required}>*</span>
            </label>
            <input
              id="age"
              name="age"
              type="text"
              inputMode="numeric"
              maxLength={3}
              className={`${styles.input} ${errors.age ? styles.inputError : ""}`}
              placeholder="만 나이를 입력해주세요."
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "")
                clearError("age")
              }}
            />
            {errors.age && <p className={styles.errorText}>{errors.age}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.formLabel}>
              전화번호<span className={styles.required}>*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
              placeholder="휴대전화 번호를 입력해주세요."
              onChange={(e) => {
                e.target.value = formatPhone(e.target.value)
                clearError("phone")
              }}
            />
            {errors.phone && <p className={styles.errorText}>{errors.phone}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="greeting" className={styles.formLabel}>한 줄 인사</label>
            <input
              id="greeting"
              name="greeting"
              type="text"
              className={styles.input}
              placeholder="짧은 인삿말도, 간단한 소개도 모두 좋습니다."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="instagram" className={styles.formLabel}>인스타그램 아이디</label>
            <input
              id="instagram"
              name="instagram"
              type="text"
              className={styles.input}
              placeholder="@your_instagram"
            />
          </div>

          {/* 동의 분리 (2026-07-27 원칙): 필수=개인정보 수집·이용 / 선택=마케팅 수신.
              선택 동의를 필수로 걸거나 운영 연락의 조건으로 삼지 않는다 (개인정보 보호법 §22) */}
          <div className={styles.consentBox}>
            <label htmlFor="privacyConsent" className={styles.consentLabel}>
              <input
                id="privacyConsent"
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => {
                  setPrivacyConsent(e.target.checked)
                  if (e.target.checked) clearError("privacyConsent")
                }}
                className={styles.checkbox}
              />
              <span className={styles.consentText}>
                개인정보 수집·이용에 동의합니다. <span className={styles.requiredTag}>(필수)</span>
              </span>
            </label>
            <p className={styles.consentNote}>
              수집 항목: 이름·성별·나이·연락처(선택 입력 포함). 목적: 모임 운영 및 안내. 보유 기간: 모임 종료 후 1년.
            </p>
            {errors.privacyConsent && <p className={styles.errorText}>{errors.privacyConsent}</p>}

            <label htmlFor="marketingConsent" className={styles.consentLabel}>
              <input
                id="marketingConsent"
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.consentText}>
                마케팅 정보 수신에 동의합니다. <span className={styles.requiredTag}>(선택)</span>
              </span>
            </label>
          </div>

          {errors._form && (
            <div className={styles.rescueBox} role="alert">
              <p className={styles.formError}>{errors._form}</p>
              <a
                href={KAKAO_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.rescueLink}
              >
                카카오톡으로 보내기
              </a>
            </div>
          )}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "접수 중입니다..." : "신청서 제출하기"}
          </button>
        </form>
      </div>
    </main>
  )
}
