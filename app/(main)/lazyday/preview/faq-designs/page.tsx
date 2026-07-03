"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import styles from "./faq-designs.module.css"

/**
 * FAQ UI/UX 디자인 시안 쇼케이스 — 같은 콘텐츠를 5가지 패턴으로.
 * 운영자 요청(2026-07-03): 현행과 다른 다양한 레퍼런스 기반 시안을
 * 인터랙티브로 비교. 모임 소개와의 디자인 유사성 해소도 목표.
 * 실사이트 미반영 — 프리뷰 전용 제안.
 */

type Faq = {
  key: string
  q: string
  /** 칩·채팅용 짧은 키워드 */
  short: string
  /** 항상 노출되는 핵심 문장 (E안용) */
  lead: ReactNode
  rest: ReactNode[]
  sub?: string
}

const FAQS: Faq[] = [
  {
    key: "interview",
    q: "인터뷰는 왜 하나요?",
    short: "인터뷰",
    lead: "서로의 결을 가늠하는 자리예요. 두 가지 방식 중 편한 걸 선택할 수 있어요.",
    rest: [
      <><strong>전화 인터뷰</strong> — 약 20분, 모임 분위기를 미리 느끼며 궁금한 점도 바로 물어볼 수 있어요.</>,
      <><strong>서면 인터뷰</strong> — 6가지 질문에 편한 시간에 자유롭게 답하는 방식이에요.</>,
    ],
  },
  {
    key: "price",
    q: "참가비에는 어떤 것들이 포함되어 있나요?",
    short: "참가비",
    lead: <><strong>공간 운영</strong>, <strong>모임 기획과 진행</strong>, <strong>다과</strong>, <strong>커뮤니티 운영</strong>이 포함됩니다.</>,
    rest: [
      "직접 관리하는 약 30평 규모의 공간에서 진행하고, 일관된 모임 경험을 위하여 인터뷰부터 모임 당일 진행까지 모든 과정을 레이지데이가 함께하고 있습니다.",
    ],
  },
  {
    key: "book-select",
    q: "책은 어떤 기준으로 고르나요?",
    short: "책 선정",
    lead: <><strong>철학서</strong>와 <strong>고전 소설</strong>을 함께 읽는 구조로 구성해요.</>,
    rest: [
      "철학자들의 시선과 이론을 바탕으로 생각의 도구를 먼저 갖추고, 고전 소설 속 저자의 의도를 들여다보며 나의 이야기와 시선을 깊이 들여다볼 수 있도록요. 같은 부분을 읽더라도 더 밀도 있는 대화를 나눌 수 있는 이유입니다.",
    ],
  },
  {
    key: "book-read",
    q: "책을 다 읽고 와야 하나요?",
    short: "완독 여부",
    lead: <>완독 자체보다는 <strong>책 속의 문장을 고민하는 시간</strong>이 더 중요합니다.</>,
    rest: [
      "'책 속의 문장으로 나의 생각이 확장될 수 있는가?'에 초점을 맞추어 읽어오시면 충분합니다.",
    ],
  },
  {
    key: "location",
    q: "모임은 어디에서 진행하나요?",
    short: "장소",
    lead: <>모든 모임은 <strong>링키라운지</strong>(사당역 10번 출구 4분 거리)에서 진행합니다.</>,
    rest: [],
    sub: "*상황에 따라 장소가 변경될 수 있습니다",
  },
  {
    key: "gathering",
    q: "자유 독서모임에선 어떤 시간이 마련되나요?",
    short: "자유모임",
    lead: <><strong>1부</strong> 영화 감상 14:30–17:00 — 철학과 예술이 맞닿은 작품을 함께 감상합니다.</>,
    rest: [
      "4회차의 사유를 영상의 언어로 더 깊이 확장해가는 시간입니다.",
      <><strong>2부</strong> 자유 독서모임 17:00– — 다른 시간대에 만나지 못한 멤버들과 처음으로 한자리에 모여, 네 권의 책에서는 꺼내지 못했던 이야기를 자유롭게 나눕니다.</>,
    ],
  },
]

