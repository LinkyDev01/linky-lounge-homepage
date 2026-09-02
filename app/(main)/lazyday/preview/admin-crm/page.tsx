"use client"

/**
 * 고객관리 대시보드 시안 — CRM형(HubSpot · Attio) 정보 구조 × 레이지클럽 베이스(§9).
 * 운영자 지시(2026-09-02): "고객관리에 최적화된 대시보드 · 레퍼런스 기반". 근거: docs/admin-crm/01-references.md.
 * 실배치(내비·홈·목록·상세·파이프라인 전부)로 보여준다 — 쇼케이스 금지(IntroRuleLab 교훈). 데이터는 전부 목.
 *
 *  통합안(기본) — 운영자 확정 "C 기반에 하위 포함": 홈 = 파이프라인 칸반 + 오늘 할 일(C) /
 *                 고객 = 기수별 그룹 테이블, 행 → 우측 패널로 빠르게(B) / 카드·'전체 보기' → 3열 레코드 페이지(A)
 *  A · 레코드 3열   — HubSpot 문법 단독 (비교용)
 *  B · 테이블+패널  — Attio 문법 단독 (비교용)
 *  C · 파이프라인   — 칸반 단독 (비교용)
 *
 * ⚠ useSearchParams 는 Suspense 안에서만 — 없으면 프리렌더에서 빌드가 깨진다 (2026-09-02 Vercel ERROR 실측).
 */

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import styles from "./crm.module.css"
import { PEOPLE, type Person } from "./mock"
import { Shell, Home, PeopleTable, Record3, Kanban, Placeholder, RecordHead, Attributes, Timeline, Associations, type Section } from "./parts"

type V = "final" | "a" | "b" | "c"
const VARIANTS: { key: V; label: string; blurb: string }[] = [
  { key: "final", label: "통합안 (C 기반 + A 상세 + B 표)", blurb: "홈=파이프라인 · 고객=표+패널 · 상세=3열 페이지" },
  { key: "a", label: "A · 레코드 3열", blurb: "HubSpot — 고객 상세가 페이지" },
  { key: "b", label: "B · 테이블+패널", blurb: "Attio — 목록을 떠나지 않고 우측 패널" },
  { key: "c", label: "C · 파이프라인", blurb: "칸반이 홈" },
]

export default function AdminCrmPreview() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  )
}

function Inner() {
  const sp = useSearchParams()
  const router = useRouter()
  const v = ((sp.get("v") as V) || "final") as V
  const setV = (x: V) => router.replace(`?v=${x}`)
  return (
    <div className={styles.root}>
      <div className={styles.switch}>
        <span className={styles.switchCap}>시안</span>
        {VARIANTS.map((x) => (
          <button key={x.key} className={`${styles.switchBtn} ${v === x.key ? styles.switchOn : ""}`} onClick={() => setV(x.key)} title={x.blurb}>{x.label}</button>
        ))}
        <span className={styles.switchCap}>· 목 데이터 · 팔레트는 §9 레이지클럽 베이스 유지</span>
      </div>
      {v === "final" && <Final />}
      {v === "a" && <VariantA />}
      {v === "b" && <VariantB />}
      {v === "c" && <VariantC />}
    </div>
  )
}

/* ── 통합안 — C 기반, A 상세, B 표 ───────────────────────────── */
function Final() {
  const [section, setSection] = useState<Section>("home")
  const [cohort, setCohort] = useState<"3기" | "4기">("4기")
  const [peek, setPeek] = useState<Person | null>(null) // B 패널 — 빠르게 보기
  const [page, setPage] = useState<Person | null>(null) // A 3열 — 깊게 보기
  const go = (s: Section) => { setSection(s); setPeek(null); setPage(null) }
  const openPage = (p: Person) => { setPeek(null); setPage(p) }
  return (
    <Shell section={section} onSection={go} variant="통합" navOverride={["home", "people", "applications", "orders", "schedule", "tools"]}>
      {page ? (
        <>
          <div className={styles.head}><button className={styles.muted} onClick={() => setPage(null)}>← {section === "home" ? "파이프라인" : "고객"}</button></div>
          <Record3 p={page} />
        </>
      ) : section === "home" ? (
        <>
          <div className={styles.head}>
            <h1 className={styles.h1}>파이프라인</h1>
            <div className={styles.seg}>
              {(["4기", "3기"] as const).map((c) => <button key={c} className={cohort === c ? styles.segOn : ""} onClick={() => setCohort(c)}>{c}</button>)}
            </div>
            <div className={styles.headActions}><button>표 보기</button><button>필터</button></div>
          </div>
          <Kanban cohort={cohort} onOpen={openPage} />
          <p className={styles.origin}>단계의 정본은 구글 시트 — 카드 이동은 P5(시트 기입 중단) 뒤에 켠다.</p>
          <Home onOpen={setPeek} />
        </>
      ) : section === "people" ? (
        <>
          <div className={styles.head}><h1 className={styles.h1}>고객</h1><span className={styles.muted}>{PEOPLE.length}명 · 전화번호로 묶은 접수·주문·회원 · 행 → 오른쪽 패널</span></div>
          <PeopleTable onOpen={setPeek} selected={peek?.id} group />
        </>
      ) : section === "applications" ? (
        <Placeholder title="접수" note="지금의 접수 원장(분류·메모·파기)이 이 자리에 같은 표 문법으로. 이름 → 고객 패널." />
      ) : section === "orders" ? (
        <Placeholder title="주문" note="orders 원장 — 주문번호·금액·상태·신청서 제출 여부. 이름 → 고객 패널." />
      ) : section === "schedule" ? (
        <Placeholder title="일정" note="인터뷰 캘린더 — 예약·차단을 한 달력에서 (지금의 차단 달력 흡수)." />
      ) : (
        <Placeholder title="도구" note="상태 점검 · 흐름 테스트 · 계정(허용 이메일) — 종전 화면 그대로 링크." />
      )}
      {peek && !page && (
        <>
          <div className={styles.dim} onClick={() => setPeek(null)} />
          <aside className={styles.panel}>
            <div className={styles.panelBar}><button onClick={() => openPage(peek)}>전체 보기 →</button><button onClick={() => setPeek(null)}>닫기 ✕</button></div>
            <RecordHead p={peek} />
            <Attributes p={peek} />
            <p className={styles.blockTitle}>연관</p>
            <Associations p={peek} />
            <p className={styles.blockTitle}>활동</p>
            <Timeline p={peek} />
          </aside>
        </>
      )}
    </Shell>
  )
}

