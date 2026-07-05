"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import styles from "./feature-designs-quiet.module.css"

/**
 * 모임 소개 시안 쇼케이스 3차 — 콰이어트 에디토리얼 확장 (운영자 요청 2026-07-05)
 * 2차(feature-designs-lux)에서 운영자가 "② 콰이어트 에디토리얼이 가장 낫다"고 방향을 좁힘.
 * 우려는 세로 길이 — 같은 콰이어트 조판(좁은 단·중앙 정렬·명조·여백)을 유지하면서
 * 길이를 관리하는 4가지 파생안을 원안과 나란히 비교한다.
 * 원고는 확정 신규 원고 그대로. 실사이트 미반영 — 프리뷰 전용 제안.
 */

type Chapter = {
  key: string
  eyebrow: string
  label: string
  pull: string
  paragraphs: ReactNode[]
  note?: string
}

const CHAPTERS: Chapter[] = [
  {
    key: "people",
    eyebrow: "PEOPLE",
    label: "이런 분들과 함께해요",
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
    label: "철학과 고전을 함께 읽어요",
    pull: "도구를 갖추고 다시 마주하는 문장은 때로 전혀 다른 무게로 다가옵니다.",
    paragraphs: [
      <>기수별 텍스트는 철학서와 고전 소설을 교차하여 읽는 구조로 구성됩니다. 철학자의 시선으로 내 생각을 꺼내놓을 <strong>생각의 도구</strong>를 먼저 갖추고, 그 확장된 시선으로 고전 속 <strong>저자의 의도</strong>를 정직하게 들여다봅니다.</>,
      <>도구를 갖추고 다시 마주하는 문장은 때로 전혀 다른 무게로 다가옵니다. 우리가 같은 고전을 읽으면서도 한층 더 <strong>밀도 높은 대화</strong>를 나눌 수 있는 이유입니다.</>,
    ],
  },
  {
    key: "questions",
    eyebrow: "QUESTIONS",
    label: "사유의 밀도를 높일 질문을 던져요",
    pull: "질문은 정답을 내기 위함이 아니라, 각자의 삶을 향한 정직한 고백을 이끌어내기 위한 도구일 뿐입니다.",
    paragraphs: [
      <>단순한 독후감이나 일상적인 썰을 나누는 자리가 아닙니다. 레이지데이가 텍스트에 발을 붙여 정교하게 준비한 <strong>발제문</strong>으로 대화가 시작되고, 호스트는 그 흐름 속에서 <strong>사유의 축</strong>이 무너지지 않도록 이끕니다.</>,
      <>&lsquo;이 문장에서 <strong>저자의 진짜 의도</strong>는 무엇인가&rsquo;에서 출발하여 &lsquo;그 사실이 나의 어떤 이야기와 맞닿아 있는가&rsquo;로 수렴하는 구조입니다. 질문은 정답을 내기 위함이 아니라, 각자의 삶을 향한 <strong>정직한 고백</strong>을 이끌어내기 위한 도구일 뿐입니다.</>,
    ],
  },
  {
    key: "space",
    eyebrow: "SPACE",
    label: "생각이 무르익는 공간에서 모여요",
    pull: "오롯이 텍스트와 서로의 대화에만 온전히 몰입할 수 있는 정갈한 환경입니다.",
    paragraphs: [
      <>레이지데이가 직접 관리하고 운영하는 약 30평 규모의 공간, 링키라운지(<strong>사당역 10번 출구</strong> 도보 3분)에서 진행합니다.</>,
      <>상업 공간의 소음이나 낯선 시선에서 벗어나, 오롯이 텍스트와 서로의 대화에만 <strong>온전히 몰입할 수 있는 정갈한 환경</strong>입니다. 준비된 다과와 함께, 느긋하게 생각이 무르익는 시간을 감각해 보세요.</>,
    ],
    note: "*상황에 따라 장소가 변경될 수 있습니다",
  },
]

