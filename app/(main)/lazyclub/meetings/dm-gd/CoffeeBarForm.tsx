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

/** 도망 애니메이션 길이(ms) — 운영자 2026-08-25 확정 */
const FLEE_MS = 1000
/** 착지점: 이동 가능 폭의 38% 지점 (중앙보다 조금 왼쪽 — 두 번째 클릭이 닿는 자리) */
const END_N = 0.38

/**
 * 도망 경로를 **물리로 푼다** — 좁고 긴 상자 안에서 튕기는 공 (운영자 2026-08-26
 * "사각 구획을 세로를 좁게, 가로범위는 그대로 잡아서 더 튕기는 느낌… 강하게 발사하는
 * 에너지로 확 튕기면서 점차 감속해 현재위치로 돌아오겠지").
 *
 * **구획**: 가로는 종전 그대로 0(제자리) ~ dx(오른쪽 끝), 세로는 **16px 뿐**이다
 * (BOX_TOP -12 ~ BOX_BOTTOM +4). 세로가 좁아야 위아래 벽을 자주 때리고, 그 잦은
 * 반사가 "꼬불꼬불"의 정체다 — 곡선을 손으로 그려 넣은 게 아니다.
 *
 * 모델은 세 마디다. 상태는 위치(x, y)와 속도(vx, vy).
 *   ① **발사** — 시작 순간 오른쪽 위로 큰 초속(VX0·VY0)을 준다. 가속 구간 없이
 *      처음이 가장 빠르다. 이게 "강하게 발사하는 에너지"다.
 *   ② **벽 반사 + 공기저항** — 네 벽에서 속도가 뒤집히고 REST 배만 남는다.
 *      동시에 `a = -K·v·|v|` (속도 제곱 저항)로 계속 잦아든다 → 튕길수록 짧아진다.
 *   ③ **감쇠 정착** — 절반(0.45s)을 지나면 착지점을 향한 용수철(KS)·감쇠(C)가
 *      서서히 켜져(smoothstep) 튕김이 잦아들며 제자리 근처로 돌아와 멎는다.
 *
 * **가로 초속은 이동폭에 비례**(VX0_PER_DX), 저항은 반비례(K_X = KX_UNIT/dx) —
 * 그래야 화면 폭이 달라져도 **궤적 모양이 같다**(속도만 폭에 맞춰 커진다).
 * 세로는 상자가 고정 px 라 계수도 고정이다.
 *
 * ⚠ **적분 결과를 그대로 쓰지 않는다.** 1초 시점엔 아직 완전히 멎지 않아 착지점과
 *   몇 px 어긋난다. 마지막 30% 구간에 smoothstep 가중으로 그 오차를 나눠 실어
 *   **정확히** 착지점에서 끝나게 한다 — 안 하면 애니메이션이 끝나는 순간 인라인
 *   transform 값으로 툭 튄다(애니메이션에 fill 을 주지 않으므로).
 *
 * **가로는 왕복 한 번, 세로는 완만한 물결**이다 (운영자 2026-08-26 두 라운드:
 * "왕복 2회는 과해, 1회면 충분" → "발사 각도 좀 더 좁히고, 세로범위 좀 넓혀서 덜 튀게.
 * 그냥 자연스러움이 중요해"). 가로 초속 3.4(이동폭 배수)·세로 -450px/s 로 **발사각
 * ≈24°** — 낮게 쏘고, 상자를 29px 로 넓혀(-22~+7) 위아래 반사를 잦지 않게(4회),
 * 반발도 0.65 로 낮춰 튐이 부드럽게 죽는다. 목표는 곡예가 아니라 '웃긴 부분이 있다'
 * 정도의 자연스러움이다.
 *
 * 실측(1초·60프레임, dx=295px): **오른쪽 벽 1회 · 왼쪽 벽 0회 · 위아래 벽 4회** ·
 * 착지 오차 ≈3px(꼬리 보정이 흡수).
 */