/* ── A · 레코드 3열 ────────────────────────────────────────── */
function VariantA() {
  const [section, setSection] = useState<Section>("home")
  const [open, setOpen] = useState<Person | null>(null)
  const go = (s: Section) => { setSection(s); setOpen(null) }
  const openP = (p: Person) => { setSection("people"); setOpen(p) }
  return (
    <Shell section={section} onSection={go} variant="A">
      {section === "home" && <Home onOpen={openP} />}
      {section === "people" && !open && (<><div className={styles.head}><h1 className={styles.h1}>고객</h1><span className={styles.muted}>{PEOPLE.length}명 · 전화번호로 묶은 접수·주문·회원</span></div><PeopleTable onOpen={openP} /></>)}
      {section === "people" && open && (<><div className={styles.head}><button className={styles.muted} onClick={() => setOpen(null)}>← 고객</button></div><Record3 p={open} /></>)}
      {section === "pipeline" && (<><div className={styles.head}><h1 className={styles.h1}>파이프라인</h1><span className={styles.muted}>4기</span></div><Kanban cohort="4기" onOpen={openP} /></>)}
      {["applications", "orders", "schedule", "tools"].includes(section) && <Placeholder title={section === "applications" ? "접수" : section === "orders" ? "주문" : section === "schedule" ? "일정" : "도구"} note="통합안 참조." />}
    </Shell>
  )
}

/* ── B · 테이블 + 슬라이드 패널 ────────────────────────────── */
function VariantB() {
  const [section, setSection] = useState<Section>("people")
  const [open, setOpen] = useState<Person | null>(null)
  const openP = (p: Person) => { setSection("people"); setOpen(p) }
  return (
    <Shell section={section} onSection={(s) => { setSection(s); setOpen(null) }} variant="B">
      {section === "home" && <Home onOpen={openP} />}
      {section === "people" && (<><div className={styles.head}><h1 className={styles.h1}>고객</h1><span className={styles.muted}>기수별 그룹 · 행을 누르면 오른쪽에서 열린다</span></div><PeopleTable onOpen={openP} selected={open?.id} group /></>)}
      {section === "pipeline" && (<><div className={styles.head}><h1 className={styles.h1}>파이프라인</h1></div><Kanban cohort="4기" onOpen={openP} /></>)}
      {["applications", "orders", "schedule", "tools"].includes(section) && <Placeholder title={section === "applications" ? "접수" : section === "orders" ? "주문" : section === "schedule" ? "일정" : "도구"} note="통합안 참조." />}
      {open && (
        <>
          <div className={styles.dim} onClick={() => setOpen(null)} />
          <aside className={styles.panel}>
            <div className={styles.panelBar}><span className={styles.muted}>고객 레코드</span><button onClick={() => setOpen(null)}>닫기 ✕</button></div>
            <RecordHead p={open} /><Attributes p={open} />
            <p className={styles.blockTitle}>연관</p><Associations p={open} />
            <p className={styles.blockTitle}>활동</p><Timeline p={open} />
          </aside>
        </>
      )}
    </Shell>
  )
}

/* ── C · 파이프라인 우선 ───────────────────────────────────── */
function VariantC() {
  const [section, setSection] = useState<Section>("home")
  const [cohort, setCohort] = useState<"3기" | "4기">("4기")
  const [open, setOpen] = useState<Person | null>(null)
  return (
    <Shell section={section} onSection={(s) => { setSection(s); setOpen(null) }} variant="C">
      {section === "home" && (
        <>
          <div className={styles.head}>
            <h1 className={styles.h1}>파이프라인</h1>
            <div className={styles.seg}>{(["4기", "3기"] as const).map((c) => <button key={c} className={cohort === c ? styles.segOn : ""} onClick={() => setCohort(c)}>{c}</button>)}</div>
          </div>
          <Kanban cohort={cohort} onOpen={setOpen} />
          <Home onOpen={setOpen} />
        </>
      )}
      {section === "people" && (<><div className={styles.head}><h1 className={styles.h1}>고객</h1></div><PeopleTable onOpen={setOpen} /></>)}
      {section === "pipeline" && (<><div className={styles.head}><h1 className={styles.h1}>파이프라인</h1></div><Kanban cohort={cohort} onOpen={setOpen} /></>)}
      {["applications", "orders", "schedule", "tools"].includes(section) && <Placeholder title={section === "applications" ? "접수" : section === "orders" ? "주문" : section === "schedule" ? "일정" : "도구"} note="통합안 참조." />}
      {open && (
        <>
          <div className={styles.dim} onClick={() => setOpen(null)} />
          <div className={styles.modal}>
            <div className={styles.panelBar}><span className={styles.muted}>고객 레코드</span><button onClick={() => setOpen(null)}>닫기 ✕</button></div>
            <Record3 p={open} />
          </div>
        </>
      )}
    </Shell>
  )
}
