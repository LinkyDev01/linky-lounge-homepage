"use client"

/**
 * 고객관리 대시보드 시안 3종 — CRM형(HubSpot · Attio) 정보 구조 × 레이지클럽 베이스(§9).
 * 운영자 지시(2026-09-02): "고객관리에 최적화된 대시보드 · 레퍼런스 기반". 근거: docs/admin-crm/01-references.md.
 * 실배치(내비·홈·목록·상세·파이프라인 전부)로 보여준다 — 쇼케이스 금지(IntroRuleLab 교훈). 데이터는 전부 목.
 *
 *  A · 레코드 3열   — HubSpot 문법. 목록 → 고객 상세가 페이지로 열리고 좌 속성 / 중 타임라인 / 우 연관.
 *  B · 테이블+패널 — Attio 문법. 스프레드시트형 목록(기수별 그룹)이 주인공, 행을 누르면 우측 패널이 미끄러져 나온다.
 *  C · 파이프라인   — 홈이 곧 4기 칸반. 카드를 누르면 3열 상세가 오버레이로.
 */

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import styles from "./crm.module.css"
import { PEOPLE, type Person } from "./mock"
import { Shell, Home, PeopleTable, Record3, Kanban, Placeholder, RecordHead, Attributes, Timeline, Associations, type Section } from "./parts"

type V = "a" | "b" | "c"
const VARIANTS: { key: V; label: string; blurb: string }[] = [
  { key: "a", label: "A · 레코드 3열 (HubSpot)", blurb: "고객 상세가 페이지 — 좌 속성 · 중 타임라인 · 우 연관" },
  { key: "b", label: "B · 테이블 + 슬라이드 패널 (Attio)", blurb: "목록을 떠나지 않고 우측 패널로 상세" },
  { key: "c", label: "C · 파이프라인 우선 (칸반)", blurb: "홈이 곧 4기 파이프라인 — 카드 → 상세 오버레이" },
]

export default function AdminCrmPreview() {
  const sp = useSearchParams()
  const router = useRouter()
  const v = ((sp.get("v") as V) || "a") as V
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
      {v === "a" && <VariantA />}
      {v === "b" && <VariantB />}
      {v === "c" && <VariantC />}
    </div>
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
      {section === "people" && open && (
        <>
          <div className={styles.head}><button className={styles.muted} onClick={() => setOpen(null)}>← 고객</button></div>
          <Record3 p={open} />
        </>
      )}
      {section === "pipeline" && (<><div className={styles.head}><h1 className={styles.h1}>파이프라인</h1><span className={styles.muted}>4기</span></div><Kanban cohort="4기" onOpen={openP} /><p className={styles.origin}>정본은 시트 — 드래그 이동은 P5 뒤.</p></>)}
      {section === "applications" && <Placeholder title="접수" note="지금의 접수 원장 화면이 이 자리에 들어온다 (분류·메모·파기 그대로). 각 행의 이름을 누르면 고객 레코드로." />}
      {section === "orders" && <Placeholder title="주문" note="orders 원장 목록 — 주문번호·금액·상태·신청서 제출 여부. 이름 → 고객 레코드." />}
      {section === "schedule" && <Placeholder title="일정" note="인터뷰 캘린더(차단 포함) — 지금의 차단 달력이 여기로." />}
      {section === "tools" && <Placeholder title="도구" note="상태 점검 · 흐름 테스트 · 차단 달력 — 종전 화면 그대로 링크." />}
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
      {section === "pipeline" && (<><div className={styles.head}><h1 className={styles.h1}>파이프라인</h1><span className={styles.muted}>4기 · 표 보기 ↔ 칸반</span></div><Kanban cohort="4기" onOpen={openP} /></>)}
      {section === "applications" && <Placeholder title="접수" note="접수 원장 테이블 — 같은 테이블 문법, 행 → 우측 패널." />}
      {section === "orders" && <Placeholder title="주문" note="주문 테이블 — 행 → 우측 패널." />}
      {section === "schedule" && <Placeholder title="일정" note="인터뷰 캘린더." />}
      {section === "tools" && <Placeholder title="도구" note="상태 점검 · 흐름 테스트 · 차단 달력." />}
      {open && (
        <>
          <div className={styles.dim} onClick={() => setOpen(null)} />
          <aside className={styles.panel}>
            <div className={styles.panelBar}><span className={styles.muted}>고객 레코드</span><button onClick={() => setOpen(null)}>닫기 ✕</button></div>
            <RecordHead p={open} />
            <Attributes p={open} />
            <p className={styles.blockTitle}>연관</p>
            <Associations p={open} />
            <p className={styles.blockTitle}>활동</p>
            <Timeline p={open} />
            <p className={styles.origin}>진행 상태의 정본은 구글 시트 — 단계는 읽기만.</p>
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
  const openP = (p: Person) => setOpen(p)
  return (
    <Shell section={section} onSection={(s) => { setSection(s); setOpen(null) }} variant="C">
      {section === "home" && (
        <>
          <div className={styles.head}>
            <h1 className={styles.h1}>파이프라인</h1>
            <div className={styles.seg}>
              {(["4기", "3기"] as const).map((c) => <button key={c} className={cohort === c ? styles.segOn : ""} onClick={() => setCohort(c)}>{c}</button>)}
            </div>
            <div className={styles.headActions}><button>표 보기</button><button>필터</button></div>
          </div>
          <Kanban cohort={cohort} onOpen={openP} />
          <Home onOpen={openP} />
        </>
      )}
      {section === "people" && (<><div className={styles.head}><h1 className={styles.h1}>고객</h1></div><PeopleTable onOpen={openP} /></>)}
      {section === "pipeline" && (<><div className={styles.head}><h1 className={styles.h1}>파이프라인</h1></div><Kanban cohort={cohort} onOpen={openP} /></>)}
      {section === "applications" && <Placeholder title="접수" note="접수 원장 — 종전 화면." />}
      {section === "orders" && <Placeholder title="주문" note="주문 목록." />}
      {section === "schedule" && <Placeholder title="일정" note="인터뷰 캘린더." />}
      {section === "tools" && <Placeholder title="도구" note="상태 점검 · 흐름 테스트 · 차단 달력." />}
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
