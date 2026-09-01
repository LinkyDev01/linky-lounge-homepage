"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./applications.module.css"

/**
 * 접수 원장 조회 (2026-09-01, 계획서 P3 — Stage A).
 *
 * **보는 곳이지 고치는 곳이 아니다.** 상태의 정본은 당분간 구글 시트라 이 화면은
 * status 를 렌더링하지 않고 쓰기 버튼도 두지 않는다 (쓰기는 P5 에서 "시트 기입 중단"
 * 합의 뒤에 연다). 화면 스스로 그 사실을 밝힌다.
 *
 * 디자인은 **레이지클럽 베이스** (운영자 지시). 백지+잉크·13.2px·괘선 리스트·
 * 텍스트 링크. 유채색 UI 와 보더 버튼을 쓰지 않으므로 "손이 필요한 행"은
 * 색이 아니라 굵기와 라벨로 드러낸다.
 *
 * UX 판단
 *  · 운영자는 폰으로 본다 — 표가 아니라 괘선 리스트, 행 전체가 탭 대상
 *  · 스캔할 때 전화번호를 통째로 늘어놓지 않는다(어깨너머 노출) — 가운데를 가리고
 *    행을 펴면 전체가 보인다. 연락은 상세에서 하면 된다
 *  · 파기된 행은 이름·전화가 이미 비어 있다 — 빈칸 대신 '파기됨'이라고 말해준다
 */

type Row = {
  id: string
  kind: string
  name: string | null
  phone: string | null
  orderNo: string | null
  cohort: string | null
  trafficSrc: string | null
  payload: Record<string, unknown> | null
  payloadSrc: string
  statusNote: string | null
  gasBodyLost: boolean
  endsOn: string | null
  purgeAfter: string | null
  purgedAt: string | null
  submittedAt: string
}

const KIND_LABEL: Record<string, string> = {
  bookclub: "북클럽",
  oneday: "원데이",
  coffeebar: "커피앤바",
  notify: "기수 알림",
  interview_phone: "전화 인터뷰",
  interview_written: "서면 인터뷰",
  review: "후기",
}

const FILTERS = ["", "bookclub", "oneday", "coffeebar", "notify", "interview_phone", "interview_written"]

/** 010-1234-5678 → 010-****-5678. 스캔 중에는 가리고, 펴면 전체를 보여준다 */
function maskPhone(p: string | null) {
  if (!p) return null
  const d = p.replace(/[^0-9]/g, "")
  if (d.length < 8) return p
  return `${d.slice(0, 3)}-****-${d.slice(-4)}`
}

function fmtPhone(p: string | null) {
  if (!p) return null
  const d = p.replace(/[^0-9]/g, "")
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : p
}

function fmtWhen(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const kst = new Date(d.getTime() + 9 * 3600_000)
  const mm = String(kst.getUTCMonth() + 1)
  const dd = String(kst.getUTCDate())
  const hh = String(kst.getUTCHours()).padStart(2, "0")
  const mi = String(kst.getUTCMinutes()).padStart(2, "0")
  return `${mm}/${dd} ${hh}:${mi}`
}