function solveFlee(dx: number, endY: number) {
  const STEPS = 60
  const BOX_TOP = -22 // 상자 위 벽 (px, 원래 높이 기준)
  const BOX_BOTTOM = 7 // 상자 아래 벽
  const VX0_PER_DX = 3.4 // 가로 초속 = 이동폭 × 이 값 (1/s)
  const VY0 = -450 // 세로 초속 (px/s, 위쪽) — 발사각 ≈24°
  const KX_UNIT = 0.1475 // 가로 저항 계수 × dx (폭 무관 궤적)
  const KY = 0.0005 // 세로 저항 계수
  const REST = 0.65 // 벽 반발계수 (0=흡수, 1=완전탄성)
  const KS = 140 // 착지점 용수철
  const C = 14 // 용수철 감쇠
  const SPRING_FROM = 0.45 // 용수철이 켜지기 시작하는 시각(초)
  const dur = FLEE_MS / 1000
  const dt = dur / STEPS
  const endX = dx * END_N

  const path: { x: number; y: number }[] = [{ x: 0, y: 0 }]
  let x = 0
  let y = 0
  let vx = VX0_PER_DX * dx
  let vy = VY0
  const kx = dx > 0 ? KX_UNIT / dx : 0
  for (let i = 1; i <= STEPS; i++) {
    const t = (i - 1) * dt
    // 용수철은 갑자기 켜지지 않는다 — smoothstep 으로 서서히 실어야 마디가 안 생긴다
    const s = t < SPRING_FROM ? 0 : (t - SPRING_FROM) / (dur - SPRING_FROM)
    const w = s * s * (3 - 2 * s)
    vx += (-kx * vx * Math.abs(vx) + w * (-KS * (x - endX) - C * vx)) * dt
    vy += (-KY * vy * Math.abs(vy) + w * (-KS * (y - endY) - C * vy)) * dt
    x += vx * dt
    y += vy * dt
    // 벽 반사 — 넘어간 만큼 되접고(그 프레임에 이미 지난 거리), 속도는 뒤집어 REST 배
    if (x > dx) {
      x = dx - (x - dx)
      vx = -REST * Math.abs(vx)
    }
    if (x < 0) {
      x = -x
      vx = REST * Math.abs(vx)
    }
    if (y < BOX_TOP) {
      y = BOX_TOP + (BOX_TOP - y)
      vy = REST * Math.abs(vy)
    }
    if (y > BOX_BOTTOM) {
      y = BOX_BOTTOM - (y - BOX_BOTTOM)
      vy = -REST * Math.abs(vy)
    }
    path.push({ x, y })
  }

  // 착지 오차를 마지막 30% 에 smoothstep 으로 흘려 넣는다
  const driftX = endX - path[STEPS].x
  const driftY = endY - path[STEPS].y
  const TAIL = 0.7
  return path.map((pt, i) => {
    const t = i / STEPS
    const s = t <= TAIL ? 0 : (t - TAIL) / (1 - TAIL)
    const w = s * s * (3 - 2 * s)
    return {
      t,
      x: Math.round((pt.x + driftX * w) * 100) / 100,
      y: Math.round((pt.y + driftY * w) * 100) / 100,
    }
  })
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
  /** 개인정보 동의 상세 접기 (기본 접힘 — apply 페이지와 동일 문법) */
  const [privacyDetailOpen, setPrivacyDetailOpen] = useState(false)
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
    const { name, age, phone, preferredWhen, intro } = readValues()
    const next: Record<string, string> = {}
    if (!name) next.name = "이름을 입력해주세요."
    if (!age) next.age = "나이를 입력해주세요."
    if (!phone) next.phone = "전화번호를 입력해주세요."
    // 자기소개는 **필수**다 (운영자 2026-08-26). 종전에는 선택이었다 — 요청되지 않은
    // 문턱을 만들지 않으려던 판단이었는데, 운영자가 필수로 확정했다.
    if (!intro) next.intro = "자기소개를 적어주세요."
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

  /** 버튼을 우측으로 달아나게 한다 (1초 — 운영자 2026-08-25 "1.5초라면 1초로 당겨").
   *
   *  달아날 거리는 런타임에만 알 수 있다 — 행 너비에서 버튼 너비를 뺀 만큼이고,
   *  CSS 만으로는 형제(행)의 폭을 알 수 없으며 `100%` 는 자기 폭이라 쓸 수 없다.
   *
   *  ⚠ 그래서 **CSS 키프레임을 쓰지 않는다.** 키프레임 안에서 `calc(var(--x) * n)` 을
   *  쓰면 크로미움이 그 transform 애니메이션을 합성 스레드로 올리지 못해 메인 스레드에서
   *  돌고, 기기가 바쁠 때 끊긴다. WAAPI 로 **실제 px 키프레임**을 넘기면 합성 대상이 된다.
   *
   *  최종 위치는 인라인 transform 으로 못박고 애니메이션에는 fill 을 주지 않는다 —
   *  끝나면 자연히 그 값에 정착하므로 fill 잔재가 남지 않는다.
   *
   *  **경로는 손으로 찍지 않고 물리로 푼다** (운영자 2026-08-26). 손으로 찍은
   *  웨이포인트는 구간마다 속도가 일정해 '부드럽게 미끄러지는' 느낌이 됐다. 대신
   *  `solveFlee` 가 **좁고 긴 상자 안에서 튕기는 공**(강한 발사 → 네 벽 반사 +
   *  공기저항 → 감쇠 정착)을 60프레임 적분해 좌표를 뽑고, 키프레임은 그 표본을 싣는다.
   *
   *  ⚠ easing 은 여전히 **linear** 다 — 물리는 키프레임 **간격**에 이미 들어 있고,
   *  구간마다 ease 를 덧대면 마디에서 속도가 튀어 멈칫한다(2026-08-25 실측). */
  function flee() {
    setEscaped(true)
    const row = rowRef.current
    const btn = btnRef.current
    if (!row || !btn) return
    const dx = Math.max(0, row.clientWidth - btn.offsetWidth)
    // 착지점 (운영자 2026-08-25 "한 쪽 끝으로만 도망가지 말고 다시 중앙에서 조금
    // 좌측으로 가깝게 와줘. 높이도 사알짝만 틀어지게"): 우측 끝을 찍고 돌아와
    // 중앙보다 약간 좌측(0.38 × 이동폭), 원래 높이보다 5px 위 — 두 번째 클릭이
    // 손 닿는 자리다.
    const endX = dx * END_N
    const endY = -5
    btn.style.transform = `translate(${endX}px, ${endY}px)`
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || typeof btn.animate !== "function") return
    btn.animate(
      solveFlee(dx, endY).map((f) => ({ transform: `translate(${f.x}px, ${f.y}px)`, offset: f.t })),
      { duration: FLEE_MS, easing: "linear" },
    )
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
          `자기소개: ${intro}`,
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
            자기소개<span className={cb.required}>*</span>
          </label>
          <textarea
            id="cb-intro"
            name="intro"
            rows={3}
            className={`${cb.textarea} ${errors.intro ? cb.inputError : ""}`}
            onChange={() => clearError("intro")}
          />
          {errors.intro && <p className={cb.errorText}>{errors.intro}</p>}
        </div>

        <div className={cb.field}>
          <label htmlFor="cb-when" className={cb.fieldLabel}>
            희망 날짜와 시간대<span className={cb.required}>*</span>
          </label>
          {/* 플레이스홀더 = [신청서] 옆에 있던 괄호 부기의 이관 (운영자 2026-08-25).
              전면 제거 원칙(같은 날 "플레이스홀더에 텍스트는 필요없어")의 명시적 예외 —
              서체는 솔뫼체·흑색 베이스, 크기·굵기는 플레이스홀더 기본값 그대로 */}
          <input
            id="cb-when"
            name="preferredWhen"
            type="text"
            placeholder="신청 가능 시간: 평일 19시 ~ 24시"
            className={`${cb.input} ${cb.inputWhen} ${errors.preferredWhen ? cb.inputError : ""}`}
            onChange={() => clearError("preferredWhen")}
          />
          {errors.preferredWhen && <p className={cb.errorText}>{errors.preferredWhen}</p>}
        </div>

        <div className={cb.consent}>
          {/* 상세 고지는 접기 뒤 (운영자 2026-08-25 — apply 페이지 문법 이식, 문구도
              운영자 지정 원문). 아이콘은 + 대신 꺾은괄호 아래↔위 회전 */}
          <div className={cb.consentHead}>
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
            <button
              type="button"
              className={`${cb.consentToggle} ${privacyDetailOpen ? cb.consentToggleOpen : ""}`}
              onClick={() => setPrivacyDetailOpen((v) => !v)}
              aria-expanded={privacyDetailOpen}
              aria-label="개인정보 수집·이용 동의 상세"
            >
              &gt;
            </button>
          </div>
          <div className={`${cb.consentBody} ${privacyDetailOpen ? cb.consentBodyOpen : ""}`}>
            <div className={cb.consentBodyInner}>
              <p className={cb.consentNote}>
                <span>개인정보 보호법 제15조에 따라 동의를 받습니다.</span>
                <span>· 수집 항목: 신청서에 기재하신 정보</span>
                <span>· 이용 목적: 신청 접수 및 일정 안내</span>
                <span>· 보유 기간: 접수 후 1년 (삭제를 요청하시면 지체 없이 파기)</span>
              </p>
            </div>
          </div>
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
          {/* 선택 동의로 남는 것을 명시 — 신청서는 보유기간이 지나면 파기되지만
              동의하신 분의 이름·연락처는 그 동의를 근거로 남는다 (2026-09-01) */}
          <p className={cb.consentNote}>
            <span>동의하신 경우 안내를 위해 이름·연락처를 동의 철회 시까지 보관합니다.</span>
          </p>
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
            className={cb.actionBtn}
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
            {/* 운영자 원문 (2026-08-25 2차) — 앞선 "버튼은 도망쳤지만…"은 내가 쓴 임시본이었다 */}
            <p className={cb.confirmBody}>
              네그로니도, 네비올로도 없는 동민과 고든 커피앤바의 대화 자리에 참가를 희망하신다면 제출해
              주세요.
            </p>
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
