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
import { CHECKOUT_PATH } from "@/lib/payments/config"
import { stashOrderer } from "@/lib/payments/orderer"
import { TurtleLoader } from "../../../TurtleLoader"
import styles from "../../../home.module.css"
import form from "./meeting-apply.module.css"
import { useBasePath } from "@/hooks/use-base-path"

type Meeting = {
  slug: string
  title: string
  date: string
  place: string
  price: number | null
  /** 토스 링크페이 주소 — MEETING_PAY_ROUTE="linkpay" 일 때만 온다 */
  payUrl?: string
  /** 주문 코드 — 우리 결제창으로 갈 때만. 폼이 useBasePath 로 URL 을 조립한다 */
  orderCode?: string
  sessions?: { week: string; date: string; work: string }[]
  /** 알림톡 '비고' 칸 — 전달할 게 있는 모임만 채운다 (one-day-config 의 같은 필드) */
  notice?: string
}

function formatPhone(value: string) {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function MeetingApplyForm({ meeting }: { meeting: Meeting }) {
  // 결제창 URL — 호스트마다 base 가 다르다 (lazy-club.com 은 루트, 북클럽은 /lazyday).
  // 카트의 checkoutHref 와 같은 문법 (2026-08-31 결제 목적지 내부화)
  const [payCopied, setPayCopied] = useState(false)
  const base = useBasePath()
  // 링크페이는 외부 주소(새 창), 우리 결제창은 같은 탭 — 아래 렌더가 갈린다
  const isLinkPay = Boolean(meeting.payUrl)
  const payHref = meeting.payUrl ?? `${base}${CHECKOUT_PATH}?items=${meeting.orderCode}`
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [gender, setGender] = useState<string | null>(null)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  /** 접수 실패 시 카카오로 대신 보낼 원문 (북클럽 구제 문법 — 복사 버튼과 짝) */
  const [failedText, setFailedText] = useState("")
  const [failCopied, setFailCopied] = useState(false)

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
    // 결제 페이지에서 **뒤로가기**로 돌아오면 브라우저가 bfcache 로 이 페이지를
    // "로더 켜진 채 떠난 그 상태" 그대로 되살린다 — useEffect 는 다시 안 돈다.
    // pageshow(persisted)에서 로더를 걷고 doneKey 를 다시 읽어 완료 화면을 세운다
    // (자동 이동 도입으로 생긴 함정, 2026-09-01).
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      setLoading(false)
      try {
        if (sessionStorage.getItem(doneKey)) setDone(true)
      } catch {}
    }
    window.addEventListener("pageshow", onShow)
    return () => window.removeEventListener("pageshow", onShow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 제목의 nbsp 는 시트에서 눈에 거슬려 보통 공백으로 되돌린다 */
  const plainTitle = meeting.title.replace(/\u00A0/g, " ")
  /** 시트 '회차' 칸 — **4주 과정만** 채운다(단일 회차는 빈칸). 한 칸에 담아야 해 잇는
   *  수밖에 없는 자리라 가운뎃점 대신 쉼표로 (운영자 2026-08-21 "할거면 소괄호 쓰는데") */
  const meetingSessions = meeting.sessions
    ? meeting.sessions.map((s) => `${s.week} ${s.date}`).join(", ")
    : ""
  /** ⚠ **전환기 폴백** — 종전에는 제목·회차·일시를 이 한 문자열로 뭉쳐 보냈고, 시트도
   *  '모임 일자' 한 칸에 그대로 받았다(운영자: "너무 많은 정보가 한 칼럼에 들어오므로").
   *  이제 아래 payload 가 항목별로 나눠 보내지만, 이 값도 **당분간 함께** 보낸다 —
   *  실배포 GAS 가 되돌려지더라도 '모임' 칸이 통째로 비지 않게(§6 뒤집힘 대비).
   *  전환이 안정되면 이 필드와 GAS 쪽 폴백을 같이 걷어낸다 (docs/lazyclub-sheets-plan.md §3C) */
  const meetingDates = meetingSessions
    ? `${plainTitle} (${meetingSessions})`
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
          // 칼럼 분해 (2026-08-24) — 시트의 모임 / 모임 slug / 일시 / 회차 칸에 1:1 대응
          meetingTitle: plainTitle,
          meetingSlug: meeting.slug,
          meetingDate: meeting.date,
          meetingSessions,
          meetingDates, // 전환기 폴백 (위 주석)
          // 알림톡 '비고' — 2026-09-03 부터 알림톡은 **결제 완료 시점**에 서버가 보내며
          // notice 도 서버가 one-day-config 에서 직접 읽는다(lib/paid-alimtalk). 이 값은
          // 시트 계약 호환용으로만 남긴다 — GAS 의 oneday 핸들러는 더 이상 알림톡을 보내지 않는다.
          notice: meeting.notice ?? "",
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
          `모임: ${plainTitle}`,
          `일시: ${meeting.date}`,
          ...(meetingSessions ? [`회차: ${meetingSessions}`] : []),
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
    // 결제 화면이 주문자 정보를 다시 묻지 않도록 넘겨 둔다 (운영자 2026-09-01
    // "굳이 2단계로 하지 말고"). 링크페이로 나가는 경우엔 우리 화면이 아니라 무의미하지만,
    // 경로가 바뀌어도(MEETING_PAY_ROUTE) 값은 남아 있는 편이 안전하다.
    stashOrderer({ name, phone })
    try {
      sessionStorage.setItem(doneKey, "1")
    } catch {}
    // 접수 성공 → **결제 페이지로 바로 이동** (운영자 2026-09-01 자동 이동 승인).
    // 종전 "직접 누르게"(2026-08-21)의 근거는 링크페이 시절의 외부 새 창·팝업 차단이었다 —
    // 지금은 같은 탭의 우리 결제 페이지라 그 위험이 없다. 완료 화면(결제하기 버튼)은
    // 없애지 않는다: 뒤로가기·재방문(doneKey 복원)과 링크페이 경로의 착지점이다.
    // ⚠ done 을 세우지 않고 로더를 유지한 채 떠난다 — `if (done)` 분기가 로더보다
    //   먼저라 done 을 세우면 완료 화면이 한 박자 스쳤다 사라진다. 이동이 막히는
    //   예외 상황만 3초 뒤 로더를 걷고 완료 화면(수동 결제하기)으로 폴백한다.
    if (!isLinkPay) {
      setTimeout(() => {
        setLoading(false)
        setDone(true)
      }, 3000)
      window.location.assign(payHref)
      return
    }
    setLoading(false)
    setDone(true)
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }

  // ── 접수 완료 화면 — 정상 경로의 정거장이 아니다 (2026-09-01 자동 이동 이후).
  //    여기 오는 경우: ① 결제 페이지에서 뒤로가기·재방문(doneKey 복원) ② 링크페이
  //    경로(외부 새 창이라 손님이 직접 누른다) ③ 자동 이동이 막혔을 때의 폴백 ──
  if (done) {
    return (
      <div className={form.wrap}>
        <div className={styles.indexHead}>
          <div className={styles.sectionTitle}>
            <span>
              <span>신청 정보</span>
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
        {/* 목적지가 둘이라 렌더도 갈린다 (MEETING_PAY_ROUTE).
            · 링크페이(외부): 새 창 + 주소 복사 구제 — 인앱 브라우저·팝업 차단 환경 대비
            · 우리 결제창(내부): 같은 탭이라 구제가 필요 없다 */}
        {isLinkPay ? (
          <>
            <a href={payHref} target="_blank" rel="noopener noreferrer" className={form.actionBtn}>
              결제하기
            </a>
            <p className={form.infoNote}>
              결제 페이지는 새 창에서 열립니다. 창이 열리지 않으면 아래 주소를 복사해 브라우저에
              붙여넣어 주세요.
            </p>
            <p className={form.payUrlLine}>
              <span className={form.payUrlText}>{payHref}</span>
              <button
                type="button"
                className={form.linkBtn}
                onClick={async () => {
                  setPayCopied(await copyText(payHref))
                }}
              >
                {payCopied ? "복사됨" : "주소 복사"}
              </button>
            </p>
          </>
        ) : (
          <a href={payHref} className={form.actionBtn}>
            결제하기
          </a>
        )}
        <p className={form.infoNote}>
          결제가 끝나면 창을 닫으셔도 좋아요. 문제가 있으면{" "}
          <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer">
            카카오톡 채널
          </a>
          로 알려주세요.
        </p>
      </div>
    )
  }

  return (
    <div className={form.wrap}>
      {/* ① 제출 중 전면 로더 — 진행 인지 + 중복 제출 차단 (트리 톤) */}
      {loading && (
        <div className={form.busy}>
          <TurtleLoader label="로딩 중" />
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
          {/* 선택 동의로 남는 것을 명시 (2026-09-01) — 위 '보유 기간: 모임 종료 후 1년'
              은 신청서 본문이고, 동의하신 분의 이름·연락처는 그 동의를 근거로 남는다 */}
          <p className={form.consentNote}>
            <span>동의하신 경우 안내를 위해 이름·연락처를 동의 철회 시까지 보관합니다.</span>
          </p>
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
          {loading ? "로딩 중" : "다음"}
        </button>
      </form>
    </div>
  )
}
