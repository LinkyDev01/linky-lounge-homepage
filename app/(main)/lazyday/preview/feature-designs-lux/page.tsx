"use client"

import { useRef, useState } from "react"
import type { ReactNode } from "react"
import styles from "./feature-designs-lux.module.css"

/**
 * 모임 소개 시안 쇼케이스 2차 — 하이엔드 브랜드 결 (운영자 요청 2026-07-05)
 * "속하고 싶다"는 감정을 건드리는 럭셔리/패션/뷰티 브랜드 문법 5종.
 * 기존 feature-designs(①에디토리얼 ②매니페스토 ③접힘)와 별도 — 두 쇼케이스 모두 보존.
 * 원고는 확정 신규 원고(feature-designs와 동일)를 그대로 사용.
 * ③초대장의 서두·맺음 문장만 시안용 가안 — 운영자 카피 확정 필요.
 * 실사이트 미반영 — 프리뷰 전용 제안.
 */

type Chapter = {
  key: string
  /** 영문 눈썹 레이블 (디자인 요소) */
  eyebrow: string
  label: ReactNode
  labelPlain: string
  pull: string
  paragraphs: ReactNode[]
  note?: string
}

const CHAPTERS: Chapter[] = [
  {
    key: "people",
    eyebrow: "PEOPLE",
    label: <><strong>이런 분들</strong>과 함께해요</>,
    labelPlain: "이런 분들과 함께해요",
    pull: "그 불협화음 속에서 내 이야기는 비로소 또렷해집니다.",
    paragraphs: [
      <>쉽게 공감하는 대화보다 <strong>문학·철학·예술</strong> 안에서 낯선 시각과 부딪히는 순간을 기다리는 멤버들과 함께합니다. 무색무취한 이야기에 고개만 끄덕이는 자리가 아니라, 각자의 결이 다른 곳에서 팽팽하게 대립하는 자리입니다.</>,
      <>비슷한 결을 가졌다고 같은 결론에 도달할 필요는 없습니다. 같은 문장 앞에서 멈춰 서도, 거기서 이어지는 생각은 저마다 다릅니다. 그 <strong>불협화음</strong> 속에서 내 이야기는 비로소 또렷해집니다.</>,
      <>그렇기에 모든 멤버는 참여 전, <strong>인터뷰</strong>를 통해 서로의 결을 확인합니다. 모임이 궁금하다면, 대화의 결이 맞을지 확인하는 인터뷰부터 시작해 보세요.</>,
    ],
  },
  {
    key: "books",
    eyebrow: "TEXTS",
    label: <><strong>철학과 고전</strong>을 함께 읽어요</>,
    labelPlain: "철학과 고전을 함께 읽어요",
    pull: "도구를 갖추고 다시 마주하는 문장은 때로 전혀 다른 무게로 다가옵니다.",
    paragraphs: [
      <>기수별 텍스트는 철학서와 고전 소설을 교차하여 읽는 구조로 구성됩니다. 철학자의 시선으로 내 생각을 꺼내놓을 <strong>생각의 도구</strong>를 먼저 갖추고, 그 확장된 시선으로 고전 속 <strong>저자의 의도</strong>를 정직하게 들여다봅니다.</>,
      <>도구를 갖추고 다시 마주하는 문장은 때로 전혀 다른 무게로 다가옵니다. 우리가 같은 고전을 읽으면서도 한층 더 <strong>밀도 높은 대화</strong>를 나눌 수 있는 이유입니다.</>,
    ],
  },
  {
    key: "questions",
    eyebrow: "QUESTIONS",
    label: <><strong>사유의 밀도</strong>를 높일 질문을 던져요</>,
    labelPlain: "사유의 밀도를 높일 질문을 던져요",
    pull: "질문은 정답을 내기 위함이 아니라, 각자의 삶을 향한 정직한 고백을 이끌어내기 위한 도구일 뿐입니다.",
    paragraphs: [
      <>단순한 독후감이나 일상적인 썰을 나누는 자리가 아닙니다. 레이지데이가 텍스트에 발을 붙여 정교하게 준비한 <strong>발제문</strong>으로 대화가 시작되고, 호스트는 그 흐름 속에서 <strong>사유의 축</strong>이 무너지지 않도록 이끕니다.</>,
      <>&lsquo;이 문장에서 <strong>저자의 진짜 의도</strong>는 무엇인가&rsquo;에서 출발하여 &lsquo;그 사실이 나의 어떤 이야기와 맞닿아 있는가&rsquo;로 수렴하는 구조입니다. 질문은 정답을 내기 위함이 아니라, 각자의 삶을 향한 <strong>정직한 고백</strong>을 이끌어내기 위한 도구일 뿐입니다.</>,
    ],
  },
  {
    key: "space",
    eyebrow: "SPACE",
    label: <><strong>생각이 무르익는 공간</strong>에서 모여요</>,
    labelPlain: "생각이 무르익는 공간에서 모여요",
    pull: "오롯이 텍스트와 서로의 대화에만 온전히 몰입할 수 있는 정갈한 환경입니다.",
    paragraphs: [
      <>레이지데이가 직접 관리하고 운영하는 약 30평 규모의 공간, 링키라운지(<strong>사당역 10번 출구</strong> 도보 3분)에서 진행합니다.</>,
      <>상업 공간의 소음이나 낯선 시선에서 벗어나, 오롯이 텍스트와 서로의 대화에만 <strong>온전히 몰입할 수 있는 정갈한 환경</strong>입니다. 준비된 다과와 함께, 느긋하게 생각이 무르익는 시간을 감각해 보세요.</>,
    ],
    note: "*상황에 따라 장소가 변경될 수 있습니다",
  },
]

