"use client"

/**
 * 고객 — 기수별 그룹 표 + 행 → 우측 패널(빠르게) → '전체 보기' → 3열 레코드 페이지(깊게)
 * (2026-09-02, 대시보드 CRM-3 · 통합안 B 자리). 데이터: /api/lazyday/admin/customers (세 원장을 전화로 묶은 파생).
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminShell, adminFetch } from "../AdminShell"
import styles from "../crm.module.css"
import type { Customer } from "@/lib/customers"
import { STAGE_LABEL, PersonFlags, RecordPanel, fmtPhone, fmtDate, primaryStage } from "./parts"

type ListRes = { ok: boolean; count?: number; customers?: Customer[]; origin?: string; error?: string }
type View = "all" | "cohort" | "unpaid" | "flag" | "member"

export default function CustomersPage() {
  const router = useRouter()
  const [data, setData] = useState<ListRes | null>(null)
  const [view, setView] = useState<View>("all")
  const [q, setQ] = useState("")
  const [peek, setPeek] = useState<Customer | null>(null)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  useEffect(() => {
    adminFetch<ListRes>("/api/lazyday/admin/customers?limit=1000", router).then((r) => r && setData(r))
  }, [router])

  const open = useCallback(async (c: Customer) => {
    setLoadingKey(c.key)
    const r = await adminFetch<{ ok: boolean; customer?: Customer }>(`/api/lazyday/admin/customers?key=${encodeURIComponent(c.key)}`, router)
    setLoadingKey(null)
    if (r?.customer) setPeek(r.customer)
  }, [router])

  const rows = useMemo(() => {
    let list = data?.customers ?? []
    const digits = q.replace(/\D/g, "")
    if (q.trim()) list = list.filter((c) => (c.name ?? "").includes(q.trim()) || (digits.length >= 3 && (c.phone ?? "").includes(digits)))
    if (view === "cohort") list = list.filter((c) => c.entries.length)
    if (view === "unpaid") list = list.filter((c) => c.entries.some((e) => e.stage === "accepted_unpaid"))
    if (view === "flag") list = list.filter((c) => c.flags.length)
    if (view === "member") list = list.filter((c) => c.member)
    return list
  }, [data, q, view])

  // 기수별 그룹 — 최신 기수부터, 기수 없는 사람은 마지막
  const groups = useMemo(() => {
    const m = new Map<string, Customer[]>()
    for (const c of rows) {
      const g = c.entries[0]?.cohort ?? "기수 없음"
      m.set(g, [...(m.get(g) ?? []), c])
    }
    return [...m.entries()].sort(([a], [b]) => (a === "기수 없음" ? 1 : b === "기수 없음" ? -1 : b.localeCompare(a)))
  }, [rows])

  return (
    <AdminShell>
      <div className={styles.head}>
        <h1 className={styles.h1}>고객</h1>
        <span className={styles.muted}>{data?.count ?? "…"}명 · 전화번호로 묶은 접수·주문·회원 · 행을 누르면 오른쪽에서 열린다</span>
      </div>
      {data && !data.ok && <p className={styles.err}>불러오지 못했습니다 — {data.error}</p>}
      <div className={styles.views}>
        {([["all", "전체"], ["cohort", "기수 있음"], ["unpaid", "미결제"], ["flag", "손볼 것"], ["member", "회원"]] as const).map(([k, l]) => (
          <button key={k} className={`${styles.view} ${view === k ? styles.viewOn : ""}`} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>
      <input className={styles.search} placeholder="이름 · 전화번호" value={q} onChange={(e) => setQ(e.target.value)} />
      <table className={styles.table}>
        <thead><tr><th>이름</th><th>전화</th><th>단계</th><th>최근 활동</th><th>접수·주문</th><th>회원</th></tr></thead>
        <tbody>
          {groups.map(([g, list]) => (
            <GroupRows key={g} label={`${g} · ${list.length}`} list={list} onOpen={open} selected={peek?.key ?? loadingKey} />
          ))}
          {data?.ok && !rows.length && <tr><td colSpan={6} className={styles.empty}>해당 없음</td></tr>}
        </tbody>
      </table>
      <p className={styles.origin}>{data?.origin}</p>
      {peek && <RecordPanel c={peek} onClose={() => setPeek(null)} />}
    </AdminShell>
  )
}

function GroupRows({ label, list, onOpen, selected }: { label: string; list: Customer[]; onOpen: (c: Customer) => void; selected: string | null }) {
  return (
    <>
      <tr className={styles.groupRow}><td colSpan={6}>{label}</td></tr>
      {list.map((c) => {
        const st = primaryStage(c)
        return (
          <tr key={c.key} className={selected === c.key ? styles.trOn : ""} onClick={() => onOpen(c)}>
            <td><span className={styles.name}>{c.name ?? <span className={styles.muted}>(이름 없음)</span>}</span> <PersonFlags c={c} /></td>
            <td className={styles.muted}>{fmtPhone(c.phone)}</td>
            <td className={styles.stage}>{st ? STAGE_LABEL[st] : "—"}</td>
            <td className={styles.muted}>{c.lastActivityAt ? fmtDate(c.lastActivityAt) : "—"}</td>
            <td className={styles.muted}>{c.counts.applications} · {c.counts.orders}</td>
            <td className={styles.muted}>{c.member ? "○" : "—"}</td>
          </tr>
        )
      })}
    </>
  )
}
