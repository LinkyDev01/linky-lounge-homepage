"use client"

import { useEffect, useState } from "react"
import styles from "./intro-rule-designs.module.css"

/**
 * 자기소개 규칙 섹션 — 디자인 시안 쇼케이스 (2026-08-24).
 *
 * 운영자: 자기소개 규칙(익명·거짓말 허용)을 랜딩 '진행 순서' 앞에 두어
 * "하나의 주요 세일즈포인트와 아이덴티티"로. 합의된 조건:
 *  · 노출 항목은 나이·직업·학력 3개만 (MBTI·연봉 등 실제 규칙 항목은 비노출)
 *  · 랜딩 본문은 원문 축약본 ("본 모임이 아니므로 100% 동일하게 가기보다 적절히 줄이는 게")
 *  · 모달 원문 이미지는 흰 바탕 캡처본 기준 — 운영자가 제작 예정, 지금 것은 임시본
 *  · 채택 시 진행 순서가 01~04 로: 1단계에서 '자기소개'를 분리해 01 로 (아래 배치 목업)
 *
 * ⚠ 카피는 전부 운영자 원문(온라인 공개용)에서 발췌·축약 — 창작 문장 없음.
 *   축약 지점은 운영자 검토 대상. 실사이트 미반영 — 프리뷰 전용 제안.
 */

const RULES = [
  { n: "01", text: <>공개하고 싶은 개인정보는 마음대로 공개해도 좋습니다.</>, star: false },
  { n: "02", text: <>공개하고 싶지 않은 개인정보는 철저히 비밀로 부치셔도 됩니다.</>, star: false },
  {
    n: "03",
    text: (
      <>
        원하신다면 나이, 직업, 학력 등을 완전히 <strong>거짓말</strong>로 꾸며내어
        말씀하셔도 좋습니다.
      </>
    ),
    star: true,
  },
]

/** 원문 발췌 — "우리는 비로소 상대방의 명함이 아니라 그 사람이 던지는 문장과
 *  사유에만 온전히 집중할 수 있게 됩니다" 의 축약 */
const LEAD = (
  <>
    상대방의 명함이 아니라, 그 사람이 던지는 <strong>문장과 사유</strong>에만 온전히
    집중할 수 있도록.
  </>
)

const VARIANTS = [
  {
    id: "card",
    name: "A. 규칙 카드",
    ref: "레퍼런스: 히어로 요약 카드(종이 낱장+테이프) + 후기 모달 — 자기 문법 재조합",
    desc: "테이프로 붙인 종이 카드에 규칙 3줄. 세 번째 규칙(거짓말)만 주황으로 세워 파격이 한눈에 읽히게 합니다. 하단 '원문 보기'가 모달로 전문 이미지를 띄웁니다.",
  },
  {
    id: "strike",
    name: "B. 명함 지우기",
    ref: "레퍼런스: 콰이어트 조판 + 브랜드 취소선 문법(인물 약력의 s 태그)",
    desc: "나이·직업·학력을 취소선으로 지워나간 뒤 발췌문 한 줄로 받는 가장 조용한 안. 이미지·모달 없이 활자만으로 성립하고, 모임소개 챕터들과 결이 같습니다.",
  },
  {
    id: "hybrid",
    name: "C. 합성 (추천)",
    ref: "레퍼런스: A의 오브제 + B의 취소선 헤드라인",
    desc: "종이 카드 안에서 취소선 헤드라인이 먼저 시선을 잡고, 규칙 3줄과 원문 모달이 뒤를 받칩니다. 눈에 띄는 세일즈포인트(카드)와 파격의 전달(취소선)을 함께 가져가는 안입니다.",
  },
] as const

type VariantId = (typeof VARIANTS)[number]["id"]

const DOC_IMG = "/linky-lounge/book-club/intro-rules/rules-doc-draft.webp"

// ── 공용: 원문 모달 (후기 모달 축소판 — 배경 클릭·Esc·× 로 닫기) ──────────
function DocModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])
  return (
    <div className={styles.modal} onClick={onClose} role="dialog" aria-modal="true" aria-label="자기소개 규칙 원문">
      <button type="button" className={styles.modalClose} aria-label="닫기">×</button>
      <div className={styles.modalScroll}>
        <div className={styles.modalFrame} onClick={(e) => e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DOC_IMG} alt="자기소개 규칙 전문" />
          <p className={styles.modalNote}>* 임시 이미지 — 운영자 제작본으로 교체 예정</p>
        </div>
      </div>
    </div>
  )
}

/** 원문 발췌 킥커 — "이곳을 하나의 익명의 공간으로 만들어보면 어떨까요?" */
function Kicker() {
  return <p className={styles.kicker}>이곳을 하나의 익명의 공간으로 만들어보면 어떨까요?</p>
}

function RuleLines() {
  return (
    <ol className={styles.ruleList}>
      {RULES.map((r) => (
        <li key={r.n} className={r.star ? styles.ruleStar : styles.rule}>
          <span className={styles.ruleNum}>{r.n}</span>
          <span className={styles.ruleText}>{r.text}</span>
        </li>
      ))}
    </ol>
  )
}