const VARIANTS = [
  {
    id: "original",
    name: "⓪ 원안 (풀 노출)",
    ref: "기준점: 2차 쇼케이스의 콰이어트 에디토리얼 그대로",
    desc: "비교 기준입니다. 4개 챕터 전체를 접지 않고 노출 — 가장 아름답지만 가장 깁니다.",
  },
  {
    id: "fold",
    name: "① 이어 읽기",
    ref: "레퍼런스: 이솝 제품 서사 'Read more' — 조판은 유지, 본문만 조용히 접기",
    desc: "눈썹 + 제목 + 핵심 문장(명조)까지만 상시 노출하고, 본문은 '이어 읽기'로 엽니다. 콰이어트의 얼굴은 그대로 두고 길이만 원안의 절반 이하로. 버튼도 박스 없이 텍스트 한 줄 — 절제 유지.",
  },
  {
    id: "index",
    name: "② 인덱스",
    ref: "레퍼런스: 이솝 카테고리 인덱스 · 더 로우 룩 넘버링",
    desc: "상단에 자간 넓은 인덱스(PEOPLE · TEXTS…)를 두고 한 번에 한 챕터만 보여줍니다. 섹션 높이가 챕터 하나 분량으로 고정 — 가장 짧습니다. 탐색 주도권이 읽는 사람에게 넘어가는 구조.",
  },
  {
    id: "pager",
    name: "③ 페이지 넘기기",
    ref: "레퍼런스: 하이엔드 룩북의 순차 페이지네이션 (01 — 04)",
    desc: "한 챕터씩 순서대로 넘겨 읽는 구조. 인덱스와 높이는 같지만, '목차에서 고른다'가 아니라 '책장을 넘긴다'는 독서의 은유 — 북클럽과 서사가 가장 잘 맞습니다.",
  },
  {
    id: "firstopen",
    name: "④ 첫 챕터 개방",
    ref: "레퍼런스: 현행 모임소개의 '첫 카드 펼침' 원칙 + 콰이어트 조판",
    desc: "첫 챕터(이런 분들)는 전문 노출, 나머지 셋은 핵심 문장까지만 + 이어 읽기. 스크롤만 하는 사람도 가장 중요한 '누구와'는 다 읽게 되는 절충안입니다.",
  },
] as const

type VariantId = (typeof VARIANTS)[number]["id"]

