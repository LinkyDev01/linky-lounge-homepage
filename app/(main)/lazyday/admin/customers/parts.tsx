"use client"

/**
 * 고객 레코드 부품 — 속성(좌) · 타임라인(중) · 연관(우) · 머리 (CRM-3, 통합안 이식).
 * 데이터는 lib/customers 의 Customer (실 DB). 프리뷰 admin-crm/parts.tsx 의 목 버전을 실데이터에 맞춘 것.
 */

import { useState } from "react"
import styles from "../crm.module.css"
import type { Customer, Stage, Activity } from "@/lib/customers"

export const STAGE_LABEL: Record<Stage, string> = {
  received: "접수", interview_booked: "인터뷰 예정", interviewed: "인터뷰 완료", accepted_unpaid: "합격 · 미결제",
  paid: "결제 완료", attending: "참가 중", hold: "보류", rejected: "탈락", refunded: "환불",
}
export const KIND_LABEL: Record<string, string> = {
  bookclub: "북클럽 신청", oneday: "원데이 토크", coffeebar: "커피앤바", notify: "기수 알림",
  interview_phone: "전화 인터뷰", interview_written: "서면 인터뷰", review: "후기",
}
const TYPE_LABEL: Record<Activity["type"], string> = { apply: "접수", interview: "인터뷰", order: "주문", note: "메모", system: "시스템", contact: "연락" }
const SOURCE_LABEL: Record<string, string> = { profile: "인스타 프로필", ad_direct: "광고 직행", referral: "지인 소개" }

export const fmtPhone = (p: string | null) => (p ? p.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3") : "—")
export const fmtDate = (iso: string) => { const d = kst(iso); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}` }
export const fmtDateTime = (iso: string) => { const d = kst(iso); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}` }
const kst = (iso: string) => new Date(new Date(iso).getTime() + 9 * 3600_000)
export const won = (n: number) => `${n < 0 ? "−" : ""}₩${Math.abs(n).toLocaleString("ko-KR")}`

export function flagText(c: Customer) {
  return c.flags.map((f) => (f === "gas_failed" ? "시트 실패" : f === "unsubmitted" ? "신청서 미제출" : f === "dup" ? "중복" : "파기됨")).join(" · ")
}
export function PersonFlags({ c }: { c: Customer }) {
  return c.flags.length ? <span className={styles.flag}>{flagText(c)}</span> : null
}
export const primaryStage = (c: Customer) => c.entries[0]?.stage

/**
 * 활동 기록 초안 (CRM-5) — '전화 걸기'·'문자 보내기'를 누르면 tel:/sms: 가 열리는 것과 **함께**
 * 이 폼이 뜬다. 저장은 운영자가 '남기기'를 눌러야 일어난다.
 * ⚠ 자동으로 남기지 않는 이유: 링크를 누른 것과 실제로 통화한 것은 다르고, 문자는 눌러도
 *   발송 여부를 우리가 알 수 없다 (운영자 2026-09-02 "수동"). 거짓 기록이 쌓이지 않게.
 */
const DRAFT_HINT: Record<"note" | "call" | "sms", string> = {
  note: "메모 — 나중에 이 사람을 볼 때 필요한 것",
  call: "통화 기록 — 무슨 이야기를 했는지",
  sms: "문자 기록 — 무엇을 보냈는지",
}

