"use client"

/**
 * 마이페이지 (2026-09-02, 계획서 P4a-6·7) — 내 주문 · 내 신청 · 주문 연결.
 *
 * 세션은 `/api/auth/me`, 내역은 `/api/lazyday/mypage` — 둘 다 서버가 세션으로
 * user_id 를 확정하고 그 행만 돌려준다(R13). 화면은 필터를 갖지 않는다.
 *
 * 문구 규율:
 *  · **신청의 진행 상태는 보여주지 않는다** — 정본이 구글 시트라 DB 값이 손님에게
 *    보이면 어긋난 순간 거짓말이 된다. "접수됨"까지만 말한다.
 *  · **'내 주문'은 결제한 사람 기준**이다(R3) — 남이 대신 결제해 준 모임은 여기
 *    안 뜬다. 가상계좌·비회원 결제는 아래 '주문 연결'로 잇는다.
 *  · 로그인은 입회가 아니다 — 모임 참가는 신청 절차가 정한다.
 *
 * ⚠ 로그인·로그아웃 링크는 plain `<a>`/fetch — `LazyclubLink` 금지 (Shell.tsx AccountMenu 참고).
 */

import { useEffect, useState } from "react"
import { LazyclubLink } from "../LazyclubLink"
import { BASE, HOME, WorkroomShell } from "../Shell"
import styles from "../home.module.css"

type Me = { enabled: boolean; loggedIn: boolean; displayName?: string | null; phone?: string | null; ageVerified?: boolean; marketingConsent?: boolean }
type Order = {
  orderNo: string
  amountTotal: number
  status: string
  createdAt: string
  items: { name: string; quantity: number; note: string | null }[]
}
type Application = { kind: string; cohort: string | null; orderNo: string | null; submittedAt: string }

