"use client"

import { useState } from "react"
import { SEASON } from "../../season-config"
import styles from "./apply-info-designs.module.css"

/**
 * apply 일정·장소·가격 카드 — '동일 위계' 표현 시안 쇼케이스 (2026-08-20).
 * 운영자: 평행 제목 3개 반복안은 "가시성이나 디자인 측면에서 저해되는데
 * 동일 위계 표현하면서 디자인 최적화하도록 샘플 몇 가지 줘".
 * 같은 콘텐츠(4기 일정 표 · 진행 장소 · 멤버십 가격 · 주석 2문장)를
 * 4가지 패턴으로 비교한다. 실사이트 미반영 — 프리뷰 전용 제안.
 * (선례·템플릿: preview/faq-designs)
 */

const VARIANTS = [
  {
    id: "cards",
    name: "A. 섹션 카드 3장",
    ref: "레퍼런스: 토스 결제 상세 · Airbnb 예약 요약",
    desc: "블록마다 독립된 흰 카드. 경계가 컨테이너 자체라 위계 동일성이 구조적으로 명백하고, 장소·가격 카드는 납작해 스크롤 부담이 적습니다.",
  },
  {
    id: "rule",
    name: "B. 브랜드 괘선 헤더",
    ref: "레퍼런스: 랜딩 섹션 제목 문법 (주황 괘선)",
    desc: "랜딩 전체가 쓰는 '제목 + 짧은 주황 괘선' 문법을 카드 안으로 가져온 안. 사이트가 이미 학습시킨 시각 언어라 셋이 같은 급임이 즉시 읽히고, 톤이 가장 조용합니다.",
  },
  {
    id: "tiles",
    name: "C. 일정 + 정보 타일 2열",
    ref: "레퍼런스: 클래스101 · Airbnb 상세 요약 타일",
    desc: "일정 표는 전폭, 장소·가격은 동일한 타일 2개를 나란히. 세로 길이가 가장 짧고 장소·가격이 한눈에 잡혀 가시성이 최댓값입니다. 동일 타일 = 동일 위계.",
  },
  {
    id: "sheet",
    name: "D. 스펙 시트",
    ref: "레퍼런스: 매거진 콜로폰 · 히어로 요약 카드 문법",
    desc: "일정·진행 장소·멤버십 가격을 같은 라벨 열에 세우고 일정 표를 그 값 안에 내장. 랜딩 히어로의 종이 낱장 카드(기간/일정/장소)와 같은 문법이라 사이트 전체 일관성이 가장 높습니다.",
  },
  // ── 2차 요청 (운영자 "레이지클럽처럼 직선과 직사각형, 그리고 간결함 기반의
  //    단정한 디자인을 더") — 잉크 1px 직선·radius 0·평면 종이·모노톤 문법 ──
  {
    id: "frame",
    name: "F. 잉크 프레임 3분할",
    ref: "레퍼런스: 레이지클럽 옵션 박스 · 전시 캡션",
    desc: "잉크 1px 직사각 프레임 하나를 수평선으로 3등분한 인쇄 서식형. 번호(01–03)가 세 칸이 같은 급임을 명시하고, 외곽선이 정보를 한 덩어리로 묶습니다.",
  },
  {
    id: "grid",
    name: "G. 라벨 컬럼 그리드",
    ref: "레퍼런스: 레이지클럽 15컬럼 괘선 · 스위스 그리드",
    desc: "세로 잉크선으로 라벨 열과 값 열을 가르는 2열 그리드. 수직·수평선이 만나 직사각 칸이 되는 가장 건축적인 안 — 라벨 열이 같으니 세 행이 같은 급입니다.",
  },
  // ── 3차 — E 채택 후 "구분할 수 있도록 흰색 또는 유색이 섹션에 있어야 할까?"
  //    질문에 대한 답을 눈으로 비교하도록 배경 유/무 두 변형을 나란히 ──
  {
    id: "ruledFlat",
    name: "E1. 룰드 시트 (배경 없음, 채택)",
    ref: "레퍼런스: 레이지클럽 섹션 괘선 · 인쇄물 서식",
    desc: "블록 배경 없이 종이 위에 잉크선만. 실사이트에서는 이 전체가 이미 흰 카드(.scheduleNotice) 안에 있으므로, 카드 자체가 페이지와의 경계를 만들고 안에서는 선이 블록을 나눕니다 — 인쇄물이 여백 없이 괘선만으로 항목을 나누는 방식과 같습니다.",
  },
  {
    id: "ruledTint",
    name: "E2. 룰드 시트 (카드색 배경)",
    ref: "카드 배경 토큰 #fffdf8 적용",
    desc: "블록마다 §3 카드 배경 토큰(#fffdf8)을 깔고 잉크선은 유지. 다만 페이지 배경(#f7f3ee)과 명도차가 3% 남짓이라 실제로는 거의 안 보입니다 — 스크린샷으로 직접 대조해 보세요.",
  },
  {
    id: "ruledOat",
    name: "E3. 룰드 시트 (오트 배경)",
    ref: "§3 섹션 배경 B(#f0e9e0) 적용",
    desc: "블록마다 사이트가 이미 섹션 교차에 쓰는 오트 톤(B)을 깔아 실제로 눈에 띄는 대비를 만든 안. 구분은 확실해지지만 종이 위에 잉크선만 남기는 E1의 '결'과는 멀어집니다 — 카드 밖(랜딩 배경) 색과 겹쳐 보일 여지도 있습니다.",
  },
] as const

