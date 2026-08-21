"use client"

/**
 * 모임 신청 폼 → GAS 접수 → 토스페이먼츠 결제 안내 (운영자 2026-08-21 여정).
 *
 * **서식은 레이지클럽(워크룸) 문법이다** (운영자 2차 정정: "레이지클럽 기반 구매페이지
 * 디자인양식으로" — 첫 판의 북클럽 신청서 CSS 차용 철회). 페이지 골격(indexHead·
 * sectionTitle)은 다른 하위 페이지와 같이 home.module.css 를 쓰고, 폼 자체는
 * meeting-apply.module.css(신규, §9 미임포트 — 값은 트리 문법 사본)로 그린다.
 *
 * 여정이 지켜야 할 것 (운영자: "전송이 온전히 되고, 전송 중 로딩은 인지시키고,
 * 전송 후 결제해야 함을 인지시켜서 직접 누르게 하고"):
 *   ① 제출 중 전면 로더 — 진행 인지 + 중복 제출 차단
 *   ② GAS 접수가 **성공한 뒤에만** 결제 안내(실패 시 폼·입력값 유지 + 카카오 구제)
 *   ③ 자동 리다이렉트 없음 — '결제하기'를 **손님이 직접** 누른다 (새 탭)
 *
 * ⚠ 이 여정에는 orderId 가 없다(결제창을 우리가 띄우지 않음) — `/api/lazyday/apply`
 *   의 markSubmitted 는 orderId 가 비면 조용히 건너뛴다. 금액 검증은 토스 상품
 *   페이지가 한다.
 * ⚠ 완료 전환 시 scrollTo(0) — 제출 버튼이 폼 하단이라 그 자리에 머물면 완료 화면이
 *   뷰포트 위로 빠져 빈 화면으로 보인다(1차 실측). 스크롤 리빌(FadeUp)도 같은 이유로
 *   쓰지 않는다 — 상태 전환 요소에는 관찰자가 안 걸려 opacity 0 으로 남는다.
 */

import { useState } from "react"
import styles from "../../../home.module.css"
import form from "./meeting-apply.module.css"

type Meeting = {
  slug: string
  title: string
  date: string
  place: string
  price: number | null
  payUrl: string
  sessions?: { week: string; date: string; work: string }[]
}

