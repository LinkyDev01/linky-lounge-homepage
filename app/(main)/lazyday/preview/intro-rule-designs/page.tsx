"use client"

import { useEffect, useState } from "react"
import styles from "./intro-rule-designs.module.css"

/**
 * 자기소개 규칙 섹션 — 디자인 시안 쇼케이스 (2026-08-24, 노출 구조 개정).
 *
 * 운영자: 자기소개 규칙(익명·거짓말 허용)을 랜딩 '진행 순서' 앞에 두어
 * "하나의 주요 세일즈포인트와 아이덴티티"로. 합의된 조건:
 *  · 노출 항목은 나이·직업·학력 3개만 (MBTI·연봉 등 실제 규칙 항목은 비노출)
 *  · 모달 원문 이미지 = 구글 드라이브 "자기소개 규칙.png"(2026-08-24, 최신본) 그대로 사용
 *  · 채택 시 진행 순서가 01~04 로: 1단계에서 '자기소개'를 분리해 01 로 (아래 배치 목업)
 *
 * 이번 라운드 질문(운영자): "조금 특별한 자기소개 규칙"처럼 티저 제목을 쓸 거면
 * 내용을 클릭해야 보이게 게이팅해야 앞뒤가 맞고, 반대로 내용을 스크롤에서 바로
 * 노출한다면 제목은 "자기소개 규칙" 정도로 담백해도 충분하다 — 이 구조를 다양하게.
 * 아래 세 안은 스타일(카드/취소선)이 아니라 "제목↔노출량"의 조합 자체를 달리한다.
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
    id: "expose",
    name: "1. 완전 노출 (추천)",
    title: "자기소개 규칙",
    ref: "레퍼런스: 모임소개 챕터의 콰이어트 노출 문법 — 게이팅 없이 전부 스크롤에 붙임",
    desc: "규칙 3줄을 스크롤 도달과 동시에 전부 보여줍니다. 제목은 담백하게 '자기소개 규칙' — 파격은 제목이 아니라 세 번째 규칙(거짓말 허용) 자체가 만듭니다. '원문 보기'는 호기심 게이트가 아니라 '진짜 있는 규칙'이라는 증빙으로 격하됩니다. 스크롤 흐름이 끊기지 않고, 안 눌러봐서 못 보는 사람이 없습니다.",
  },
  {
    id: "gate",
    name: "2. 완전 게이팅",
    title: "조금 특별한 자기소개 규칙",
    ref: "레퍼런스: FAQ 미니멀 라인 접힘 문법(§3) — 제목의 약속을 클릭으로 지킴",
    desc: "티저 제목을 쓴 만큼 내용을 숨깁니다. 카드에는 헤드라인 한 줄과 '규칙 보기' 버튼만 있고, 눌러야 3줄이 펼쳐집니다. 제목-행동이 앞뒤가 맞고 클릭률로 반응을 잴 수 있지만, 안 눌러보고 스크롤을 내리는 사람에게는 이 섹션이 통째로 비어 보입니다.",
  },
  {
    id: "partial",
    name: "3. 펀치라인만 게이팅",
    title: "자기소개 규칙",
    ref: "레퍼런스: B(명함 지우기) 취소선 문법 + FAQ 접힘 — 두 안의 절충",
    desc: "제목은 담백하되, 안전한 규칙 1·2(공개/비밀 자유)는 바로 보여주고 진짜 파격인 규칙 3(거짓말 허용)만 취소선으로 가려 클릭해야 드러나게 합니다. 완전 노출의 '밋밋함'과 완전 게이팅의 '이탈'을 동시에 줄이는 절충안 — 스크롤만으로도 규칙 3개가 있다는 건 인지되고, 가장 세일즈포인트가 되는 한 줄에만 손이 가게 만듭니다.",
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
          <p className={styles.modalNote}>구글 드라이브 최신본(2026-08-24) 그대로</p>
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

// ── 1. 완전 노출 (추천) — 게이팅 없이 스크롤 즉시 전부 노출 ──────────
function ExposeVariant() {
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

// ── 2. 완전 게이팅 — 제목의 약속(티저)을 클릭으로 지킴 ──────────────
function GateVariant() {
  const [revealed, setRevealed] = useState(false)
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className={styles.paperCard}>
        <span className={styles.tape} aria-hidden />
        <p className={styles.cardLead}>{LEAD}</p>
        {!revealed ? (
          <button type="button" className={styles.gateBtn} onClick={() => setRevealed(true)}>
            규칙 보기
          </button>
        ) : (
          <div className={styles.gateReveal}>
            <RuleLines />
            <DocLink onOpen={() => setOpen(true)} />
          </div>
        )}
      </div>
      {open && <DocModal onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── 3. 펀치라인만 게이팅 — 규칙 1·2는 노출, 규칙 3(거짓말)만 클릭 ──
function PartialVariant() {
  const [revealed, setRevealed] = useState(false)
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Kicker />
      <div className={styles.paperCard}>
        <span className={styles.tape} aria-hidden />
        <p className={styles.cardLead}>{LEAD}</p>
        <ol className={styles.ruleList}>
          {RULES.filter((r) => !r.star).map((r) => (
            <li key={r.n} className={styles.rule}>
              <span className={styles.ruleNum}>{r.n}</span>
              <span className={styles.ruleText}>{r.text}</span>
            </li>
          ))}
          <li className={styles.ruleStar}>
            <span className={styles.ruleNum}>03</span>
            {!revealed ? (
              <button type="button" className={styles.punchlineBtn} onClick={() => setRevealed(true)}>
                <s>나이</s>, <s>직업</s>, <s>학력</s>은 전부 &lsquo;{" "}
                <strong>거짓말</strong>{" "}
                &rsquo;해도 됩니다 — 클릭
              </button>
            ) : (
              <span className={styles.ruleText}>{RULES[2].text}</span>
            )}
          </li>
        </ol>
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
  const [variant, setVariant] = useState<VariantId>("expose")
  const meta = VARIANTS.find((v) => v.id === variant)!

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <h1 className={styles.pageTitle}>자기소개 규칙 — 제목↔노출 구조 시안</h1>
        <p className={styles.pageSub}>
          &lsquo;티저 제목이면 게이팅, 완전 노출이면 담백한 제목&rsquo;이라는 원칙 아래
          세 조합을 비교합니다. 스타일(카드·취소선)은 공통이고 제목과 노출 방식만
          다릅니다. 위 버튼으로 전환하고, &lsquo;규칙 원문 보기&rsquo;로 모달(구글
          드라이브 최신 이미지)까지 확인해 보세요.
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

        <div className={styles.demoBand}>
          <div className={styles.titleRow}>
            <h2 className={styles.sectionTitle}>{meta.title}</h2>
          </div>

          {variant === "expose" && <ExposeVariant />}
          {variant === "gate" && <GateVariant />}
          {variant === "partial" && <PartialVariant />}

          <PlacementMock />
        </div>
      </div>
    </div>
  )
}