export default function AdminApplicationsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [summary, setSummary] = useState<{ kind: string; count: number }[]>([])
  const [enabled, setEnabled] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [kind, setKind] = useState("")
  const [q, setQ] = useState("")
  const [term, setTerm] = useState("")
  const [open, setOpen] = useState("")
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState("")

  const load = useCallback(async (offset: number) => {
    setLoading(true)
    setFailed("")
    try {
      const sp = new URLSearchParams()
      if (kind) sp.set("kind", kind)
      if (term) sp.set("q", term)
      if (offset) sp.set("offset", String(offset))
      const res = await fetch(`/api/lazyday/admin/applications?${sp}`, { cache: "no-store" })
      if (res.status === 401) { router.replace("/lazyday/admin/login"); return }
      const data = await res.json()
      if (data.error) setFailed(data.error)
      setEnabled(data.enabled !== false)
      setSummary(data.summary ?? [])
      setHasMore(Boolean(data.hasMore))
      setRows((prev) => (offset ? [...prev, ...(data.rows ?? [])] : (data.rows ?? [])))
    } catch {
      setFailed("조회에 실패했어요. 잠시 후 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }, [kind, term, router])

  useEffect(() => { void load(0) }, [load])

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <a href="/lazyday/admin" className={styles.back}>← 관리</a>
          <h1 className={styles.title}>접수 원장</h1>
          <p className={styles.origin}>
            보기 전용입니다. 진행 상태의 정본은 <strong>구글 시트</strong>예요 — 여기서 고치지 않습니다.
          </p>
        </div>

        {!enabled && (
          <p className={styles.note}>
            원장이 꺼져 있어요. Vercel 환경변수 SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY 를 확인해주세요.
          </p>
        )}

        {enabled && summary.length > 0 && (
          <div className={styles.summary}>
            {summary.map((s) => (
              <span key={s.kind} className={styles.summaryItem}>
                <span className={styles.summaryNum}>{s.count}</span>
                <span className={styles.summaryCap}>{KIND_LABEL[s.kind] ?? s.kind}</span>
              </span>
            ))}
            <p className={styles.summaryNote}>
              최근 7일 · <strong>DB 기준</strong>입니다. 시트와 맞는지는 이 숫자만으로는 알 수 없어요.
            </p>
          </div>
        )}

        <div className={styles.filters}>
          {FILTERS.map((k) => (
            <button
              key={k || "all"}
              type="button"
              className={`${styles.filter} ${kind === k ? styles.filterOn : ""}`}
              onClick={() => setKind(k)}
            >
              {k ? (KIND_LABEL[k] ?? k) : "전체"}
            </button>
          ))}
        </div>

        <div className={styles.searchRow}>
          <form onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()) }}>
            <input
              className={styles.search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="이름 또는 연락처로 찾기"
              aria-label="이름 또는 연락처로 찾기"
            />
          </form>
        </div>

        {failed && <p className={styles.note}>{failed}</p>}

        <ul className={styles.list}>
          {rows.map((r) => {
            const isOpen = open === r.id
            const purged = Boolean(r.purgedAt)
            return (
              <li key={r.id} className={styles.row}>
                <button
                  type="button"
                  className={styles.rowBtn}
                  onClick={() => setOpen(isOpen ? "" : r.id)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.who}>
                    {purged ? "(파기됨)" : (r.name || "(이름 없음)")}
                  </span>
                  <span className={styles.when}>{fmtWhen(r.submittedAt)}</span>
                  <span className={styles.meta}>
                    <span>{KIND_LABEL[r.kind] ?? r.kind}</span>
                    {!purged && r.phone && <span>{isOpen ? fmtPhone(r.phone) : maskPhone(r.phone)}</span>}
                    {r.cohort && <span>{r.cohort}</span>}
                    {r.statusNote && <span className={styles.flag}>시트 없음</span>}
                    {r.gasBodyLost && <span className={styles.flag}>응답 유실</span>}
                    {r.payloadSrc === "sheet" && <span>시트에서 보정</span>}
                  </span>
                </button>

                {isOpen && (
                  <div className={styles.detail}>
                    <dl className={styles.detailGrid}>
                      {r.orderNo && (<><dt>주문번호</dt><dd>{r.orderNo}</dd></>)}
                      {r.trafficSrc && (<><dt>유입 출처</dt><dd>{r.trafficSrc}</dd></>)}
                      {r.endsOn && (<><dt>모임 종료</dt><dd>{r.endsOn}</dd></>)}
                      <dt>파기 예정</dt>
                      <dd>{purged ? `파기 완료 (${r.purgeAfter})` : r.purgeAfter}</dd>
                      {r.statusNote && (<><dt>메모</dt><dd>{r.statusNote}</dd></>)}
                    </dl>
                    {r.payload && Object.keys(r.payload).length > 0 && (
                      <p className={styles.payload}>
                        {Object.entries(r.payload)
                          .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
                          .join("\n")}
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {!loading && enabled && rows.length === 0 && !failed && (
          <p className={styles.empty}>
            {term || kind ? "조건에 맞는 접수가 없어요." : "아직 접수가 없어요."}
          </p>
        )}
        {loading && <p className={styles.note}>불러오는 중…</p>}
        {hasMore && !loading && (
          <button type="button" className={styles.more} onClick={() => void load(rows.length)}>
            더 보기
          </button>
        )}
      </div>
    </main>
  )
}
