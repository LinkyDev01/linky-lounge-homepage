"use client"

/** 고객 레코드 페이지 — 3열 (좌 속성 · 중 타임라인 · 우 연관). CRM-3, 통합안 A 자리. */

import { useCallback, useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { AdminShell, adminFetch } from "../../AdminShell"
import styles from "../../crm.module.css"
import type { Customer } from "@/lib/customers"
import { Record3 } from "../parts"

export default function CustomerPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params)
  const router = useRouter()
  const [res, setRes] = useState<{ ok: boolean; customer?: Customer; error?: string } | null>(null)
  const load = useCallback(() => {
    adminFetch<{ ok: boolean; customer?: Customer; error?: string }>(`/api/lazyday/admin/customers?key=${encodeURIComponent(decodeURIComponent(key))}`, router).then((r) => r && setRes(r))
  }, [key, router])
  useEffect(() => { load() }, [load])
  return (
    <AdminShell>
      <div className={styles.head}><a href="/admin/customers" className={styles.muted}>← 고객</a></div>
      {!res && <p className={styles.muted} style={{ padding: "14px 0" }}>불러오는 중…</p>}
      {res && !res.ok && <p className={styles.err}>{res.error === "not found" ? "없는 고객입니다." : `불러오지 못했습니다 — ${res.error}`}</p>}
      {res?.customer && <Record3 c={res.customer} onSaved={load} />}
    </AdminShell>
  )
}
