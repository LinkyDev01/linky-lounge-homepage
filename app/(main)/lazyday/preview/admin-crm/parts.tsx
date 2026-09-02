"use client"

/**
 * 고객관리 대시보드 시안 — 세 안이 공유하는 부품.
 * 레퍼런스 대응은 docs/admin-crm/01-references.md.
 */

import { useState, type ReactNode } from "react"
import styles from "./crm.module.css"
import {
  PEOPLE, STAGES, KIND_LABEL, stageOf, fmtDate, fmtDateTime, fmtPhone, won, todayList,
  type Person, type Stage, type EventType,
} from "./mock"

export type Section = "home" | "people" | "pipeline" | "applications" | "orders" | "schedule" | "tools"
export const NAV: { key: Section; label: string }[] = [
  { key: "home", label: "홈" },
  { key: "people", label: "고객" },
  { key: "pipeline", label: "파이프라인" },
  { key: "applications", label: "접수" },
  { key: "orders", label: "주문" },
  { key: "schedule", label: "일정" },
  { key: "tools", label: "도구" },
]

export function Shell({ section, onSection, variant, children }: { section: Section; onSection: (s: Section) => void; variant: string; children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <p className={styles.brand}>레이지클럽 관리<small>admin.lazy-club.com · {variant}안</small></p>
        {NAV.map((n) => (
          <button key={n.key} className={`${styles.navItem} ${section === n.key ? styles.navOn : ""}`} onClick={() => onSection(n.key)}>
            {n.label}
          </button>
        ))}
        <div className={styles.navSep} />
        <span className={`${styles.navItem}`}>차단 달력</span>
        <span className={`${styles.navItem}`}>상태 점검</span>
        <span className={`${styles.navItem}`}>흐름 테스트</span>
        <p className={styles.navFoot}>동민 · 로그아웃</p>
      </nav>
      <main className={styles.main}>{children}</main>
    </div>
  )
}

export const stageLabel = (s?: Stage) => STAGES.find((x) => x.key === s)?.label ?? "—"
const TYPE_LABEL: Record<EventType, string> = { apply: "접수", interview: "인터뷰", order: "주문", note: "메모", call: "통화", sms: "문자", system: "시스템" }

export function PersonFlags({ p }: { p: Person }) {
  if (!p.flags?.length) return null
  const t = p.flags.map((f) => (f === "gas_failed" ? "시트 실패" : f === "unsubmitted" ? "신청서 미제출" : "중복")).join(" · ")
  return <span className={styles.flag}>{t}</span>
}