const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ"]

const VARIANTS = [
  {
    id: "maison",
    name: "① 하우스 코드",
    ref: "레퍼런스: 샤넬 하우스 코드 · 소호하우스 House Rules",
    desc: "브랜드를 '코드(규율)를 가진 하우스'로 제시합니다. 로마숫자 + 얇은 괘선 + 절제된 여백. 설명하지 않고 선언하는 톤 — 코드를 읽고 공감하는 사람만 남는 구조가 곧 선별의 뉘앙스를 만듭니다. 각 코드를 누르면 본문이 조용히 열립니다.",
  },
  {
    id: "quiet",
    name: "② 콰이어트 에디토리얼",
    ref: "레퍼런스: 이솝(Aesop) · 더 로우(The Row)",
    desc: "설득의 장치를 전부 제거한 정적 조판. 좁은 단, 중앙 정렬, 명조, 압도적 여백. 접기·버튼·박스 없음 — '우리는 서두르지 않는다'는 태도 자체가 하이엔드의 문법입니다. 훑는 사람은 눈썹 레이블과 풀쿼트만 스쳐도 결이 전달됩니다.",
  },
  {
    id: "invitation",
    name: "③ 초대장",
    ref: "레퍼런스: 프라이빗 멤버스 클럽 초대장 · 에르메스 어포인트먼트",
    desc: "모임 소개를 '정보'가 아닌 '초대장'으로 재구성합니다. 이중 괘선 프레임 + 모노그램 + 서한 조판. 인터뷰라는 허들을 '선별'이 아니라 '초대의 절차'로 뒤집는 프레이밍 — 속하고 싶다는 감정을 가장 직접적으로 건드립니다. (서두·맺음 문장은 가안, 운영자 카피 확정 필요)",
  },
  {
    id: "lookbook",
    name: "④ 캠페인 룩북",
    ref: "레퍼런스: 자크뮈스 · 패션 캠페인 챕터 넘버링",
    desc: "패션 캠페인의 챕터 문법. 초대형 고스트 숫자를 그래픽 요소로 쓰는 가로 스와이프 카드 — 현행 캐러셀 문법(센터 스냅 + 슬리버)을 그대로 따르되 사진 없이 타이포만으로 룩북의 밀도를 냅니다. 활성 챕터의 본문이 아래에 이어집니다.",
  },
  {
    id: "credo",
    name: "⑤ 크레도",
    ref: "레퍼런스: 르 라보 매니페스토 · 바이레도",
    desc: "핵심 4문장을 하나의 신조(credo)로 이어 붙인 대형 명조 선언문. 문장 자체가 내비게이션 — 밑줄 친 문장을 누르면 해당 상세가 아래에 열립니다. 브랜드의 신조를 '해독'하며 읽게 만드는 인터랙션이 소속감의 서사를 만듭니다.",
  },
] as const

