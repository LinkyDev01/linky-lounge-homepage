"use client"

/**
 * 관리 홈 (2026-09-02, 대시보드 CRM-3 → CRM-4) — 통합안의 홈 자리.
 * 위: 기수 파이프라인 칸반(읽기 — 정본은 시트, 드래그는 P5 뒤) · 아래: 요약 숫자 · 오늘 할 일 8종 · 최근 활동.
 * 종전의 인터뷰 차단 달력은 /admin/schedule 로 옮겼다(내비 '일정').
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminShell, adminFetch } from "./AdminShell"
import styles from "./crm.module.css"
import type { Customer } from "@/lib/customers"
import type { TodayItem, TodayKind } from "@/lib/admin-today"
import { TODAY_LABEL } from "@/lib/admin-today"
import { STAGE_LABEL, Kanban, fmtDate, primaryStage } from "./customers/parts"

type ListRes = { ok: boolean; count?: number; customers?: Customer[]; origin?: string; error?: string }
type TodayRes = { ok: boolean; items?: TodayItem[]; tomorrow?: { label: string; date: string } | null; error?: string }

export default function AdminHome() {
  const router = useRouter()
  const [data, setData] = useState<ListRes | null>(null)
  const [today, setToday] = useState<TodayRes | null>(null)
  const [cohort, setCohort] = useState<string | null>(null)
  useEffect(() => {
    adminFetch<ListRes>("/api/lazyday/admin/customers?limit=1000", router).then((r) => r && setData(r))
    adminFetch<TodayRes>("/api/lazyday/admin/today", router).then((r) => r && setToday(r))
  }, [router])
  const cs = useMemo(() => data?.customers ?? [], [data])
  const cohorts = useMemo(() => [...new Set(cs.flatMap((c) => c.entries.map((e) => e.cohort)))].sort().reverse(), [cs])
  const cur = cohort ?? cohorts[0] ?? null
  const inCohort = cur ? cs.filter((c) => c.entries.some((e) => e.cohort === cur)) : []
  const n = (s: string) => inCohort.filter((c) => c.entries.find((e) => e.cohort === cur)?.stage === s).length
  const now = new Date(); const dateStr = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}`
  const items = today?.items ?? []
  const grouped = useMemo(() => {
    const m = new Map<TodayKind, TodayItem[]>()
    for (const it of items) m.set(it.kind, [...(m.get(it.kind) ?? []), it])
    return [...m.entries()]
  }, [items])

  return (
    <AdminShell>
      <div className={styles.head}>
        <h1 className={styles.h1}>파이프라인</h1>
        {cohorts.length > 0 && (
          <div className={styles.seg}>
            {cohorts.map((c) => <button key={c} className={cur === c ? styles.segOn : ""} onClick={() => setCohort(c)}>{c}</button>)}
          </div>
        )}
        <span className={styles.muted} style={{ marginLeft: "auto" }}>{dateStr}</span>
      </div>
      {data && !data.ok && <p className={styles.err}>불러오지 못했습니다 — {data.error}</p>}
      {cur ? <Kanban customers={cs} cohort={cur} /> : data?.ok ? <p className={styles.empty}>기수 접수가 아직 없습니다.</p> : <p className={styles.empty}>불러오는 중…</p>}
      <p className={styles.origin}>단계의 정본은 구글 시트 — 카드는 읽기만. 카드 이동(쓰기)은 시트 기입 중단 합의(P5) 뒤에 켠다.</p>

      <div className={styles.cards}>
        <div className={styles.card}><div className={styles.num}>{data ? inCohort.length : "…"}</div><div className={styles.cap}>{cur ?? "기수"} 파이프라인</div></div>
        <div className={styles.card}><div className={styles.num}>{data ? n("paid") + n("attending") : "…"}</div><div className={styles.cap}>결제 완료</div></div>
        <div className={styles.card}><div className={styles.num}>{data ? n("accepted_unpaid") : "…"}</div><div className={styles.cap}>합격 · 미결제</div></div>
        <div className={styles.card}><div className={styles.num}>{data ? n("interview_booked") : "…"}</div><div className={styles.cap}>인터뷰 예정</div></div>
        <div className={styles.card}><div className={styles.num}>{data ? cs.length : "…"}</div><div className={styles.cap}>고객 전체</div></div>
      </div>

      <section className={styles.sec}>
        <h2 className={styles.secTitle}>오늘 할 일 <span className={styles.muted}>{today ? items.length : "…"}</span></h2>
        {today && !today.ok && <p className={styles.err}>불러오지 못했습니다 — {today.error}</p>}
        {today?.tomorrow && <p className={styles.muted}>내일은 {today.tomorrow.label} ({today.tomorrow.date})</p>}
        {grouped.map(([kind, list]) => (
          <div key={kind}>
            <p className={styles.todayGroup}>{TODAY_LABEL[kind].group} · {list.length}</p>
            <ul className={styles.list}>
              {list.map((it, i) => (
                <li key={`${kind}-${it.key}-${i}`} className={styles.li}>
                  <a className={styles.liWho} href={`/admin/customers/${encodeURIComponent(it.key)}`}>{it.name ?? "(이름 없음)"}</a>
                  <span className={styles.muted}>{TODAY_LABEL[kind].why}</span>
                  <span className={styles.sub}>{it.what}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {today?.ok && !items.length && <p className={styles.empty}>오늘은 없습니다.</p>}
      </section>

      <section className={styles.sec}>
        <h2 className={styles.secTitle}>최근 활동</h2>
        <ul className={styles.list}>
          {cs.filter((c) => c.lastActivityAt).slice(0, 10).map((c) => (
            <li key={c.key} className={styles.li}>
              <a className={styles.liWho} href={`/admin/customers/${encodeURIComponent(c.key)}`}>{c.name ?? "(이름 없음)"}</a>
              <span className={styles.muted}>{fmtDate(c.lastActivityAt!)}</span>
              <span className={styles.sub}>{primaryStage(c) ? STAGE_LABEL[primaryStage(c)!] : "기수 없음"}{c.member ? " · 회원" : ""}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className={styles.origin}>{data?.origin}</p>
    </AdminShell>
  )
}