/** 홈 — 오늘 할 일 + 숫자 (HubSpot Overview 의 'upcoming' 문법 + 우리 상태 점검) */
export function Home({ onOpen }: { onOpen: (p: Person) => void }) {
  const today = todayList()
  const c4 = PEOPLE.filter((p) => stageOf(p)).length
  const paid = PEOPLE.filter((p) => ["paid", "attending"].includes(stageOf(p) ?? "")).length
  const unpaid = PEOPLE.filter((p) => stageOf(p) === "accepted_unpaid").length
  const iv = PEOPLE.filter((p) => stageOf(p) === "interview_booked").length
  return (
    <>
      <div className={styles.head}><h1 className={styles.h1}>홈</h1><span className={styles.muted}>2026. 9. 2 (수)</span></div>
      <div className={styles.cards}>
        <div className={styles.card}><div className={styles.num}>{c4}</div><div className={styles.cap}>4기 파이프라인</div></div>
        <div className={styles.card}><div className={styles.num}>{paid}</div><div className={styles.cap}>결제 완료</div></div>
        <div className={styles.card}><div className={styles.num}>{unpaid}</div><div className={styles.cap}>합격 · 미결제</div></div>
        <div className={styles.card}><div className={styles.num}>{iv}</div><div className={styles.cap}>인터뷰 예정</div></div>
      </div>
      <section className={styles.sec}>
        <h2 className={styles.secTitle}>오늘 할 일 <span className={styles.muted}>{today.length}</span></h2>
        <ul className={styles.list}>
          {today.map((t, i) => (
            <li key={i} className={styles.li}>
              <button className={styles.liWho} onClick={() => onOpen(t.who)}>{t.who.name}</button>
              <span className={styles.muted}>{t.why}</span>
              <span className={styles.sub}>{t.what}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className={styles.sec}>
        <h2 className={styles.secTitle}>최근 활동</h2>
        <ul className={styles.list}>
          {PEOPLE.flatMap((p) => p.activities.filter((a) => !a.upcoming).map((a) => ({ p, a })))
            .sort((x, y) => y.a.at.localeCompare(x.a.at)).slice(0, 8)
            .map(({ p, a }, i) => (
              <li key={i} className={styles.li}>
                <span><button className={styles.liWho} onClick={() => onOpen(p)}>{p.name}</button> <span className={styles.muted}>· {a.title}</span></span>
                <span className={styles.muted}>{fmtDateTime(a.at)}</span>
              </li>
            ))}
        </ul>
      </section>
    </>
  )
}

/** 고객 테이블 — Attio 테이블 뷰 (열·정렬·그룹) */
export function PeopleTable({ onOpen, selected, group }: { onOpen: (p: Person) => void; selected?: string; group?: boolean }) {
  const [view, setView] = useState<"all" | "4" | "unpaid" | "flag" | "member">("all")
  const [q, setQ] = useState("")
  let rows = PEOPLE.filter((p) => !q || p.name.includes(q) || p.phone.includes(q.replace(/\D/g, "")))
  if (view === "4") rows = rows.filter((p) => stageOf(p))
  if (view === "unpaid") rows = rows.filter((p) => stageOf(p) === "accepted_unpaid")
  if (view === "flag") rows = rows.filter((p) => p.flags?.length)
  if (view === "member") rows = rows.filter((p) => p.member)
  const groups = group
    ? [["4기", rows.filter((p) => stageOf(p, "4기"))], ["3기만", rows.filter((p) => !stageOf(p, "4기") && stageOf(p, "3기"))], ["기수 없음", rows.filter((p) => !p.entries.length)]] as const
    : [["", rows]] as const
  return (
    <>
      <div className={styles.views}>
        {([["all", "전체"], ["4", "4기"], ["unpaid", "미결제"], ["flag", "손볼 것"], ["member", "회원"]] as const).map(([k, l]) => (
          <button key={k} className={`${styles.view} ${view === k ? styles.viewOn : ""}`} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>
      <div className={styles.filters}><span>기수: 전체</span><span>단계: 전체</span><span>정렬: 최근 활동</span><span>열: 이름 · 전화 · 4기 · 최근 · 유입</span></div>
      <input className={styles.search} placeholder="이름 · 전화번호" value={q} onChange={(e) => setQ(e.target.value)} />
      <table className={styles.table}>
        <thead><tr><th>이름</th><th>전화</th><th>4기</th><th>최근 활동</th><th>유입</th><th>회원</th></tr></thead>
        <tbody>
          {groups.map(([g, list]) => (
            <GroupRows key={g || "all"} label={g} list={[...list]} onOpen={onOpen} selected={selected} />
          ))}
        </tbody>
      </table>
    </>
  )
}
function GroupRows({ label, list, onOpen, selected }: { label: string; list: Person[]; onOpen: (p: Person) => void; selected?: string }) {
  if (!list.length) return null
  return (
    <>
      {label && <tr className={styles.groupRow}><td colSpan={6}>{label} · {list.length}</td></tr>}
      {list.map((p) => {
        const last = p.activities.filter((a) => !a.upcoming)[0]
        return (
          <tr key={p.id} className={selected === p.id ? styles.trOn : ""} onClick={() => onOpen(p)}>
            <td><span className={styles.name}>{p.name}</span> <PersonFlags p={p} /></td>
            <td className={styles.muted}>{fmtPhone(p.phone)}</td>
            <td className={styles.stage}>{stageLabel(stageOf(p))}</td>
            <td className={styles.muted}>{last ? `${fmtDate(last.at)} ${last.title}` : "—"}</td>
            <td className={styles.muted}>{p.source === "profile" ? "프로필" : p.source === "ad_direct" ? "광고" : p.source === "referral" ? "소개" : "—"}</td>
            <td className={styles.muted}>{p.member ? "카카오" : "—"}</td>
          </tr>
        )
      })}
    </>
  )
}

/** 활동 타임라인 — 다가오는 것이 위, 유형 필터 (HubSpot Activities · Attio Activity) */
export function Timeline({ p }: { p: Person }) {
  const [f, setF] = useState<"all" | EventType>("all")
  const items = [...p.activities].sort((a, b) => Number(!!b.upcoming) - Number(!!a.upcoming) || b.at.localeCompare(a.at))
    .filter((a) => f === "all" || a.type === f)
  return (
    <>
      <div className={styles.tabs}>
        {(["all", "apply", "interview", "order", "note", "call", "sms"] as const).map((k) => (
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
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

/** 속성 카드 (좌열) */
export function Attributes({ p }: { p: Person }) {
  return (
    <>
      <p className={styles.blockTitle}>기본</p>
      <dl className={styles.attr}>
        <dt>전화</dt><dd>{fmtPhone(p.phone)}</dd>
        <dt>이메일</dt><dd>{p.email ?? <span className={styles.muted}>—</span>}</dd>
        <dt>회원</dt><dd>{p.member ? "카카오 로그인" : <span className={styles.muted}>비회원</span>}</dd>
        <dt>마케팅</dt><dd>{p.marketing ? "동의" : <span className={styles.muted}>미동의</span>}</dd>
        <dt>유입</dt><dd>{p.source === "profile" ? "인스타 프로필" : p.source === "ad_direct" ? "광고 직행" : p.source === "referral" ? "지인 소개" : <span className={styles.muted}>—</span>}</dd>
      </dl>
      <p className={styles.blockTitle}>기수</p>
      <dl className={styles.attr}>
        {p.entries.length ? p.entries.map((e) => (
          <FragmentRow key={e.cohort} k={e.cohort} v={<><span className={styles.stageStrong}>{stageLabel(e.stage)}</span>{e.interview && <span className={styles.muted}> · {e.interview === "phone" ? "전화" : "서면"}</span>}<span className={styles.muted}> · {fmtDate(e.since)}~</span></>} />
        )) : <FragmentRow k="—" v={<span className={styles.muted}>기수 없음</span>} />}
      </dl>
      <p className={styles.blockTitle}>메모</p>
      <textarea className={styles.noteBox} defaultValue={p.note ?? ""} placeholder="운영 메모 — 개인정보는 파기 대상" />
    </>
  )
}
function FragmentRow({ k, v }: { k: string; v: ReactNode }) { return <><dt>{k}</dt><dd>{v}</dd></> }

/** 연관 카드 (우열) — "주문 (n)" 문법 */
export function Associations({ p }: { p: Person }) {
  return (
    <>
      <div className={styles.assoc}>
        <div className={styles.assocHead}><span className={styles.strong}>주문 ({p.orders.length})</span><span className={styles.muted}>+ 연결</span></div>
        {p.orders.map((o) => (
          <div key={o.orderNo} className={styles.assocItem}>
            <span>{o.items}</span><span>{won(o.amount)}</span>
            <span className={styles.sub}>{o.orderNo} · {fmtDate(o.at)} · {o.status === "refunded" ? "환불" : "결제"}</span>
          </div>
        ))}
        {!p.orders.length && <div className={styles.muted}>없음</div>}
      </div>
      <div className={styles.assoc}>
        <div className={styles.assocHead}><span className={styles.strong}>접수 ({p.applications.length})</span></div>
        {p.applications.map((a, i) => (
          <div key={i} className={styles.assocItem}><span>{KIND_LABEL[a.kind] ?? a.kind}{a.cohort ? ` · ${a.cohort}` : ""}</span><span className={styles.muted}>{fmtDate(a.at)}</span></div>
        ))}
        {!p.applications.length && <div className={styles.muted}>없음</div>}
      </div>
      <div className={styles.assoc}>
        <div className={styles.assocHead}><span className={styles.strong}>인터뷰 ({p.activities.filter((a) => a.type === "interview" || a.type === "call").length})</span></div>
        {p.activities.filter((a) => a.type === "interview" || a.type === "call").map((a, i) => (
          <div key={i} className={styles.assocItem}><span>{a.title}</span><span className={styles.muted}>{a.upcoming ? "예정" : fmtDate(a.at)}</span></div>
        ))}
      </div>
    </>
  )
}

/** 레코드 머리 + 활동 남기기 버튼 (HubSpot: note · call · sms) */
export function RecordHead({ p, extra }: { p: Person; extra?: ReactNode }) {
  return (
    <>
      <div className={styles.recHead}>
        <h2 className={styles.recName}>{p.name}</h2>
        <span className={styles.muted}>{fmtPhone(p.phone)}</span>
        <PersonFlags p={p} />
        {extra}
      </div>
      <div className={styles.recActions}>
        <button>메모</button><button>통화 기록</button><button>문자 보내기</button><button>재진입 링크 복사</button><button>분류…</button>
      </div>
    </>
  )
}

/** 3열 레코드 (A안 · C안 상세) */
export function Record3({ p }: { p: Person }) {
  return (
    <>
      <RecordHead p={p} />
      <div className={styles.record}>
        <div className={styles.colL}><Attributes p={p} /></div>
        <div className={styles.colM}><Timeline p={p} /></div>
        <div className={styles.colR}><Associations p={p} /></div>
      </div>
      <p className={styles.origin}>진행 상태의 정본은 구글 시트 — 여기서 단계는 읽기만 (P5 전까지).</p>
    </>
  )
}

/** 칸반 — 열 = 단계, 카드 = 이름 + 선택 속성, 열 상단 건수 (Attio kanban) */
export function Kanban({ cohort, onOpen }: { cohort: "3기" | "4기"; onOpen: (p: Person) => void }) {
  const cols = cohort === "4기" ? STAGES : STAGES.filter((s) => ["paid", "attending", "rejected"].includes(s.key))
  return (
    <div className={styles.board}>
      {cols.map((s) => {
        const list = PEOPLE.filter((p) => stageOf(p, cohort) === s.key)
        return (
          <div key={s.key} className={styles.col}>
            <div className={styles.colHead}><span>{s.label}</span><span className={styles.count}>{list.length}</span></div>
            {list.map((p) => {
              const e = p.entries.find((x) => x.cohort === cohort)!
              return (
                <button key={p.id} className={styles.kcard} onClick={() => onOpen(p)} style={{ display: "block", width: "100%" }}>
                  <div className={styles.kName}>{p.name}</div>
                  <div className={styles.kMeta}>
                    {e.interview && <span>{e.interview === "phone" ? "전화" : "서면"}</span>}
                    <span>{fmtDate(e.since)}~</span>
                    {p.member && <span>회원</span>}
                    {p.flags?.length ? <span className={styles.kFlag}>손볼 것</span> : null}
                  </div>
                </button>
              )
            })}
            {!list.length && <div className={styles.colEmpty}>—</div>}
          </div>
        )
      })}
    </div>
  )
}

export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <>
      <div className={styles.head}><h1 className={styles.h1}>{title}</h1></div>
      <p className={styles.muted} style={{ padding: "14px 0" }}>{note}</p>
    </>
  )
}
