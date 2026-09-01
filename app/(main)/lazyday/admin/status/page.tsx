"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { copyText } from "../../support"
import { SUCCESS_PATH } from "@/lib/payments/config"
import styles from "./status.module.css"

/**
 * 운영 상태 점검 페이지 (운영자 지시 2026-08-06 "오류사항 확인할 수 있는 페이지").
 * 과거 로그 저장소가 아니라, 열 때마다 신청·인터뷰 경로를 실제로 찔러
 * "지금 문제 있나"를 즉답한다. /lazyday/admin 과 같은 쿠키로 보호된다.
 */

type Check = { key: string; label: string; ok: boolean; detail: string; ms?: number; hint?: string }

/** 결제만 하고 신청서를 안 낸 주문 (모임 포함 주문만 — 굿즈 주문은 신청서가 원래 없다) */
type UnsubmittedOrder = {
  orderNo: string
  name: string
  phone: string | null
  amount: number
  approvedAt: string | null
  meetings: string[]
}

export default function AdminStatusPage() {
  const router = useRouter()
  const [checks, setChecks] = useState<Check[] | null>(null)
  const [unsubmitted, setUnsubmitted] = useState<UnsubmittedOrder[]>([])
  const [copiedNo, setCopiedNo] = useState("")
  const [checkedAt, setCheckedAt] = useState("")
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState("")

  const run = useCallback(async () => {
    setLoading(true)
    setFailed("")
    try {
      const res = await fetch("/api/lazyday/admin/health", { cache: "no-store" })
      if (res.status === 401) {
        router.replace("/lazyday/admin/login")
        return
      }
      const data = await res.json()
      setChecks(data.checks ?? [])
      setCheckedAt(data.checkedAt ?? "")
      // 구제 대상 목록 — 원장이 꺼져 있거나 실패해도 점검 화면 자체는 계속 뜬다
      try {
        const r2 = await fetch("/api/lazyday/admin/orders/unsubmitted", { cache: "no-store" })
        if (r2.ok) {
          const d2 = await r2.json()
          setUnsubmitted(d2.orders ?? [])
        }
      } catch {}
    } catch {
      setFailed("점검 요청 자체가 실패했습니다. 네트워크를 확인해주세요.")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    run()
  }, [run])

  const allOk = checks?.every((c) => c.ok) ?? false
  const badCount = checks?.filter((c) => !c.ok).length ?? 0

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>운영 상태 점검</h1>
          <div className={styles.headerActions}>
            <button className={styles.refreshBtn} onClick={run} disabled={loading}>
              {loading ? "점검 중..." : "다시 점검"}
            </button>
            <a className={styles.linkBtn} href="/lazyday/admin/simulate">
              신청 흐름 테스트
            </a>
            <a className={styles.linkBtn} href="/lazyday/admin">
              차단 관리
            </a>
          </div>
        </header>

        {checks && (
          <div className={`${styles.summary} ${allOk ? styles.summaryOk : styles.summaryBad}`}>
            {allOk ? "지금은 모든 항목이 정상입니다." : `점검이 필요한 항목이 ${badCount}건 있습니다.`}
            {checkedAt && (
              <span className={styles.time}>
                {new Date(checkedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 기준
              </span>
            )}
          </div>
        )}

        {failed && <p className={styles.failed}>{failed}</p>}

        {loading && !checks && <p className={styles.loading}>신청·인터뷰 경로를 확인하는 중입니다…</p>}

        <ul className={styles.list}>
          {checks?.map((c) => (
            <li key={c.key} className={styles.item}>
              <span className={`${styles.dot} ${c.ok ? styles.dotOk : styles.dotBad}`} aria-hidden />
              <div className={styles.itemBody}>
                <p className={styles.itemLabel}>
                  {c.label}
                  {typeof c.ms === "number" && <span className={styles.ms}>{(c.ms / 1000).toFixed(1)}초</span>}
                </p>
                <p className={styles.itemDetail}>{c.detail}</p>
                {c.hint && <p className={styles.itemHint}>→ {c.hint}</p>}
              </div>
            </li>
          ))}
        </ul>

        {/* 구제 대상 — 결제 승인은 됐는데 신청서를 안 낸 주문 (2026-08-18, 주문 원장).
            재진입 링크를 복사해 카톡/문자로 보내면 손님이 신청서만 다시 열게 된다
            (결제는 이미 끝난 주문 — 재결제 아님) */}
        {unsubmitted.length > 0 && (
          <section className={styles.rescue}>
            <p className={styles.rescueTitle}>
              신청서 미제출 주문 {unsubmitted.length}건 — 재진입 링크를 보내 주세요
            </p>
            <ul className={styles.rescueList}>
              {unsubmitted.map((o) => (
                <li key={o.orderNo} className={styles.rescueItem}>
                  <div className={styles.rescueBody}>
                    <p className={styles.rescueName}>
                      {o.name}
                      {o.phone && <span className={styles.rescuePhone}> · {o.phone}</span>}
                    </p>
                    <p className={styles.rescueMeta}>
                      {o.meetings.join(", ")} · ₩{o.amount.toLocaleString("ko-KR")}
                      {o.approvedAt &&
                        ` · ${new Date(o.approvedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 결제`}
                    </p>
                  </div>
                  <button
                    className={styles.rescueCopy}
                    onClick={async () => {
                      const url = `${window.location.origin}${SUCCESS_PATH}?orderId=${encodeURIComponent(o.orderNo)}&reentry=1`
                      if (await copyText(url)) {
                        setCopiedNo(o.orderNo)
                        setTimeout(() => setCopiedNo(""), 2000)
                      }
                    }}
                  >
                    {copiedNo === o.orderNo ? "복사됨" : "재진입 링크 복사"}
                  </button>
                </li>
              ))}
            </ul>
            <p className={styles.rescueNote}>
              이 링크는 결제가 이미 승인된 주문의 신청서만 다시 엽니다 — 재결제가 아닙니다.
              제출되면 목록에서 자동으로 빠집니다.
            </p>
          </section>
        )}

        <section className={styles.note}>
          <p className={styles.noteTitle}>참고</p>
          <p className={styles.noteText}>
            신청자가 겪은 개별 오류(제출 실패·문의 링크 클릭)는 서버 기록으로 남습니다. 이 페이지는 그 기록 대신
            <b> 지금 이 순간 각 경로가 살아 있는지</b>를 직접 확인합니다.
          </p>
          <p className={styles.noteText}>
            구글 스크립트는 한동안 호출이 없으면 깨어나는 데 시간이 걸립니다. 첫 점검이 10초를 넘고 다시 점검했을 때
            빨라진다면 정상입니다.
          </p>
        </section>
      </div>
    </main>
  )
}