function ActivityDraft({ personKey, kind, onDone, onCancel }: {
  personKey: string; kind: "note" | "call" | "sms"; onDone: () => void; onCancel: () => void
}) {
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState("")

  async function save() {
    if (!body.trim() || saving) return
    setSaving(true); setFailed("")
    try {
      const res = await fetch("/api/lazyday/admin/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personKey, kind, body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) { setFailed(data?.error || "기록에 실패했어요"); return }
      setBody("")
      onDone()
    } catch {
      setFailed("기록에 실패했어요")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.draft}>
      <p className={styles.draftHint}>{DRAFT_HINT[kind]}</p>
      <textarea
        className={styles.draftBox}
        value={body}
        autoFocus
        rows={3}
        maxLength={2000}
        placeholder="여기에 적으면 이 사람의 타임라인에 남습니다"
        onChange={(e) => setBody(e.target.value)}
      />
      {failed && <p className={styles.err}>{failed}</p>}
      <div className={styles.draftActions}>
        <button onClick={save} disabled={saving || !body.trim()} className={styles.strong}>{saving ? "남기는 중…" : "남기기"}</button>
        <button onClick={onCancel} className={styles.muted}>취소</button>
      </div>
    </div>
  )
}

export function RecordHead({ c, onSaved }: { c: Customer; onSaved?: () => void }) {
  const [draft, setDraft] = useState<"note" | "call" | "sms" | null>(null)
  return (
    <>
      <div className={styles.recHead}>
        <h2 className={styles.recName}>{c.name ?? <span className={styles.muted}>(이름 없음)</span>}</h2>
        <span className={styles.muted}>{fmtPhone(c.phone)}</span>
        <PersonFlags c={c} />
      </div>
      <div className={styles.recActions}>
        {/* 링크의 기본 동작(tel:/sms: 열기)은 그대로 두고 초안만 함께 연다 */}
        {c.phone && <a href={`tel:${c.phone}`} onClick={() => setDraft("call")}>전화 걸기</a>}
        {c.phone && <a href={`sms:${c.phone}`} onClick={() => setDraft("sms")}>문자 보내기</a>}
        <button onClick={() => setDraft("note")}>메모 남기기</button>
        {c.applications?.[0] && <a href={`/admin/applications?q=${encodeURIComponent(c.phone ?? c.name ?? "")}`}>접수 원장에서 보기</a>}
      </div>
      {draft && (
        <ActivityDraft
          personKey={c.key}
          kind={draft}
          onCancel={() => setDraft(null)}
          onDone={() => { setDraft(null); onSaved?.() }}
        />
      )}
    </>
  )
}

export function Attributes({ c }: { c: Customer }) {
  return (
    <>
      <p className={styles.blockTitle}>기본</p>
      <dl className={styles.attr}>
        <dt>전화</dt><dd>{fmtPhone(c.phone)}</dd>
        <dt>이메일</dt><dd>{c.email ?? <span className={styles.muted}>—</span>}</dd>
        <dt>회원</dt><dd>{c.member ? "로그인 계정 있음" : <span className={styles.muted}>비회원</span>}</dd>
        <dt>마케팅</dt><dd>{c.marketingConsent ? "동의" : <span className={styles.muted}>미동의</span>}</dd>
        <dt>유입</dt><dd>{c.source ? (SOURCE_LABEL[c.source] ?? c.source) : <span className={styles.muted}>—</span>}</dd>
      </dl>
      <p className={styles.blockTitle}>기수</p>
      <dl className={styles.attr}>
        {c.entries.length ? c.entries.map((e) => (
          <Row key={e.cohort} k={e.cohort}>
            <span className={styles.stageStrong}>{STAGE_LABEL[e.stage]}</span>
            {e.interview && <span className={styles.muted}> · {e.interview === "phone" ? "전화" : "서면"}</span>}
            <span className={styles.muted}> · {fmtDate(e.since)}~</span>
            {e.sheetProgress && <span className={styles.muted}> · 시트 '{e.sheetProgress}'</span>}
          </Row>
        )) : <Row k="—"><span className={styles.muted}>기수 없음</span></Row>}
      </dl>
      <p className={styles.blockTitle}>운영 메모</p>
      <p className={styles.noteBox}>{c.note ?? <span className={styles.muted}>없음 — 접수 원장의 메모가 여기 보인다</span>}</p>
    </>
  )
}
function Row({ k, children }: { k: string; children: React.ReactNode }) { return <><dt>{k}</dt><dd>{children}</dd></> }

export function Associations({ c }: { c: Customer }) {
  const orders = c.orders ?? []
  const apps = c.applications ?? []
  const ivs = (c.activities ?? []).filter((a) => a.type === "interview")
  return (
    <>
      <div className={styles.assoc}>
        <div className={styles.assocHead}><span className={styles.strong}>주문 ({orders.length})</span></div>
        {orders.map((o) => (
          <div key={o.orderNo} className={styles.assocItem}>
            <span>{o.items.map((i) => i.name).join(", ") || o.orderNo}</span><span>{won(o.amount)}</span>
            <span className={styles.sub}>{o.orderNo} · {fmtDate(o.at)} · {o.status === "paid" ? "결제" : o.status === "refunded" ? "환불" : o.status}{!o.applicationSubmitted && o.items.some((i) => i.kind === "meeting") ? " · ⚠ 신청서 미제출" : ""}{o.userLinked ? " · 계정 연결" : ""}</span>
          </div>
        ))}
        {!orders.length && <div className={styles.muted}>없음</div>}
      </div>
      <div className={styles.assoc}>
        <div className={styles.assocHead}><span className={styles.strong}>접수 ({apps.length})</span></div>
        {apps.map((a) => (
          <div key={a.id} className={styles.assocItem}>
            <span>{KIND_LABEL[a.kind] ?? a.kind}{a.cohort ? ` · ${a.cohort}` : ""}{a.triage ? ` · [${a.triage}]` : ""}</span>
            <span className={styles.muted}>{fmtDate(a.at)}</span>
            {a.statusNote && <span className={styles.sub}>{a.statusNote}</span>}
          </div>
        ))}
        {!apps.length && <div className={styles.muted}>없음</div>}
      </div>
      <div className={styles.assoc}>
        <div className={styles.assocHead}><span className={styles.strong}>인터뷰 ({ivs.length})</span></div>
        {ivs.map((a, i) => (
          <div key={i} className={styles.assocItem}><span>{a.title}</span><span className={styles.muted}>{a.upcoming ? "예정" : fmtDate(a.at)}</span></div>
        ))}
        {!ivs.length && <div className={styles.muted}>없음</div>}
      </div>
    </>
  )
}

export function Timeline({ c }: { c: Customer }) {
  const [f, setF] = useState<"all" | Activity["type"]>("all")
  const items = (c.activities ?? []).filter((a) => f === "all" || a.type === f)
  return (
    <>
      <div className={styles.tabs}>
        {(["all", "apply", "interview", "order", "contact", "note", "system"] as const).map((k) => (
          <button key={k} className={`${styles.tab} ${f === k ? styles.tabOn : ""}`} onClick={() => setF(k)}>{k === "all" ? "전체" : TYPE_LABEL[k]}</button>
        ))}
      </div>
      <ul className={styles.timeline}>
        {items.map((a, i) => (
          <li key={i} className={styles.tl}>
            <span className={styles.tlTime}>{a.upcoming ? "예정" : fmtDateTime(a.at)}</span>
            <span>
              <div className={styles.tlType}>{TYPE_LABEL[a.type]}</div>
              <div className={a.upcoming ? styles.tlUp : ""}>{a.title}{a.amount ? ` · ${won(a.amount)}` : ""}</div>
              {a.detail && <div className={styles.tlDetail}>{a.detail}</div>}
              {/* 우리가 남긴 기록만 '누가' 를 갖는다 (CRM-5 · R13) */}
              {a.who && <div className={styles.tlWho}>{a.who}</div>}
            </span>
          </li>
        ))}
        {!items.length && <li className={styles.empty}>활동 없음</li>}
      </ul>
    </>
  )
}

/** 3열 레코드 전체 (페이지) */
export function Record3({ c, onSaved }: { c: Customer; onSaved?: () => void }) {
  return (
    <>
      <RecordHead c={c} onSaved={onSaved} />
      <div className={styles.record}>
        <div className={styles.colL}><Attributes c={c} /></div>
        <div className={styles.colM}><Timeline c={c} /></div>
        <div className={styles.colR}><Associations c={c} /></div>
      </div>
      <p className={styles.origin}>진행 상태의 정본은 구글 시트 — 여기 단계는 시트 값(매시 거울)과 DB 사실에서 읽어 파생한 것. 고치는 곳이 아니다.</p>
    </>
  )
}

/** 패널용 축약 (빠르게 보기) */
export function RecordPanel({ c, onClose, onSaved }: { c: Customer; onClose: () => void; onSaved?: () => void }) {
  return (
    <>
      <div className={styles.dim} onClick={onClose} />
      <aside className={styles.panel}>
        <div className={styles.panelBar}><a href={`/admin/customers/${encodeURIComponent(c.key)}`}>전체 보기 →</a><button onClick={onClose}>닫기 ✕</button></div>
        <RecordHead c={c} onSaved={onSaved} />
        <Attributes c={c} />
        <p className={styles.blockTitle}>연관</p>
        <Associations c={c} />
        <p className={styles.blockTitle}>활동</p>
        <Timeline c={c} />
      </aside>
    </>
  )
}

/** 기수 파이프라인 칸반 (CRM-4) — 열 = 단계, 카드 → 레코드 페이지. 읽기 전용: 정본은 시트 */
export const STAGE_ORDER: Stage[] = ["received", "interview_booked", "interviewed", "accepted_unpaid", "paid", "attending", "hold", "rejected", "refunded"]
export function Kanban({ customers, cohort }: { customers: Customer[]; cohort: string }) {
  const cols = STAGE_ORDER.map((s) => ({ stage: s, list: customers.filter((c) => c.entries.find((e) => e.cohort === cohort)?.stage === s) }))
    .filter((col) => col.list.length || !["hold", "refunded"].includes(col.stage))
  return (
    <div className={styles.board}>
      {cols.map(({ stage, list }) => (
        <div key={stage} className={styles.col}>
          <div className={styles.colHead}><span>{STAGE_LABEL[stage]}</span><span className={styles.count}>{list.length}</span></div>
          {list.map((c) => {
            const e = c.entries.find((x) => x.cohort === cohort)!
            return (
              <a key={c.key} className={styles.kcard} href={`/admin/customers/${encodeURIComponent(c.key)}`}>
                <div className={styles.kName}>{c.name ?? "(이름 없음)"}</div>
                <div className={styles.kMeta}>
                  {e.interview && <span>{e.interview === "phone" ? "전화" : "서면"}</span>}
                  <span>{fmtDate(e.since)}~</span>
                  {c.member && <span>회원</span>}
                  {c.flags.length ? <span className={styles.kFlag}>손볼 것</span> : null}
                </div>
              </a>
            )
          })}
          {!list.length && <div className={styles.colEmpty}>—</div>}
        </div>
      ))}
    </div>
  )
}