const ORDER_STATUS: Record<string, string> = {
  paid: "결제 완료",
  refunded: "환불",
  partially_refunded: "부분 환불",
  cancelled: "취소",
}
const KIND_LABEL: Record<string, string> = {
  bookclub: "레이지데이 북클럽 신청",
  oneday: "원데이 토크 신청",
  coffeebar: "커피앤바 신청",
  notify: "다음 기수 알림 신청",
  interview_phone: "전화 인터뷰 예약",
  interview_written: "서면 인터뷰 제출",
  review: "후기",
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

export function MypageView() {
  return (
    <WorkroomShell>
      <MypageBody />
    </WorkroomShell>
  )
}

function MypageBody() {
  const [me, setMe] = useState<Me | null>(null)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [apps, setApps] = useState<Application[] | null>(null)
  const [loadErr, setLoadErr] = useState(false)

  const load = async () => {
    const r = await fetch("/api/lazyday/mypage", { cache: "no-store" })
    if (!r.ok) throw new Error(String(r.status))
    const d = (await r.json()) as { orders: Order[]; applications: Application[] }
    setOrders(d.orders)
    setApps(d.applications)
  }

  /** 동의를 바꾼 뒤 세션만 다시 읽는다 — 주문·신청은 그대로라 다시 부르지 않는다 */
  const reloadMe = async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" })
      setMe((await r.json()) as Me)
    } catch {
      /* 화면의 값이 잠깐 옛것으로 남을 뿐이라 실패를 알리지 않는다 */
    }
  }

  useEffect(() => {
    let alive = true
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then(async (d: Me) => {
        if (!alive) return
        setMe(d)
        if (d.loggedIn) await load()
      })
      .catch(() => alive && setLoadErr(true))
    return () => {
      alive = false
    }
  }, [])

  const nextParam = encodeURIComponent(typeof window === "undefined" ? `${BASE}/mypage` : window.location.pathname)

  return (
    <main className={styles.content}>
      <div className={styles.indexHead}>
        <div className={styles.sectionTitle}>
          <span>mypage</span>
        </div>
      </div>

      {loadErr ? (
        <p className={styles.emptyNote}>불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>
      ) : !me ? (
        <p className={styles.emptyNote}>불러오는 중…</p>
      ) : !me.enabled ? (
        <p className={styles.emptyNote}>로그인은 준비 중입니다.</p>
      ) : !me.loggedIn ? (
        <div className={styles.myBlock}>
          <p className={styles.myLead}>로그인하면 주문·신청 내역을 한자리에서 볼 수 있어요.</p>
          <div className={styles.myLinks}>
            <a className={styles.myLink} href={`/api/auth/signin/kakao?next=${nextParam}`}>
              카카오로 로그인
            </a>
            <a className={styles.myLink} href={`/api/auth/signin/google?next=${nextParam}`}>
              구글로 로그인
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.myBlock}>
            <p className={styles.myLead}>
              <strong>{me.displayName || "회원"}</strong>님
            </p>
            <p className={styles.myNote}>
              <LazyclubLink href={HOME}>전체보기</LazyclubLink>로 돌아가거나, 아래에서 내역을 확인하세요.
            </p>
          </div>

          <section className={styles.myBlock}>
            <h2 className={styles.myH2}>내 주문</h2>
            {orders === null ? (
              <p className={styles.emptyNote}>불러오는 중…</p>
            ) : orders.length === 0 ? (
              <p className={styles.emptyNote}>이 계정으로 한 주문이 아직 없어요.</p>
            ) : (
              <div className={styles.cartList}>
                {orders.map((o) => (
                  <div key={o.orderNo} className={styles.myRow}>
                    <div className={styles.myRowHead}>
                      <span>{fmtDate(o.createdAt)}</span>
                      <span>{ORDER_STATUS[o.status] ?? o.status}</span>
                    </div>
                    <ul className={styles.myItems}>
                      {o.items.map((it, i) => (
                        <li key={i}>
                          {it.name}
                          {it.quantity > 1 ? ` × ${it.quantity}` : ""}
                          {it.note ? <span className={styles.myItemNote}> · {it.note}</span> : null}
                        </li>
                      ))}
                    </ul>
                    <div className={styles.myRowFoot}>
                      <span className={styles.myOrderNo}>{o.orderNo}</span>
                      <strong>₩{o.amountTotal.toLocaleString()}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className={styles.myNote}>
              결제한 사람 기준이에요. 다른 사람이 대신 결제했거나 로그인 없이 결제한 주문은 아래에서 연결할 수 있어요.
            </p>
          </section>

          <section className={styles.myBlock}>
            <h2 className={styles.myH2}>내 신청</h2>
            {apps === null ? (
              <p className={styles.emptyNote}>불러오는 중…</p>
            ) : apps.length === 0 ? (
              <p className={styles.emptyNote}>이 계정으로 한 신청이 아직 없어요.</p>
            ) : (
              <div className={styles.cartList}>
                {apps.map((a, i) => (
                  <div key={`${a.kind}-${a.submittedAt}-${i}`} className={styles.myRow}>
                    <div className={styles.myRowHead}>
                      <span>{fmtDate(a.submittedAt)}</span>
                      <span>접수됨</span>
                    </div>
                    <p className={styles.myItemLine}>
                      {KIND_LABEL[a.kind] ?? a.kind}
                      {a.cohort ? ` · ${a.cohort}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className={styles.myNote}>진행 상황은 접수 때 남긴 연락처로 따로 안내드려요.</p>
          </section>

          <AccountConsents me={me} onSaved={reloadMe} />

          <LinkOrder onLinked={load} />
        </>
      )}
    </main>
  )
}

/**
 * 계정 — 만 14세 확인과 마케팅 수신 동의 (계획서 P4a 후속).
 *
 * ⚠ **만 14세 확인은 되돌리는 버튼을 두지 않는다.** "만 14세 이상"은 시간이 지나 뒤집히는
 *   사실이 아니라 되돌릴 개념이 없다. 잘못 눌렀다면 문의하는 경로로 안내한다(라우트도 true 만 받는다).
 * ⚠ **수신 동의는 켜고 끄는 것이 대칭이다** — 철회를 어렵게 만들면 법 제22조의 취지에 어긋난다.
 *   철회하면 접수 때 남긴 동의까지 함께 지워진다(라우트가 그렇게 한다) — 화면이 그 사실을 밝힌다.
 */
function AccountConsents({ me, onSaved }: { me: Me; onSaved: () => Promise<void> }) {
  const [busy, setBusy] = useState<"age" | "marketing" | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const patch = async (which: "age" | "marketing", body: Record<string, unknown>) => {
    if (busy) return
    setBusy(which)
    setMsg(null)
    try {
      const r = await fetch("/api/lazyday/mypage/consents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!d.ok) {
        setMsg(d.error || "저장하지 못했어요.")
        return
      }
      await onSaved()
      setMsg(which === "age" ? "확인했어요." : body.marketingConsent ? "수신 동의했어요." : "수신을 철회했어요.")
    } catch {
      setMsg("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className={styles.myBlock}>
      <h2 className={styles.myH2}>계정</h2>

      <div className={styles.myRow}>
        <div className={styles.myRowHead}>
          <span>만 14세 이상 확인</span>
          <span>{me.ageVerified ? "확인됨" : "미확인"}</span>
        </div>
        {me.ageVerified ? (
          <p className={styles.myNote}>확인이 끝났어요. 되돌려야 한다면 contact@linkylounge.com 으로 알려 주세요.</p>
        ) : (
          <>
            <p className={styles.myNote}>
              만 14세 미만은 법정대리인 동의가 있어야 가입할 수 있어요. 아직 확인 전이에요.
            </p>
            <div className={styles.myLinks}>
              <button className={styles.myLink} disabled={busy === "age"} onClick={() => patch("age", { ageVerified: true })}>
                {busy === "age" ? "확인 중…" : "만 14세 이상입니다"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className={styles.myRow}>
        <div className={styles.myRowHead}>
          <span>마케팅 수신</span>
          <span>{me.marketingConsent ? "동의함" : "동의 안 함"}</span>
        </div>
        <p className={styles.myNote}>
          새 모임·행사 소식을 이름·연락처로 보내드려요. 선택 사항이고, 동의하지 않아도 신청·결제에 제한이 없어요.
          {me.marketingConsent && " 철회하면 접수하실 때 남기신 수신 동의도 함께 지워져요."}
        </p>
        <div className={styles.myLinks}>
          <button
            className={styles.myLink}
            disabled={busy === "marketing"}
            onClick={() => patch("marketing", { marketingConsent: !me.marketingConsent })}
          >
            {busy === "marketing" ? "저장 중…" : me.marketingConsent ? "수신 철회하기" : "수신 동의하기"}
          </button>
        </div>
      </div>

      {msg && <p className={styles.myMsg}>{msg}</p>}
    </section>
  )
}

/** 주문 연결 — 주문번호 + 결제 때 전화번호가 **둘 다** 맞아야 한다 (R11) */
function LinkOrder({ onLinked }: { onLinked: () => Promise<void> }) {
  const [orderNo, setOrderNo] = useState("")
  const [phone, setPhone] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch("/api/lazyday/mypage/link-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo: orderNo.trim(), phone: phone.trim() }),
      })
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; reason?: string; already?: boolean }
      if (d.ok) {
        setMsg(d.already ? "이미 연결된 주문이에요." : "연결했어요.")
        setOrderNo("")
        setPhone("")
        await onLinked()
      } else if (d.reason === "taken") {
        setMsg("이미 다른 계정에 연결된 주문이에요. 도움이 필요하면 contact@linkylounge.com 으로 알려 주세요.")
      } else if (d.reason === "invalid") {
        setMsg("주문번호와 전화번호를 모두 입력해 주세요.")
      } else {
        setMsg("맞는 주문을 찾지 못했어요. 주문번호와 결제 때 적은 전화번호를 다시 확인해 주세요.")
      }
    } catch {
      setMsg("연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.myBlock}>
      <h2 className={styles.myH2}>주문 연결</h2>
      <p className={styles.myNote}>로그인 없이 했던 주문을 이 계정으로 가져와요. 주문번호와 결제 때 적은 전화번호가 둘 다 맞아야 해요.</p>
      <form className={styles.myForm} onSubmit={submit}>
        <label className={styles.myField}>
          <span>주문번호</span>
          <input
            className={styles.myInput}
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            placeholder="결제 안내 문자·메일에 있어요"
            autoComplete="off"
            required
          />
        </label>
        <label className={styles.myField}>
          <span>전화번호</span>
          <input
            className={styles.myInput}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            inputMode="tel"
            autoComplete="tel"
            required
          />
        </label>
        <div className={styles.myLinks}>
          <button type="submit" className={styles.myLink} disabled={busy}>
            {busy ? "확인 중…" : "연결하기"}
          </button>
        </div>
        {msg && <p className={styles.myMsg}>{msg}</p>}
      </form>
    </section>
  )
}