/** 카카오톡 구제 창구 — 접수 실패 시 손으로라도 접수되게 (기존 신청서와 같은 채널) */
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
  const [gender, setGender] = useState<string | null>(null)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  const clearError = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p))

  /** 시트 '신청 회차' 칸 문자열 — 4주 과정은 회차를 펼쳐 적는다 */
  const meetingDates = meeting.sessions
    ? `${meeting.title} · ${meeting.sessions.map((s) => `${s.week} ${s.date}`).join(" / ")}`
    : `${meeting.title} · ${meeting.date}`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    const data = new FormData(e.currentTarget)
    const v = (k: string) => ((data.get(k) as string) ?? "").trim()
    const name = v("name")
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
          : first === "gender"
            ? document.getElementById("gender-choices")
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
    setDone(true)
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }

  // ── 접수 완료 → 결제 안내 (손님이 직접 누른다) ──
  if (done) {
    return (
      <div className={form.wrap}>
        <div className={styles.indexHead}>
          <div className={styles.sectionTitle}>
            <span>
              <span>신청 접수 완료</span>
            </span>
          </div>
        </div>
        <div className={form.infoRows}>
          <div className={form.infoRow}>
            <span className={form.infoLabel}>모임</span>
            <span className={form.infoValue}>{meetingDates}</span>
          </div>
          {meeting.price != null && (
            <div className={form.infoRow}>
              <span className={form.infoLabel}>참가비</span>
              <span className={form.infoValue}>{meeting.price.toLocaleString("ko-KR")}원</span>
            </div>
          )}
        </div>
        <p>
          신청서가 접수되었습니다. 아직 참여가 확정된 것은 아니에요 — 아래 <strong>결제하기</strong>로
          결제까지 마치면 신청이 최종 확정됩니다.
        </p>
        <a href={meeting.payUrl} target="_blank" rel="noopener noreferrer" className={form.actionBtn}>
          결제하기
        </a>
        <p className={form.infoNote}>결제 페이지는 새 창에서 열립니다. 결제가 끝나면 창을 닫으셔도 좋아요.</p>
      </div>
    )
  }

  return (
    <div className={form.wrap}>
      {/* ① 제출 중 전면 로더 — 진행 인지 + 중복 제출 차단 (트리 톤) */}
      {loading && (
        <div className={form.busy} role="status" aria-live="polite">
          <span>신청서 접수 중...</span>
        </div>
      )}

      <div className={styles.indexHead}>
        <div className={styles.sectionTitle}>
          <span>
            <span>신청</span>
          </span>
        </div>
      </div>

      <div className={form.infoRows}>
        <div className={form.infoRow}>
          <span className={form.infoLabel}>모임</span>
          <span className={form.infoValue}>{meeting.title}</span>
        </div>
        <div className={form.infoRow}>
          <span className={form.infoLabel}>일시</span>
          <span className={form.infoValue}>
            {meeting.sessions
              ? meeting.sessions.map((s) => (
                  <span key={s.week} style={{ display: "block" }}>
                    {s.week} · {s.date}
                  </span>
                ))
              : meeting.date}
          </span>
        </div>
        <div className={form.infoRow}>
          <span className={form.infoLabel}>장소</span>
          <span className={form.infoValue}>{meeting.place}</span>
        </div>
        {meeting.price != null && (
          <div className={form.infoRow}>
            <span className={form.infoLabel}>참가비</span>
            <span className={form.infoValue}>{meeting.price.toLocaleString("ko-KR")}원</span>
          </div>
        )}
        <p className={form.infoNote}>
          신청서를 제출하시면 결제 안내가 이어집니다. 결제까지 마쳐야 참여가 확정돼요.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className={form.field}>
          <label htmlFor="name" className={form.fieldLabel}>
            이름<span className={form.required}>*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`${form.input} ${errors.name ? form.inputError : ""}`}
            placeholder="성함을 기입해주세요."
            onChange={() => clearError("name")}
          />
          {errors.name && <p className={form.errorText}>{errors.name}</p>}
        </div>

        <div className={form.field}>
          <span className={form.fieldLabel}>
            성별<span className={form.required}>*</span>
          </span>
          <div className={form.choices} id="gender-choices">
            {["남성", "여성"].map((g) => (
              <button
                key={g}
                type="button"
                className={`${form.choice} ${gender === g ? form.choiceOn : ""}`}
                aria-pressed={gender === g}
                onClick={() => {
                  setGender(g)
                  clearError("gender")
                }}
              >
                {g}
              </button>
            ))}
          </div>
          {errors.gender && <p className={form.errorText}>{errors.gender}</p>}
        </div>

        <div className={form.field}>
          <label htmlFor="age" className={form.fieldLabel}>
            나이<span className={form.required}>*</span>
          </label>
          <input
            id="age"
            name="age"
            type="text"
            inputMode="numeric"
            maxLength={3}
            className={`${form.input} ${errors.age ? form.inputError : ""}`}
            placeholder="만 나이를 입력해주세요."
            onChange={(e) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, "")
              clearError("age")
            }}
          />
          {errors.age && <p className={form.errorText}>{errors.age}</p>}
        </div>

        <div className={form.field}>
          <label htmlFor="phone" className={form.fieldLabel}>
            전화번호<span className={form.required}>*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            className={`${form.input} ${errors.phone ? form.inputError : ""}`}
            placeholder="휴대전화 번호를 입력해주세요."
            onChange={(e) => {
              e.target.value = formatPhone(e.target.value)
              clearError("phone")
            }}
          />
          {errors.phone && <p className={form.errorText}>{errors.phone}</p>}
        </div>

        <div className={form.field}>
          <label htmlFor="greeting" className={form.fieldLabel}>한 줄 인사</label>
          <input
            id="greeting"
            name="greeting"
            type="text"
            className={form.input}
            placeholder="짧은 인삿말도, 간단한 소개도 모두 좋습니다."
          />
        </div>

        <div className={form.field}>
          <label htmlFor="instagram" className={form.fieldLabel}>인스타그램 아이디</label>
          <input
            id="instagram"
            name="instagram"
            type="text"
            className={form.input}
            placeholder="@your_instagram"
          />
        </div>

        {/* 동의 분리 (2026-07-27 원칙): 필수=개인정보 / 선택=마케팅. 선택을 필수처럼 걸지 않는다 */}
        <div className={form.consent}>
          <label htmlFor="privacyConsent" className={form.consentLabel}>
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
              개인정보 수집·이용에 동의합니다. <span className={form.required}>(필수)</span>
            </span>
          </label>
          <p className={form.consentNote}>
            수집 항목: 이름·성별·나이·연락처(선택 입력 포함) · 목적: 모임 운영 및 안내 · 보유 기간: 모임 종료 후 1년
          </p>
          {errors.privacyConsent && <p className={form.errorText}>{errors.privacyConsent}</p>}

          <label htmlFor="marketingConsent" className={form.consentLabel}>
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
          <div className={form.rescue} role="alert">
            <p className={form.formError}>{errors._form}</p>
            <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer">
              카카오톡으로 보내기
            </a>
          </div>
        )}

        <button type="submit" className={form.actionBtn} disabled={loading}>
          {loading ? "접수 중입니다..." : "신청서 제출하기"}
        </button>
      </form>
    </div>
  )
}
