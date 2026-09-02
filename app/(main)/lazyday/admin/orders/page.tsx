"use client"

/**
 * 주문 — orders 원장 표 (2026-09-02, 대시보드 CRM-6). 읽기 전용(법정 5년 원장).
 * 이름 → 고객 레코드. 신청서 미제출 주문은 굵게 — 재진입 링크 대상.
 */

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminShell, adminFetch } from "../AdminShell"
import styles from "../crm.module.css"
import { fmtPhone, fmtDateTime, won } from "../customers/parts"

type Order = {
  id: string; orderNo: string; amount: number; status: string; provider: string; name: string; phone: string | null; at: string
  applicationSubmitted: boolean; userLinked: boolean; items: { name: string; quantity: number; unitPrice: number; kind: string; note: string | null }[]
}
type Res = { ok: boolean; count?: number; orders?: Order[]; error?: string }
const STATUS_LABEL: Record<string, string> = { paid: "결제", refunded: "환불", partially_refunded: "부분 환불", cancelled: "취소" }
type View = "all" | "paid" | "refunded" | "unsubmitted"

export default function OrdersPage() {
  const router = useRouter()
  const [data, setData] = useState<Res | null>(null)
  const [view, setView] = useState<View>("all")
  const [q, setQ] = useState("")
  useEffect(() => {
    adminFetch<Res>("/api/lazyday/admin/orders?limit=1000", router).then((r) => r && setData(r))
  }, [router])
  const rows = useMemo(() => {
    let list = data?.orders ?? []
    const digits = q.replace(/\D/g, "")
    if (q.trim()) list = list.filter((o) => o.name.includes(q.trim()) || o.orderNo.includes(q.trim()) || (digits.length >= 3 && (o.phone ?? "").includes(digits)))
    if (view === "paid") list = list.filter((o) => o.status === "paid")
    if (view === "refunded") list = list.filter((o) => o.status !== "paid")
    if (view === "unsubmitted") list = list.filter((o) => !o.applicationSubmitted && o.items.some((i) => i.kind === "meeting"))
    return list
  }, [data, q, view])
  const total = rows.filter((o) => o.status === "paid").reduce((s, o) => s + o.amount, 0)

  return (
    <AdminShell>
      <div className={styles.head}>
        <h1 className={styles.h1}>주문</h1>
        <span className={styles.muted}>{data?.count ?? "…"}건 · 결제로 성립한 계약(법정 5년) · 읽기만</span>
      </div>
      {data && !data.ok && <p className={styles.err}>불러오지 못했습니다 — {data.error}</p>}
      <div className={styles.views}>
        {([["all", "전체"], ["paid", "결제"], ["refunded", "환불·취소"], ["unsubmitted", "신청서 미제출"]] as const).map(([k, l]) => (
          <button key={k} className={`${styles.view} ${view === k ? styles.viewOn : ""}`} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>
      <input className={styles.search} placeholder="이름 · 전화번호 · 주문번호" value={q} onChange={(e) => setQ(e.target.value)} />
      <table className={styles.table}>
        <thead><tr><th>이름</th><th>항목</th><th>금액</th><th>일시</th><th>주문번호</th><th>상태</th></tr></thead>
        <tbody>
          {rows.map((o) => {
            const unsub = !o.applicationSubmitted && o.items.some((i) => i.kind === "meeting")
            const key = o.phone ? o.phone : null
            return (
              <tr key={o.id} onClick={() => key && router.push(`/admin/customers/${encodeURIComponent(key)}`)} style={key ? undefined : { cursor: "default" }}>
                <td><span className={styles.name}>{o.name}</span>{unsub && <span className={styles.flag}> 신청서 미제출</span>}<div className={styles.muted}>{fmtPhone(o.phone)}{o.userLinked ? " · 계정" : ""}</div></td>
                <td>{o.items.map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}</td>
                <td>{won(o.amount)}</td>
                <td className={styles.muted}>{fmtDateTime(o.at)}</td>
                <td className={styles.muted}>{o.orderNo}</td>
                <td className={o.status === "paid" ? "" : styles.strong}>{STATUS_LABEL[o.status] ?? o.status}</td>
              </tr>
            )
          })}
          {data?.ok && !rows.length && <tr><td colSpan={6} className={styles.empty}>해당 없음</td></tr>}
        </tbody>
      </table>
      <p className={styles.origin}>결제 {rows.filter((o) => o.status === "paid").length}건 합계 {won(total)} · 환불·취소의 정본은 토스 — 여기 상태는 승인 라우트·웹훅이 적은 값</p>
    </AdminShell>
  )
}
