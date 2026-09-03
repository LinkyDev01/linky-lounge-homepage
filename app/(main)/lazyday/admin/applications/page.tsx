"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./applications.module.css"
import { AdminShell } from "../AdminShell"

/**
 * 접수 원장 조회 (2026-09-01, 계획서 P3 — Stage A).
 *
 * **진행 상태는 고치지 않는다.** 그 정본은 구글 시트라 이 화면은 status 를 렌더링하지도,
 * 쓰지도 않는다 (P5 에서 "시트 기입 중단" 합의 뒤에 연다).
 * **분류(triage)와 메모는 쓴다** — 테스트·오기·더미·중복신청·기결제자는 시트에 없는
 * 개념이라 정본이 갈릴 일이 없다. 화면 머리가 그 경계를 스스로 밝힌다.
 * ⚠ 분류 중 **목록에서 빠지는 건 앞의 넷뿐**이다 — 기결제자는 표시만 하고 남는다.
 *
 * 디자인은 **레이지클럽 베이스** (운영자 지시). 백지+잉크·13.2px·괘선 리스트·
 * 텍스트 링크. 유채색 UI 와 보더 버튼을 쓰지 않으므로 "손이 필요한 행"은
 * 색이 아니라 굵기와 라벨로 드러낸다.
 *
 * UX 판단
 *  · 운영자는 폰으로 본다 — 표가 아니라 괘선 리스트, 행 전체가 탭 대상
 *  · **전화번호는 목록에서 그대로 보여준다** (운영자 2026-09-01 "관리용이므로 휴대전화 필요해").
 *    초안은 가운데를 가렸는데, 연락하려고 매번 행을 펴야 해서 관리 도구로는 손이 더 갔다.
 *    이 화면은 쿠키로 막힌 관리자 전용이라 노출 대상이 열람자 본인뿐이다.
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
  triage: string | null
  triageNote: string | null
  triagedAt: string | null
}

/** 분류 — 운영자 지시(2026-09-01): "테스트 오기 더미 중복신청 기결제자 등으로 표기해야해
 *  일반적으로 분류되는 것으로 명확하게". 파기가 아니라 열람 표시다.
 *  ⚠ `hides` 로 두 종류가 갈린다 — **기결제자는 빼지 않는다**(운영자 "기결제자는 물론
 *  기본제외대상이 아니지"). 허수가 아니라 가장 진짜인 접수라 표시만 하고 목록에 남는다. */
const TRIAGE: { key: string; label: string; hint: string; hides: boolean }[] = [
  { key: "test",      label: "테스트",   hint: "우리가 넣은 검증용",        hides: true },
  { key: "typo",      label: "오기",     hint: "잘못 적어 다시 낸 것",      hides: true },
  { key: "dummy",     label: "더미",     hint: "내용이 없는 빈 접수",       hides: true },
  { key: "duplicate", label: "중복신청", hint: "같은 사람이 또 낸 것",      hides: true },
  { key: "paid",      label: "기결제자", hint: "결제까지 끝난 건 — 목록에 그대로 남습니다", hides: false },
]
const TRIAGE_LABEL: Record<string, string> = Object.fromEntries(TRIAGE.map((t) => [t.key, t.label]))

const KIND_LABEL: Record<string, string> = {
  bookclub: "북클럽",
  oneday: "원데이",
  coffeebar: "커피앤바",
  notify: "기수 알림",
  interview_phone: "전화 인터뷰",
  interview_written: "서면 인터뷰",
  review: "후기",
  host: "모임장 기획서",
}

