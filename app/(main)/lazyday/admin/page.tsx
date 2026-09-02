"use client"

/**
 * 관리 홈 (2026-09-02, 대시보드 CRM-3) — 통합안의 홈 자리.
 * 지금은 숫자 요약 + 최근 활동 + 손볼 것. CRM-4 에서 기수 파이프라인 칸반 + 오늘 할 일 8종이 위에 얹힌다.
 * 종전의 인터뷰 차단 달력은 /admin/schedule 로 옮겼다(내비 '일정').
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminShell, adminFetch } from "./AdminShell"
import styles from "./crm.module.css"
import type { Customer } from "@/lib/customers"
import { STAGE_LABEL, flagText, fmtDate, primaryStage } from "./customers/parts"

type ListRes = { ok: boolean; count?: number; customers?: Customer[]; origin?: string; error?: string }

export default function AdminHome() {
  const router = useRouter()
  const [data, setData] = useState<ListRes | null>(null)
  useEffect(() => {
    adminFetch<ListRes>("/api/lazyday/admin/customers?limit=1000", router).then((r) => r && setData(r))
  }, [router])
  const cs = useMemo(() => data?.customers ?? [], [data])
  const latestCohort = useMemo(() => [...new Set(cs.flatMap((c) => c.entries.map((e) => e.cohort)))].sort().reverse()[0], [cs])
  const inCohort = cs.filter((c) => c.entries.some((e) => e.cohort === latestCohort))
  const n = (s: string) => inCohort.filter((c) => c.entries.find((e) => e.cohort === latestCohort)?.stage === s).length
  const flagged = cs.filter((c) => c.flags.length && !c.flags.includes("purged"))
  const today = new Date(); const dateStr = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}`

  return (
    <AdminShell>
      <div className={styles.head}><h1 className={styles.h1}>홈</h1><span className={styles.muted}>{dateStr}</span></div>
      {data && !data.ok && <p className={styles.err}>불러오지 못했습니다 — {data.error}</p>}
      <div className={styles.cards}>
        <div className={styles.card}><div className={styles.num}>{data ? inCohort.length : "…"}</div><div className={styles.cap}>{latestCohort ?? "기수"} 파이프라인</div></div>
        <div className={styles.card}><div className={styles.num}>{data ? n("paid") + n("attending") : "…"}</div><div className={styles.cap}>결제 완료</div></div>
        <div className={styles.card}><div className={styles.num}>{data ? n("accepted_unpaid") : "…"}</div><div className={styles.cap}>합격 · 미결제</div></div>
        <div className={styles.card}><div className={styles.num}>{data ? n("interview_booked") : "…"}</div><div className={styles.cap}>인터뷰 예정</div></div>
        <div className={styles.card}><div className={styles.num}>{data ? cs.length : "…"}</div><div className={styles.cap}>고객 전체</div></div>
      </div>

      <section className={styles.sec}>
        <h2 className={styles.secTitle}>손볼 것 <span className={styles.muted}>{flagged.length}</span></h2>
        <ul className={styles.list}>
          {flagged.slice(0, 12).map((c) => (
            <li key={c.key} className={styles.li}>
              <a className={styles.liWho} href={`/admin/customers/${encodeURIComponent(c.key)}`}>{c.name ?? "(이름 없음)"}</a>
              <span className={styles.muted}>{flagText(c)}</span>
              <span className={styles.sub}>{primaryStage(c) ? STAGE_LABEL[primaryStage(c)!] : "기수 없음"} · 접수 {c.counts.applications} · 주문 {c.counts.orders}</span>
            </li>
          ))}
          {data?.ok && !flagged.length && <li className={styles.empty}>없음</li>}
        </ul>
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
      <p className={styles.origin}>{data?.origin} · 파이프라인 칸반과 오늘 할 일은 다음 단계(CRM-4)에서 이 자리에.</p>
    </AdminShell>
  )
}