type VariantId = (typeof VARIANTS)[number]["id"]

// ── 공용 조각: 회차 표 (시안마다 동일 데이터, 셀 서식만 컨텍스트 상속) ──
// ink: 레이지클럽 모노톤 — 주황 악센트(헤더 밑줄·회차 라벨)를 잉크로 (E·F·G용)
function MiniTable({ ink = false }: { ink?: boolean }) {
  return (
    <div className={ink ? styles.tblInk : undefined}>
      <MiniTableInner />
    </div>
  )
}
function MiniTableInner() {
  return (
    <table className={styles.tbl}>
      <thead>
        <tr>
          <th className={styles.tblEmpty} />
          {SEASON.days.map((d) => (
            <th key={d.label} className={styles.tblDay}>
              {d.label}
              {d.time.split(", ").map((t) => (
                <span key={t} className={styles.tblTime}>{t}</span>
              ))}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SEASON.sessions.map((s) => (
          <tr key={s.label}>
            <td className={styles.tblLabel}>{s.label}</td>
            {s.dates.map((date, i) => (
              <td key={i} className={styles.tblDate}>{date}</td>
            ))}
          </tr>
        ))}
        <tr>
          <td className={styles.tblLabel}>{SEASON.fifth.label}</td>
          <td colSpan={SEASON.days.length} className={styles.tblFifth}>
            {SEASON.fifth.date} <span className={styles.tblTime}>{SEASON.fifth.timeLabel}</span>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

function Notes() {
  return (
    <>
      <p className={styles.note}>*반 배정이 진행되나, 다른 반으로 변경 참여가 가능합니다.</p>
      <p className={styles.note}>*참여인원 변동에 따라 모임 일정은 통합·추가 개설될 수 있습니다.</p>
    </>
  )
}

// ── A. 섹션 카드 3장 ────────────────────────────────────────
function CardsVariant() {
  return (
    <div className={styles.cardsWrap}>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{SEASON.name} 일정</h3>
        <MiniTable />
        <Notes />
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>진행 장소</h3>
        <p className={styles.cardValue}>
          {SEASON.location.name}
          <span className={styles.valueSub}> ({SEASON.location.sub})</span>
        </p>
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>멤버십 가격</h3>
        <p className={styles.cardValue}>{SEASON.price}</p>
      </div>
    </div>
  )
}

// ── B. 브랜드 괘선 헤더 ─────────────────────────────────────
function RuleVariant() {
  return (
    <div className={styles.oneCard}>
      <div className={styles.ruleBlock}>
        <h3 className={styles.ruleTitle}>{SEASON.name} 일정</h3>
        <MiniTable />
        <Notes />
      </div>
      <div className={styles.ruleBlock}>
        <h3 className={styles.ruleTitle}>진행 장소</h3>
        <p className={styles.ruleValue}>
          {SEASON.location.name}
          <span className={styles.valueSub}> ({SEASON.location.sub})</span>
        </p>
      </div>
      <div className={styles.ruleBlock}>
        <h3 className={styles.ruleTitle}>멤버십 가격</h3>
        <p className={styles.ruleValue}>{SEASON.price}</p>
      </div>
    </div>
  )
}

// ── C. 일정 + 정보 타일 2열 ─────────────────────────────────
function TilesVariant() {
  return (
    <div className={styles.oneCard}>
      <h3 className={styles.tileHeadTitle}>{SEASON.name} 일정</h3>
      <MiniTable />
      <Notes />
      <div className={styles.tileRow}>
        <div className={styles.tile}>
          <span className={styles.tileLabel}>진행 장소</span>
          <span className={styles.tileValue}>{SEASON.location.name}</span>
          <span className={styles.tileSub}>{SEASON.location.sub}</span>
        </div>
        <div className={styles.tile}>
          <span className={styles.tileLabel}>멤버십 가격</span>
          <span className={styles.tileValue}>{SEASON.price}</span>
          <span className={styles.tileSub}>인터뷰 후 결제</span>
        </div>
      </div>
    </div>
  )
}

// ── D. 스펙 시트 ────────────────────────────────────────────
function SheetVariant() {
  return (
    <div className={styles.oneCard}>
      <div className={styles.sheetRow}>
        <span className={styles.sheetLabel}>일정</span>
        <div className={styles.sheetValueArea}>
          <MiniTable />
          <Notes />
        </div>
      </div>
      <div className={styles.sheetRow}>
        <span className={styles.sheetLabel}>진행 장소</span>
        <div className={styles.sheetValueArea}>
          <p className={styles.sheetValue}>
            {SEASON.location.name}
            <span className={styles.valueSub}> ({SEASON.location.sub})</span>
          </p>
        </div>
      </div>
      <div className={styles.sheetRow}>
        <span className={styles.sheetLabel}>멤버십 가격</span>
        <div className={styles.sheetValueArea}>
          <p className={styles.sheetValue}>{SEASON.price}</p>
        </div>
      </div>
    </div>
  )
}

// ── E. 룰드 시트 — tint: false 배경 없음(E1, 채택안) / "card" 카드색#fffdf8(E2,
//    페이지 배경과 거의 안 보이는 차이) / "oat" 팔레트 B톤 #f0e9e0(E3, 실제로 보이는 차이) ──
function RuledVariant({ tint = false }: { tint?: false | "card" | "oat" }) {
  const tintClass = tint === "card" ? styles.ruledBlockTint : tint === "oat" ? styles.ruledBlockOat : ""
  const wrap = tint ? `${styles.ruledWrap} ${styles.ruledWrapTint}` : styles.ruledWrap
  const block = tint ? `${styles.ruledBlock} ${tintClass}` : styles.ruledBlock
  return (
    <div className={wrap}>
      <div className={block}>
        <h3 className={styles.ruledLabel}>{SEASON.name} 일정</h3>
        <MiniTable ink />
        <Notes />
      </div>
      <div className={block}>
        <h3 className={styles.ruledLabel}>진행 장소</h3>
        <p className={styles.ruledValue}>
          {SEASON.location.name}
          <span className={styles.valueSubInk}> ({SEASON.location.sub})</span>
        </p>
      </div>
      <div className={block}>
        <h3 className={styles.ruledLabel}>멤버십 가격</h3>
        <p className={styles.ruledValue}>{SEASON.price}</p>
      </div>
    </div>
  )
}

// ── F. 잉크 프레임 3분할 ────────────────────────────────────
function FrameVariant() {
  return (
    <div className={styles.frameWrap}>
      <div className={styles.frameSection}>
        <div className={styles.frameHead}>
          <span>{SEASON.name} 일정</span>
          <span className={styles.frameIndex}>01</span>
        </div>
        <MiniTable ink />
        <Notes />
      </div>
      <div className={styles.frameSection}>
        <div className={styles.frameHead}>
          <span>진행 장소</span>
          <span className={styles.frameIndex}>02</span>
        </div>
        <p className={styles.frameValue}>
          {SEASON.location.name}
          <span className={styles.valueSubInk}> ({SEASON.location.sub})</span>
        </p>
      </div>
      <div className={styles.frameSection}>
        <div className={styles.frameHead}>
          <span>멤버십 가격</span>
          <span className={styles.frameIndex}>03</span>
        </div>
        <p className={styles.frameValue}>{SEASON.price}</p>
      </div>
    </div>
  )
}

// ── G. 라벨 컬럼 그리드 ─────────────────────────────────────
function GridVariant() {
  return (
    <div className={styles.gridWrap}>
      <div className={styles.gridRow}>
        <span className={styles.gridLabelCell}>일정</span>
        <div className={styles.gridValueCell}>
          <MiniTable ink />
          <Notes />
        </div>
      </div>
      <div className={styles.gridRow}>
        <span className={styles.gridLabelCell}>진행 장소</span>
        <div className={styles.gridValueCell}>
          <p className={styles.gridValue}>
            {SEASON.location.name}
            <span className={styles.valueSubInk}> ({SEASON.location.sub})</span>
          </p>
        </div>
      </div>
      <div className={styles.gridRow}>
        <span className={styles.gridLabelCell}>멤버십 가격</span>
        <div className={styles.gridValueCell}>
          <p className={styles.gridValue}>{SEASON.price}</p>
        </div>
      </div>
    </div>
  )
}

export default function ApplyInfoDesignsPage() {
  const [variant, setVariant] = useState<VariantId>("ruledFlat")
  const cur = VARIANTS.find((v) => v.id === variant)!

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>신청 페이지 일정·장소·가격 시안</h1>
        <p className={styles.sub}>
          같은 콘텐츠를 여러 패턴으로 — 세 정보가 <strong>같은 급</strong>으로 읽히면서
          가시성을 잃지 않는 구성을 비교합니다. E–G는 레이지클럽 문법(직선·직사각·모노톤),
          E1–E3는 채택한 E의 배경 유무·색 비교.
        </p>
      </header>

      <div className={styles.picker} role="tablist" aria-label="시안 선택">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={v.id === variant}
            className={`${styles.pick} ${v.id === variant ? styles.pickOn : ""}`}
            onClick={() => setVariant(v.id)}
          >
            {v.name}
          </button>
        ))}
      </div>

      <p className={styles.refLine}>{cur.ref}</p>
      <p className={styles.descLine}>{cur.desc}</p>

      <div key={variant} className={styles.stage}>
        {variant === "cards" && <CardsVariant />}
        {variant === "rule" && <RuleVariant />}
        {variant === "tiles" && <TilesVariant />}
        {variant === "sheet" && <SheetVariant />}
        {variant === "ruledFlat" && <RuledVariant />}
        {variant === "ruledTint" && <RuledVariant tint="card" />}
        {variant === "ruledOat" && <RuledVariant tint="oat" />}
        {variant === "frame" && <FrameVariant />}
        {variant === "grid" && <GridVariant />}
      </div>
    </main>
  )
}