/* 콰이어트 챕터 한 개 — full=전문 노출, 아니면 접힘(이어 읽기) */
function QuietChapter({ c, full, open, onToggle }: {
  c: Chapter; full: boolean; open?: boolean; onToggle?: () => void
}) {
  return (
    <div className={styles.qtChapter}>
      <p className={styles.qtEyebrow}>{c.eyebrow}</p>
      <h3 className={styles.qtLabel}>{c.label}</h3>
      <p className={styles.qtPull}>{c.pull}</p>
      {!full && (
        <div className={`${styles.qtFold} ${open ? styles.qtFoldOpen : ""}`}>
          <div className={styles.qtFoldInner}>
            <div className={styles.qtBody}>
              {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
            </div>
            {c.note && <p className={styles.qtNote}>{c.note}</p>}
          </div>
        </div>
      )}
      {full && (
        <>
          <div className={styles.qtBody}>
            {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
          </div>
          {c.note && <p className={styles.qtNote}>{c.note}</p>}
        </>
      )}
      {!full && onToggle && (
        <button className={styles.qtMore} onClick={onToggle} aria-expanded={open}>
          {open ? "접기" : "이어 읽기"}
        </button>
      )}
    </div>
  )
}

const Divider = () => <div className={styles.qtDivider} aria-hidden>·</div>

/* ⓪ 원안 — 풀 노출 */
function OriginalVariant() {
  return (
    <div className={styles.demo} data-measure>
      <h2 className={styles.qtTitle}>모임 소개</h2>
      {CHAPTERS.map((c, i) => (
        <div key={c.key}>
          <QuietChapter c={c} full />
          {i < CHAPTERS.length - 1 && <Divider />}
        </div>
      ))}
    </div>
  )
}

/* ① 이어 읽기 — 본문만 접기 */
function FoldVariant() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  return (
    <div className={styles.demo} data-measure>
      <h2 className={styles.qtTitle}>모임 소개</h2>
      {CHAPTERS.map((c, i) => (
        <div key={c.key}>
          <QuietChapter c={c} full={false} open={open.has(c.key)} onToggle={() => toggle(c.key)} />
          {i < CHAPTERS.length - 1 && <Divider />}
        </div>
      ))}
    </div>
  )
}

/* ② 인덱스 — 한 번에 한 챕터 */
function IndexVariant() {
  const [active, setActive] = useState(0)
  const c = CHAPTERS[active]
  return (
    <div className={styles.demo} data-measure>
      <h2 className={styles.qtTitle}>모임 소개</h2>
      <div className={styles.qiIndex}>
        {CHAPTERS.map((ch, i) => (
          <button
            key={ch.key}
            className={`${styles.qiTab} ${i === active ? styles.qiTabActive : ""}`}
            onClick={() => setActive(i)}
          >
            {ch.eyebrow}
          </button>
        ))}
      </div>
      <div className={styles.qiPanel} key={c.key}>
        <QuietChapter c={c} full />
      </div>
    </div>
  )
}

/* ③ 페이지 넘기기 — 순차 페이저 */
function PagerVariant() {
  const [page, setPage] = useState(0)
  const c = CHAPTERS[page]
  return (
    <div className={styles.demo} data-measure>
      <h2 className={styles.qtTitle}>모임 소개</h2>
      <div className={styles.qiPanel} key={c.key}>
        <QuietChapter c={c} full />
      </div>
      <div className={styles.qpNav}>
        <button
          className={styles.qpArrow}
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          aria-label="이전"
        >‹</button>
        <span className={styles.qpCount}>
          {String(page + 1).padStart(2, "0")} <span className={styles.qpCountSep}>—</span> {String(CHAPTERS.length).padStart(2, "0")}
        </span>
        <button
          className={styles.qpArrow}
          onClick={() => setPage(p => Math.min(CHAPTERS.length - 1, p + 1))}
          disabled={page === CHAPTERS.length - 1}
          aria-label="다음"
        >›</button>
      </div>
    </div>
  )
}

/* ④ 첫 챕터 개방 — 1번 전문 + 2~4번 접힘 */
function FirstOpenVariant() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  return (
    <div className={styles.demo} data-measure>
      <h2 className={styles.qtTitle}>모임 소개</h2>
      {CHAPTERS.map((c, i) => (
        <div key={c.key}>
          {i === 0
            ? <QuietChapter c={c} full />
            : <QuietChapter c={c} full={false} open={open.has(c.key)} onToggle={() => toggle(c.key)} />}
          {i < CHAPTERS.length - 1 && <Divider />}
        </div>
      ))}
    </div>
  )
}

export default function FeatureDesignsQuietPage() {
  const [variant, setVariant] = useState<VariantId>("fold")
  const meta = VARIANTS.find(v => v.id === variant)!

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <h1 className={styles.pageTitle}>모임 소개 시안 — 콰이어트 확장</h1>
        <p className={styles.pageSub}>
          콰이어트 에디토리얼의 조판(좁은 단·중앙 정렬·명조·여백)은 그대로 두고,
          세로 길이를 관리하는 방식만 달리한 파생안 비교입니다.
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

        {variant === "original" && <OriginalVariant />}
        {variant === "fold" && <FoldVariant />}
        {variant === "index" && <IndexVariant />}
        {variant === "pager" && <PagerVariant />}
        {variant === "firstopen" && <FirstOpenVariant />}
      </div>
    </div>
  )
}