type VariantId = (typeof VARIANTS)[number]["id"]

/* ═══ ① 하우스 코드 ═══ */
function MaisonVariant() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  return (
    <div className={styles.demo}>
      <p className={styles.mzEyebrow}>LAZYDAY BOOKCLUB — HOUSE CODES</p>
      <h2 className={styles.mzTitle}>모임 소개</h2>
      <div className={styles.mzList}>
        {CHAPTERS.map((c, i) => {
          const isOpen = open.has(c.key)
          return (
            <div key={c.key} className={styles.mzCode}>
              <button className={styles.mzHead} onClick={() => toggle(c.key)} aria-expanded={isOpen}>
                <span className={styles.mzNum}>{ROMAN[i]}</span>
                <span className={styles.mzHeadText}>
                  <span className={styles.mzLabel}>{c.labelPlain}</span>
                  <span className={styles.mzPull}>{c.pull}</span>
                </span>
                <span className={`${styles.mzPlus} ${isOpen ? styles.mzPlusOpen : ""}`} aria-hidden>+</span>
              </button>
              <div className={`${styles.mzBody} ${isOpen ? styles.mzBodyOpen : ""}`}>
                <div className={styles.mzBodyInner}>
                  <div className={styles.mzParas}>
                    {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
                    {c.note && <p className={styles.mzNote}>{c.note}</p>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══ ② 콰이어트 에디토리얼 ═══ */
function QuietVariant() {
  return (
    <div className={`${styles.demo} ${styles.qtDemo}`}>
      <h2 className={styles.qtTitle}>모임 소개</h2>
      {CHAPTERS.map((c, i) => (
        <div key={c.key} className={styles.qtChapter}>
          <p className={styles.qtEyebrow}>{c.eyebrow}</p>
          <h3 className={styles.qtLabel}>{c.labelPlain}</h3>
          <p className={styles.qtPull}>{c.pull}</p>
          <div className={styles.qtBody}>
            {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
          </div>
          {c.note && <p className={styles.qtNote}>{c.note}</p>}
          {i < CHAPTERS.length - 1 && <div className={styles.qtDivider} aria-hidden>·</div>}
        </div>
      ))}
    </div>
  )
}

/* ═══ ③ 초대장 ═══ */
function InvitationVariant() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  return (
    <div className={styles.demo}>
      <div className={styles.ivFrame}>
        <div className={styles.ivFrameInner}>
          <p className={styles.ivMonogram}>L.</p>
          <p className={styles.ivSeason}>THIRD SEASON · 2026</p>
          {/* ⚠ 서두·맺음 문장은 시안용 가안 — 운영자 카피 확정 필요 */}
          <p className={styles.ivOpening}>
            레이지데이 북클럽은<br />다음의 결을 가진 분을 기다립니다.
          </p>
          <div className={styles.ivPulls}>
            {CHAPTERS.map((c, i) => (
              <p key={c.key} className={styles.ivPullLine}>
                <span className={styles.ivPullNum}>{String(i + 1).padStart(2, "0")}</span>
                {c.pull}
              </p>
            ))}
          </div>
          <p className={styles.ivClosing}>당신의 결을 확인하는<br />인터뷰로 초대합니다.</p>
          <span className={styles.ivRsvp}>인터뷰 신청</span>
        </div>
      </div>
      <div className={styles.ivDetails}>
        {CHAPTERS.map(c => {
          const isOpen = open.has(c.key)
          return (
            <div key={c.key} className={styles.ivItem}>
              <button className={styles.ivItemHead} onClick={() => toggle(c.key)} aria-expanded={isOpen}>
                <span className={styles.ivItemLabel}>{c.labelPlain}</span>
                <span className={`${styles.ivItemPlus} ${isOpen ? styles.ivItemPlusOpen : ""}`} aria-hidden>+</span>
              </button>
              <div className={`${styles.ivItemBody} ${isOpen ? styles.ivItemBodyOpen : ""}`}>
                <div className={styles.ivItemBodyInner}>
                  <div className={styles.ivParas}>
                    {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
                    {c.note && <p className={styles.mzNote}>{c.note}</p>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══ ④ 캠페인 룩북 ═══ */
function LookbookVariant() {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    if (!card) return
    const idx = Math.round(el.scrollLeft / (card.offsetWidth + 12))
    setActive(Math.max(0, Math.min(CHAPTERS.length - 1, idx)))
  }
  const c = CHAPTERS[active]
  return (
    <div className={styles.demo}>
      <p className={styles.mzEyebrow}>LAZYDAY BOOKCLUB — CAMPAIGN</p>
      <h2 className={styles.mzTitle}>모임 소개</h2>
      <div className={styles.lbTrack} ref={trackRef} onScroll={onScroll}>
        {CHAPTERS.map((ch, i) => (
          <div key={ch.key} className={`${styles.lbCard} ${i === active ? styles.lbCardActive : ""}`}>
            <span className={styles.lbGhost} aria-hidden>{String(i + 1).padStart(2, "0")}</span>
            <p className={styles.lbEyebrow}>{ch.eyebrow}</p>
            <h3 className={styles.lbLabel}>{ch.labelPlain}</h3>
            <p className={styles.lbPull}>{ch.pull}</p>
          </div>
        ))}
      </div>
      <div className={styles.lbDots}>
        {CHAPTERS.map((_, i) => (
          <span key={i} className={`${styles.lbDot} ${i === active ? styles.lbDotActive : ""}`} />
        ))}
      </div>
      <div className={styles.lbBody} key={c.key}>
        {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
        {c.note && <p className={styles.mzNote}>{c.note}</p>}
      </div>
    </div>
  )
}

/* ═══ ⑤ 크레도 ═══ */
function CredoVariant() {
  const [active, setActive] = useState<string | null>(null)
  const c = CHAPTERS.find(ch => ch.key === active) ?? null
  return (
    <div className={styles.demo}>
      <p className={styles.mzEyebrow}>LAZYDAY BOOKCLUB — CREDO</p>
      <h2 className={styles.mzTitle}>모임 소개</h2>
      <p className={styles.crManifesto}>
        {CHAPTERS.map(ch => (
          <button
            key={ch.key}
            className={`${styles.crSentence} ${active === ch.key ? styles.crSentenceActive : ""}`}
            onClick={() => setActive(prev => (prev === ch.key ? null : ch.key))}
          >
            {ch.pull}
          </button>
        ))}
      </p>
      <p className={styles.crHint}>문장을 누르면 이야기가 이어집니다</p>
      {c && (
        <div className={styles.crDetail} key={c.key}>
          <p className={styles.crDetailLabel}>{c.labelPlain}</p>
          <div className={styles.crDetailBody}>
            {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
            {c.note && <p className={styles.mzNote}>{c.note}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FeatureDesignsLuxPage() {
  const [variant, setVariant] = useState<VariantId>("maison")
  const meta = VARIANTS.find(v => v.id === variant)!

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <h1 className={styles.pageTitle}>모임 소개 시안 — 하이엔드 결</h1>
        <p className={styles.pageSub}>
          속하고 싶다는 감정을 건드리는 럭셔리·패션·뷰티 브랜드의 문법 5종.
          같은 확정 원고를 서로 다른 브랜드 태도로 조판합니다.
        </p>

        <div className={styles.switcher}>
          {VARIANTS.map(v => (
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

        {variant === "maison" && <MaisonVariant />}
        {variant === "quiet" && <QuietVariant />}
        {variant === "invitation" && <InvitationVariant />}
        {variant === "lookbook" && <LookbookVariant />}
        {variant === "credo" && <CredoVariant />}
      </div>
    </div>
  )
}