function DocLink({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className={styles.docLink} onClick={onOpen}>
      규칙 원문 보기
    </button>
  )
}

// ── A. 규칙 카드 ────────────────────────────────────────────
function CardVariant() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Kicker />
      <div className={styles.paperCard}>
        <span className={styles.tape} aria-hidden />
        <p className={styles.cardLead}>{LEAD}</p>
        <RuleLines />
        <DocLink onOpen={() => setOpen(true)} />
      </div>
      {open && <DocModal onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── B. 명함 지우기 ──────────────────────────────────────────
function StrikeVariant() {
  return (
    <div className={styles.quietWrap}>
      <p className={styles.strikeLine}>
        <s>나이</s> · <s>직업</s> · <s>학력</s>
      </p>
      <p className={styles.quietLead}>{LEAD}</p>
      <ol className={styles.quietRules}>
        {RULES.map((r) => (
          <li key={r.n} className={r.star ? styles.quietRuleStar : undefined}>
            {r.text}
          </li>
        ))}
      </ol>
      <p className={styles.quietFoot}>평소에는 경험하기 어려운 신선한 해방감을, 이곳에서.</p>
    </div>
  )
}

// ── C. 합성 (추천) ──────────────────────────────────────────
function HybridVariant() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Kicker />
      <div className={styles.paperCard}>
        <span className={styles.tape} aria-hidden />
        <p className={styles.strikeLineInCard}>
          <s>나이</s> · <s>직업</s> · <s>학력</s>
        </p>
        <p className={styles.cardLead}>{LEAD}</p>
        <RuleLines />
        <DocLink onOpen={() => setOpen(true)} />
      </div>
      {open && <DocModal onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── 배치 목업: 채택 시 바로 아래에 오는 진행 순서 01~04 (자기소개 분리) ──
function PlacementMock() {
  const steps = [
    { n: "01", label: "자기소개", desc: "위 규칙의 방식대로, 원하는 모습으로 자신을 소개합니다.", isNew: true },
    { n: "02", label: "오프닝, 질문 1~3", desc: "레이지데이가 제시하는 주제를 바탕으로 대화를 시작합니다.", isNew: false },
    { n: "03", label: "서로의 페이지", desc: "각자 가져온 문장이나 질문을 중심으로 대화를 이어갑니다.", isNew: false },
    { n: "04", label: "마무리", desc: "사유를 넓혀준 이야기를 나누며 마무리합니다.", isNew: false },
  ]
  return (
    <div className={styles.mock}>
      <p className={styles.mockCaption}>
        ↓ 채택 시 배치 — 규칙 블록 바로 아래 진행 순서가 01~04 로 (자기소개를 01 로 분리).
        01 문안은 초안이며 확정 필요.
      </p>
      <div className={styles.mockSteps}>
        <p className={styles.mockTitle}>진행 순서</p>
        {steps.map((s) => (
          <div key={s.n} className={`${styles.mockStep} ${s.isNew ? styles.mockStepNew : ""}`}>
            <span className={styles.mockNum}>{s.n}</span>
            <span>
              <span className={styles.mockLabel}>{s.label}</span>
              <span className={styles.mockDesc}>{s.desc}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function IntroRuleDesignsPage() {
  const [variant, setVariant] = useState<VariantId>("hybrid")
  const meta = VARIANTS.find((v) => v.id === variant)!

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <h1 className={styles.pageTitle}>자기소개 규칙 — 섹션 시안</h1>
        <p className={styles.pageSub}>
          랜딩 모임소개 밴드(배경 A)의 챕터들과 진행 순서 사이에 들어갈 블록입니다. 위
          버튼으로 시안을 전환하고, &lsquo;규칙 원문 보기&rsquo;를 눌러 모달까지
          확인해 보세요.
        </p>

        <div className={styles.switcher}>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              className={`${styles.switchBtn} ${variant === v.id ? styles.switchBtnActive : ""}`}
              onClick={() => setVariant(v.id)}
            >
              {v.name}
            </button>
          ))}
        </div>

        <div className={styles.variantMeta}>
          <p className={styles.variantName}>{meta.name}</p>
          <p className={styles.variantRef}>{meta.ref}</p>
          <p className={styles.variantDesc}>{meta.desc}</p>
        </div>

        {/* 섹션 제목 — 원문 발췌 "조금 특별한 자기소개 규칙" (랜딩 섹션 제목 문법) */}
        <div className={styles.demoBand}>
          <div className={styles.titleRow}>
            <h2 className={styles.sectionTitle}>조금 특별한 자기소개 규칙</h2>
          </div>

          {variant === "card" && <CardVariant />}
          {variant === "strike" && <StrikeVariant />}
          {variant === "hybrid" && <HybridVariant />}

          <PlacementMock />
        </div>
      </div>
    </div>
  )
}