const VARIANTS = [
  {
    id: "line",
    name: "A. 미니멀 라인",
    ref: "레퍼런스: Stripe · Apple 고객지원",
    desc: "박스를 걷어내고 가는 괘선만 남긴 정갈한 리스트. + 아이콘이 45° 회전하며 부드럽게 펼쳐집니다. 모임 소개의 카드형과 완전히 다른 결이라 두 섹션의 유사성이 해소됩니다.",
  },
  {
    id: "chip",
    name: "B. 질문 칩 탭",
    ref: "레퍼런스: 토스 고객센터 · 채널톡 헬프",
    desc: "질문을 키워드 칩으로 줄 세우고, 탭하면 아래 패널이 그 답으로 전환됩니다. 아코디언 스크롤 없이 한 화면에서 원하는 질문만 골라 읽는 모바일 특화 패턴.",
  },
  {
    id: "chat",
    name: "C. 대화형 메신저",
    ref: "레퍼런스: 카카오톡 채널 상담 · 채널톡",
    desc: "궁금한 질문을 누르면 채팅처럼 문답이 쌓입니다. '인터뷰로 결을 확인하는' 브랜드와 톤이 맞고, 마지막에 실제 인스타 DM으로 자연스럽게 이어집니다.",
  },
  {
    id: "editorial",
    name: "D. 에디토리얼 인덱스",
    ref: "레퍼런스: 매거진 B · Kinfolk 웹",
    desc: "01–06 번호 + 명조 질문의 잡지 목차 구성. 책 소개와 같은 세리프 언어를 써서 '독서 모임다운' FAQ가 됩니다. 답변도 명조로 느긋하게.",
  },
  {
    id: "peek",
    name: "E. 핵심 노출 + 페이드",
    ref: "레퍼런스: 모임 소개 섹션과 동일 문법 (기존 개선안)",
    desc: "핵심 답변 한 문장은 항상 보이고, 나머지는 페이드로 '더 있음'을 암시. 훑기만 해도 답의 뼈대가 읽히지만, 모임 소개와 생김새가 가장 비슷한 안입니다.",
  },
] as const

type VariantId = (typeof VARIANTS)[number]["id"]

