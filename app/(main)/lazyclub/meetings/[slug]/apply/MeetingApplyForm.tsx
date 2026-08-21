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

import { useEffect, useState } from "react"
import {
  copyText,
  KAKAO_CHAT_URL,
  KAKAO_SUBMIT_GUIDE,
  KAKAO_SUBMIT_LABEL,
  reportClientError,
} from "@/app/(main)/lazyday/support"
import { TurtleLoader } from "../../../TurtleLoader"
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
  /** 접수 실패 시 카카오로 대신 보낼 원문 (북클럽 구제 문법 — 복사 버튼과 짝) */
  const [failedText, setFailedText] = useState("")
  const [failCopied, setFailCopied] = useState(false)
  const [payCopied, setPayCopied] = useState(false)

  const clearError = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p))

  /** 접수 완료 상태를 새로고침에서도 살린다 — done 화면이 결제 링크를 들고 있어서,
   *  실수로 새로고침하면 "접수는 됐는데 결제로 가는 길"이 사라진다(리스크 D).
   *  ⚠ useEffect 복원(초깃값 X) — 서버 스냅숏과 첫 클라이언트 렌더가 어긋나면
   *  하이드레이션 불일치가 난다 (거북이 히트원 사고와 같은 계열) */
  const doneKey = `lzc-applied-${meeting.slug}`
  useEffect(() => {
    try {
      if (sessionStorage.getItem(doneKey)) setDone(true)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 시트 '신청 회차' 칸 문자열 — 4주 과정은 회차를 펼쳐 적는다.
   *  한 칸에 담아야 해 잇는 수밖에 없는 자리 — 가운뎃점 대신 소괄호로 (운영자 2026-08-21
   *  "할거면 소괄호 쓰는데"). 제목의 nbsp 는 시트에서 눈에 거슬려 보통 공백으로 되돌린다 */
  const plainTitle = meeting.title.replace(/\u00A0/g, " ")
  const meetingDates = meeting.sessions
    ? `${plainTitle} (${meeting.sessions.map((s) => `${s.week} ${s.date}`).join(", ")})`
    : `${plainTitle} (${meeting.date})`

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
    // ⚠ 타임아웃 없는 fetch 는 GAS 가 매달리면 로더가 영원히 떠 있는다(리스크 A) —
    //   25초에서 끊고 안내한다. 끊긴 시점에 실제로는 접수됐을 수 있으므로(중복 가능)
    //   문구도 "접수 여부 미확인"으로 쓴다 — 유실(더 나쁨)보다 중복(시트에서 정리)이 낫다
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 25_000)
    let timedOut = false
    try {
      const res = await fetch("/api/lazyday/apply", {
        method: "POST",
        signal: ac.signal,
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
    } catch (err) {
      timedOut = err instanceof DOMException && err.name === "AbortError"
      setLoading(false)
      // 구제 원문 — 복사해 카카오로 보내면 사람이 접수한다 (북클럽 문법)
      setFailedText(
        [
          `[레이지클럽 모임 신청]`,
          `모임: ${meetingDates}`,
          `이름: ${name}`,
          `성별: ${gender}`,
          `나이: ${age}`,
          `연락처: ${phone}`,
          `한 줄 인사: ${v("greeting") || "-"}`,
          `인스타그램: ${v("instagram") || "-"}`,
        ].join("\n"),
      )
      setFailCopied(false)
      setErrors({
        _form: timedOut
          ? "응답이 늦어 접수 여부를 확인하지 못했어요. 입력하신 내용은 그대로 남아 있으니 잠시 후 한 번만 다시 제출해주세요 — 혹시 중복으로 접수되어도 저희가 정리합니다."
          : "일시적인 오류로 신청서가 접수되지 않았어요. 입력하신 내용은 그대로 남아 있으니 잠시 후 다시 눌러주세요.",
      })
      // 실패 사실을 서버에 남긴다 (개인정보 미전송) — 운영자가 유실을 인지할 수 있게
      reportClientError(timedOut ? "lzc_apply_timeout" : "lzc_apply_submit", meeting.slug)
      return
    } finally {
      clearTimeout(timer)
    }
    setLoading(false)
    setDone(true)
    try {
      sessionStorage.setItem(doneKey, "1")
    } catch {}
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
        {/* 운영자 원문 (2026-08-21, "이렇게 담백하게") */}
        <p>신청서가 접수되었습니다. 결제까지 마치면 신청이 최종 확정됩니다.</p>
        <a href={meeting.payUrl} target="_blank" rel="noopener noreferrer" className={form.actionBtn}>
          결제하기
        </a>
        {/* 결제 링크 구제 (리스크 C) — 인앱 브라우저·팝업 차단으로 새 창이 안 열리는
            환경이 있다. 주소를 눈에 보이게 두고 복사까지 제공해 손으로 열 수 있게 한다 */}
        <p className={form.infoNote}>
          결제 페이지는 새 창에서 열립니다. 창이 열리지 않으면 아래 주소를 복사해 브라우저에
          붙여넣어 주세요.
        </p>
        <p className={form.payUrlLine}>
          <span className={form.payUrlText}>{meeting.payUrl}</span>
          <button
            type="button"
            className={form.linkBtn}
            onClick={async () => {
              setPayCopied(await copyText(meeting.payUrl))
            }}
          >
            {payCopied ? "복사됨" : "주소 복사"}
          </button>
        </p>
        <p className={form.infoNote}>
          결제가 끝나면 창을 닫으셔도 좋아요. 문제가 있으면{" "}
          <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer">
            카카오톡 채널
          </a>
          로 알려주세요.
        </p>
        {/* 완료 상태를 새로고침에서 살리는 대신, 같은 탭에서 한 명 더 신청하려는 사람이
            갇히지 않도록 되돌아가는 길을 남긴다 */}
        <p className={form.infoNote}>
          <button
            type="button"
            className={form.linkBtn}
            onClick={() => {
              try {
                sessionStorage.removeItem(doneKey)
              } catch {}
              setDone(false)
            }}
          >
            다른 분 신청서 작성하기
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className={form.wrap}>
      {/* ① 제출 중 전면 로더 — 진행 인지 + 중복 제출 차단 (트리 톤) */}
      {loading && (
        <div className={form.busy}>
          <TurtleLoader label="신청서 접수 중..." />
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
                    {s.week} {s.date}
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
          {/* 세 항목을 가운뎃점으로 잇던 한 줄을 각자 한 줄로 (운영자 2026-08-21).
              항목 안의 '이름·성별·나이'는 띄어쓰기 없는 열거용 가운뎃점이라 그대로 둔다 */}
          <p className={form.consentNote}>
            <span>수집 항목: 이름·성별·나이·연락처(선택 입력 포함)</span>
            <span>목적: 모임 운영 및 안내</span>
            <span>보유 기간: 모임 종료 후 1년</span>
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
            <p className={form.infoNote}>{KAKAO_SUBMIT_GUIDE}</p>
            <div className={form.rescueActions}>
              <button
                type="button"
                className={form.linkBtn}
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
                onClick={() => reportClientError("lzc_apply_kakao", meeting.slug)}
              >
                {KAKAO_SUBMIT_LABEL}
              </a>
            </div>
          </div>
        )}

        <button type="submit" className={form.actionBtn} disabled={loading}>
          {loading ? "접수 중입니다..." : "신청서 제출하기"}
        </button>
      </form>
    </div>
  )
}