const FILTERS = ["", "bookclub", "oneday", "coffeebar", "notify", "interview_phone", "interview_written", "host"]

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
  const [triaged, setTriaged] = useState(false)
  const [triagedCount, setTriagedCount] = useState(0)
  const [noteDraft, setNoteDraft] = useState("")
  const [saving, setSaving] = useState("")
  const [confirmPurge, setConfirmPurge] = useState("")
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState("")

  const load = useCallback(async (offset: number) => {
    setLoading(true)
    setFailed("")
    try {
      const sp = new URLSearchParams()
      if (kind) sp.set("kind", kind)
      if (term) sp.set("q", term)
      if (triaged) sp.set("triaged", "1")
      if (offset) sp.set("offset", String(offset))
      const res = await fetch(`/api/lazyday/admin/applications?${sp}`, { cache: "no-store" })
      if (res.status === 401) { router.replace("/admin/login"); return }
      const data = await res.json()
      if (data.error) setFailed(data.error)
      setEnabled(data.enabled !== false)
      setSummary(data.summary ?? [])
      setTriagedCount(data.triagedCount ?? 0)
      setHasMore(Boolean(data.hasMore))
      setRows((prev) => (offset ? [...prev, ...(data.rows ?? [])] : (data.rows ?? [])))
    } catch {
      setFailed("조회에 실패했어요. 잠시 후 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }, [kind, term, triaged, router])

  useEffect(() => { void load(0) }, [load])

  /** 분류·메모 저장. 낙관적으로 화면을 먼저 바꾸지 않는다 — 저장 실패를 눈치 못 채면
   *  "뺐다고 생각한 행"이 그대로 남아 다음에 또 걸린다. */
  const save = useCallback(async (id: string, patch: { triage?: string | null; note?: string }) => {
    setSaving(id)
    try {
      const res = await fetch("/api/lazyday/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      })
      if (!res.ok) { setFailed("저장에 실패했어요."); return }
      await load(0)
      setOpen("")
    } catch {
      setFailed("저장에 실패했어요.")
    } finally {
      setSaving("")
    }
  }, [load])

  /** 삭제 요청 즉시 파기. **되돌릴 수 없다** — 그래서 두 번 눌러야 실행된다.
   *  분류(save)와 자리도 메서드도 갈라 뒀다: 실수로 같이 눌릴 수 없게. */
  const purge = useCallback(async (id: string) => {
    setSaving(id)
    try {
      const res = await fetch(`/api/lazyday/admin/applications?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (!res.ok) { setFailed("파기에 실패했어요."); return }
      setConfirmPurge("")
      await load(0)
      setOpen("")
    } catch {
      setFailed("파기에 실패했어요.")
    } finally {
      setSaving("")
    }
  }, [load])

  return (
    <AdminShell>
    <main className={`${styles.page} ${styles.embedded}`}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <h1 className={styles.title}>접수 원장</h1>
          <p className={styles.origin}>
            <strong>진행 상태</strong>(미진행·결제완료·탈락…)의 정본은 <strong>구글 시트</strong>예요 — 여기서 고치지 않습니다.
            여기서 다는 건 <strong>분류와 메모</strong>뿐이고, 그건 시트에 없는 값이라 부딪히지 않아요.
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
              최근 7일 · <strong>DB 기준</strong>이고 분류해 뺀 건 빠져 있어요. 시트와 맞는지는 이 숫자만으로는 알 수 없습니다.
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
          {/* 지운 게 아니라 빼둔 것이므로 언제든 다시 꺼내 볼 수 있어야 한다 */}
          <button
            type="button"
            className={`${styles.filter} ${styles.filterAside} ${triaged ? styles.filterOn : ""}`}
            onClick={() => { setTriaged(!triaged); setOpen("") }}
          >
            분류해 뺀 건 {triagedCount > 0 && `(${triagedCount})`}
          </button>
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
                  onClick={() => { setOpen(isOpen ? "" : r.id); setNoteDraft(r.triageNote ?? ""); setConfirmPurge("") }}
                  aria-expanded={isOpen}
                >
                  <span className={styles.who}>
                    {purged ? "(파기됨)" : (r.name || "(이름 없음)")}
                  </span>
                  <span className={styles.when}>{fmtWhen(r.submittedAt)}</span>
                  <span className={styles.meta}>
                    <span>{KIND_LABEL[r.kind] ?? r.kind}</span>
                    {!purged && r.phone && <span>{fmtPhone(r.phone)}</span>}
                    {r.cohort && <span>{r.cohort}</span>}
                    {r.statusNote && <span className={styles.flag}>시트 없음</span>}
                    {r.gasBodyLost && <span className={styles.flag}>응답 유실</span>}
                    {r.payloadSrc === "sheet" && <span>시트에서 보정</span>}
                    {r.triage && <span className={styles.tag}>{TRIAGE_LABEL[r.triage] ?? r.triage}</span>}
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

                    {/* ── 여기부터는 **우리가 단 것**이다. 위(접수 원문)와 자리를 나눠
                        손님이 쓴 것과 섞이지 않게 한다 (운영자 "원본과 구분하고") ── */}
                    <div className={styles.ops}>
                      {/* 빼는 표시와 그냥 표시를 **줄을 나눠** 둔다 — 한 줄에 섞으면
                          기결제자를 누르면 목록에서 사라진다고 오해한다 */}
                      <p className={styles.opsCap}>목록에서 빼기 — 지우지 않고 기본 목록에서만 뺍니다</p>
                      <div className={styles.opsRow}>
                        {TRIAGE.filter((t) => t.hides).map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            title={t.hint}
                            disabled={saving === r.id}
                            className={`${styles.filter} ${r.triage === t.key ? styles.filterOn : ""}`}
                            onClick={() => void save(r.id, { triage: r.triage === t.key ? null : t.key })}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      <p className={styles.opsCap2}>표시만 — 목록에 그대로 남습니다</p>
                      <div className={styles.opsRow}>
                        {TRIAGE.filter((t) => !t.hides).map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            title={t.hint}
                            disabled={saving === r.id}
                            className={`${styles.filter} ${r.triage === t.key ? styles.filterOn : ""}`}
                            onClick={() => void save(r.id, { triage: r.triage === t.key ? null : t.key })}
                          >
                            {t.label}
                          </button>
                        ))}
                        {r.triage && (
                          <button
                            type="button"
                            disabled={saving === r.id}
                            className={`${styles.filter} ${styles.filterAside}`}
                            onClick={() => void save(r.id, { triage: null })}
                          >
                            분류 지우기
                          </button>
                        )}
                      </div>

                      <form
                        className={styles.opsNote}
                        onSubmit={(e) => { e.preventDefault(); void save(r.id, { note: noteDraft }) }}
                      >
                        <input
                          className={styles.search}
                          defaultValue={r.triageNote ?? ""}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="메모 (엔터로 저장)"
                          aria-label="운영 메모"
                          disabled={saving === r.id}
                        />
                      </form>

                      {/* ── 파기는 분류와 성격이 다르다(열람 표시 vs 개인정보 삭제).
                          맨 아래 괘선 밑에 따로 두고 **두 번 눌러야** 실행된다 ── */}
                      {!purged && (
                        <div className={styles.danger}>
                          {confirmPurge === r.id ? (
                            <>
                              <p className={styles.dangerCap}>
                                이름·전화·신청서 내용을 지웁니다. <strong>되돌릴 수 없어요.</strong>
                                {" "}행은 남고 &ldquo;파기됨&rdquo;으로 표시됩니다.
                              </p>
                              <div className={styles.opsRow}>
                                <button
                                  type="button"
                                  disabled={saving === r.id}
                                  className={`${styles.filter} ${styles.filterOn}`}
                                  onClick={() => void purge(r.id)}
                                >
                                  파기합니다
                                </button>
                                <button
                                  type="button"
                                  disabled={saving === r.id}
                                  className={styles.filter}
                                  onClick={() => setConfirmPurge("")}
                                >
                                  취소
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              className={styles.filter}
                              onClick={() => setConfirmPurge(r.id)}
                            >
                              삭제 요청 파기…
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {!loading && enabled && rows.length === 0 && !failed && (
          <p className={styles.empty}>
            {triaged ? "분류해 뺀 건이 없어요." : term || kind ? "조건에 맞는 접수가 없어요." : "아직 접수가 없어요."}
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
    </AdminShell>
  )
}