// ── A. 미니멀 라인 ──────────────────────────────────────────
function LineVariant() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  return (
    <div className={styles.lineList}>
      {FAQS.map(f => {
        const isOpen = open.has(f.key)
        return (
          <div key={f.key} className={styles.lineItem}>
            <button className={styles.lineQ} onClick={() => toggle(f.key)} aria-expanded={isOpen}>
              <span className={styles.lineQText}>{f.q}</span>
              <span className={`${styles.lineIcon} ${isOpen ? styles.lineIconOpen : ""}`}>+</span>
            </button>
            <div className={`${styles.lineBody} ${isOpen ? styles.lineBodyOpen : ""}`}>
              <div className={styles.lineBodyInner}>
                <div className={styles.lineAnswer}>
                  <p>{f.lead}</p>
                  {f.rest.map((r, i) => <p key={i}>{r}</p>)}
                </div>
                {f.sub && <p className={styles.lineNote}>{f.sub}</p>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── B. 질문 칩 탭 ───────────────────────────────────────────
function ChipVariant() {
  const [active, setActive] = useState(FAQS[0].key)
  const cur = FAQS.find(f => f.key === active)!
  return (
    <div>
      <div className={styles.chipRow} role="tablist" aria-label="질문 선택">
        {FAQS.map(f => (
          <button
            key={f.key}
            role="tab"
            aria-selected={f.key === active}
            className={`${styles.chip} ${f.key === active ? styles.chipActive : ""}`}
            onClick={() => setActive(f.key)}
          >
            {f.short}
          </button>
        ))}
      </div>
      <div key={cur.key} className={styles.chipPanel}>
        <h3 className={styles.chipPanelQ}>{cur.q}</h3>
        <div className={styles.chipPanelA}>
          <p>{cur.lead}</p>
          {cur.rest.map((r, i) => <p key={i}>{r}</p>)}
        </div>
        {cur.sub && <p className={styles.chipPanelNote}>{cur.sub}</p>}
      </div>
    </div>
  )
}

// ── C. 대화형 메신저 ────────────────────────────────────────
function ChatVariant() {
  const [asked, setAsked] = useState<string[]>([])
  const ask = (k: string) => { if (!asked.includes(k)) setAsked(prev => [...prev, k]) }
  return (
    <div className={styles.chatWrap}>
      <div className={styles.chatHead}>
        <span className={styles.chatAvatar}>L</span>
        <div>
          <div className={styles.chatHeadName}>레이지데이 북클럽</div>
          <div className={styles.chatHeadSub}>보통 몇 분 안에 답해요</div>
        </div>
      </div>
      <div className={styles.chatLog}>
        {asked.length === 0 && (
          <span className={styles.bubbleHint}>아래에서 궁금한 질문을 눌러보세요 👇</span>
        )}
        {asked.map(k => {
          const f = FAQS.find(x => x.key === k)!
          return (
            <div key={k} style={{ display: "contents" }}>
              <div className={styles.bubbleQ}>{f.q}</div>
              <div className={styles.bubbleA}>
                <p>{f.lead}</p>
                {f.rest.map((r, i) => <p key={i}>{r}</p>)}
                {f.sub && <p style={{ fontSize: 11, color: "#9a9590" }}>{f.sub}</p>}
              </div>
            </div>
          )
        })}
      </div>
      <div className={styles.chatQuickWrap}>
        <p className={styles.chatQuickLabel}>자주 묻는 질문</p>
        <div className={styles.chatQuickRow}>
          {FAQS.map(f => (
            <button
              key={f.key}
              className={styles.chatQuickBtn}
              onClick={() => ask(f.key)}
              disabled={asked.includes(f.key)}
            >
              {f.short}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── D. 에디토리얼 인덱스 ────────────────────────────────────
function EditorialVariant() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  return (
    <div className={styles.edList}>
      {FAQS.map((f, i) => {
        const isOpen = open.has(f.key)
        return (
          <div key={f.key} className={styles.edItem}>
            <button
              className={`${styles.edQ} ${isOpen ? styles.edQOpen : ""}`}
              onClick={() => toggle(f.key)}
              aria-expanded={isOpen}
            >
              <span className={styles.edNum}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.edQText}>{f.q}</span>
              <span className={`${styles.edArrow} ${isOpen ? styles.edArrowOpen : ""}`}>▾</span>
            </button>
            <div className={`${styles.edBody} ${isOpen ? styles.edBodyOpen : ""}`}>
              <div className={styles.edBodyInner}>
                <div className={styles.edAnswer}>
                  <p>{f.lead}</p>
                  {f.rest.map((r, j) => <p key={j}>{r}</p>)}
                </div>
                {f.sub && <p className={styles.edNote}>{f.sub}</p>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── E. 핵심 노출 + 페이드 (모임 소개 문법) ──────────────────
function PeekVariant() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  return (
    <div>
      {FAQS.map(f => {
        const isOpen = open.has(f.key)
        const hasRest = f.rest.length > 0
        return (
          <div key={f.key} className={styles.pkItem}>
            <button className={styles.pkTitleBox} onClick={() => toggle(f.key)} aria-expanded={isOpen}>
              <span className={styles.pkQ}>{f.q}</span>
              {hasRest && <span className={`${styles.pkArrow} ${isOpen ? styles.pkArrowOpen : ""}`}>▾</span>}
            </button>
            <div
              className={styles.pkQuote}
              onClick={() => hasRest && toggle(f.key)}
              style={{ cursor: hasRest && !isOpen ? "pointer" : "default" }}
            >
              <p className={styles.pkLead}>{f.lead}</p>
              {hasRest && (
                <div className={styles.pkRestWrap} style={{ maxHeight: isOpen ? 400 : 26 }}>
                  <div className={styles.pkRest}>
                    {f.rest.map((r, i) => <p key={i}>{r}</p>)}
                  </div>
                  {!isOpen && <div className={styles.pkFade} />}
                </div>
              )}
              {hasRest && !isOpen && <span className={styles.pkMore}>...더보기</span>}
              {f.sub && <p style={{ fontSize: 11, color: "#9a9590", margin: "4px 0 0" }}>{f.sub}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function FaqDesignsPage() {
  const [variant, setVariant] = useState<VariantId>("line")
  const meta = VARIANTS.find(v => v.id === variant)!

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <h1 className={styles.pageTitle}>FAQ 디자인 시안</h1>
        <p className={styles.pageSub}>
          같은 질문·답변을 다섯 가지 패턴으로 비교합니다. 위 버튼으로 시안을 전환하고,
          각 시안을 직접 눌러보며 상호작용을 확인해 보세요.
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

        <div className={styles.demoTitleRow}>
          <h2 className={styles.demoTitle}>자주 묻는 질문</h2>
        </div>

        {variant === "line" && <LineVariant />}
        {variant === "chip" && <ChipVariant />}
        {variant === "chat" && <ChatVariant />}
        {variant === "editorial" && <EditorialVariant />}
        {variant === "peek" && <PeekVariant />}
      </div>
    </div>
  )
}
