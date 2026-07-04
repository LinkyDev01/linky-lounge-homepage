"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import styles from "./feature-designs.module.css"
import { FeatureBoxSectionV2 } from "../FeatureBoxSectionV2"

/**
 * 모임 소개 노출 방식 시안 쇼케이스 (운영자 요청 2026-07-04)
 * "텍스트가 많은데 다 중요하다" 문제의 세 가지 해법을 같은 원고(확정 신규 원고)로 비교:
 *  ① 풀 노출 에디토리얼 — 접지 않고 타이포 위계(번호+제목+명조 풀쿼트+본문 전체)로 조판
 *  ② 매니페스토 요약 + 상세 — 핵심 4문장 선(先)노출 + 아래 접힘 카드
 *  ③ 문단 경계 접힘 — 현행 페이드+더보기 유지, 접힘 높이만 '첫 문단 온전 노출'로 개량 (기구현 V2)
 * 실사이트 미반영 — 프리뷰 전용 제안.
 */

type Chapter = {
  key: string
  label: ReactNode
  /** 핵심 문장 (에디토리얼 풀쿼트 / 매니페스토 라인) */
  pull: string
  paragraphs: ReactNode[]
  note?: string
}

const CHAPTERS: Chapter[] = [
  {
    key: "people",
    label: <><strong>이런 분들</strong>과 함께해요</>,
    pull: "그 불협화음 속에서 내 이야기는 비로소 또렷해집니다.",
    paragraphs: [
      <>쉽게 공감하는 대화보다 <strong>문학·철학·예술</strong> 안에서 낯선 시각과 부딪히는 순간을 기다리는 멤버들과 함께합니다. 무색무취한 이야기에 고개만 끄덕이는 자리가 아니라, 각자의 결이 다른 곳에서 팽팽하게 대립하는 자리입니다.</>,
      <>비슷한 결을 가졌다고 같은 결론에 도달할 필요는 없습니다. 같은 문장 앞에서 멈춰 서도, 거기서 이어지는 생각은 저마다 다릅니다. 그 <strong>불협화음</strong> 속에서 내 이야기는 비로소 또렷해집니다.</>,
      <>그렇기에 모든 멤버는 참여 전, <strong>인터뷰</strong>를 통해 서로의 결을 확인합니다. 모임이 궁금하다면, 대화의 결이 맞을지 확인하는 인터뷰부터 시작해 보세요.</>,
    ],
  },
  {
    key: "books",
    label: <><strong>철학과 고전</strong>을 함께 읽어요</>,
    pull: "도구를 갖추고 다시 마주하는 문장은 때로 전혀 다른 무게로 다가옵니다.",
    paragraphs: [
      <>기수별 텍스트는 철학서와 고전 소설을 교차하여 읽는 구조로 구성됩니다. 철학자의 시선으로 내 생각을 꺼내놓을 <strong>생각의 도구</strong>를 먼저 갖추고, 그 확장된 시선으로 고전 속 <strong>저자의 의도</strong>를 정직하게 들여다봅니다.</>,
      <>도구를 갖추고 다시 마주하는 문장은 때로 전혀 다른 무게로 다가옵니다. 우리가 같은 고전을 읽으면서도 한층 더 <strong>밀도 높은 대화</strong>를 나눌 수 있는 이유입니다.</>,
    ],
  },
  {
    key: "questions",
    label: <><strong>사유의 밀도</strong>를 높일 질문을 던져요</>,
    pull: "질문은 정답을 내기 위함이 아니라, 각자의 삶을 향한 정직한 고백을 이끌어내기 위한 도구일 뿐입니다.",
    paragraphs: [
      <>단순한 독후감이나 일상적인 썰을 나누는 자리가 아닙니다. 레이지데이가 텍스트에 발을 붙여 정교하게 준비한 <strong>발제문</strong>으로 대화가 시작되고, 호스트는 그 흐름 속에서 <strong>사유의 축</strong>이 무너지지 않도록 이끕니다.</>,
      <>&lsquo;이 문장에서 <strong>저자의 진짜 의도</strong>는 무엇인가&rsquo;에서 출발하여 &lsquo;그 사실이 나의 어떤 이야기와 맞닿아 있는가&rsquo;로 수렴하는 구조입니다. 질문은 정답을 내기 위함이 아니라, 각자의 삶을 향한 <strong>정직한 고백</strong>을 이끌어내기 위한 도구일 뿐입니다.</>,
    ],
  },
  {
    key: "space",
    label: <><strong>생각이 무르익는 공간</strong>에서 모여요</>,
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
    id: "editorial",
    name: "① 풀 노출 에디토리얼",
    ref: "레퍼런스: 매거진 B 브랜드 스토리 · 트레바리 '우리는'",
    desc: "접기를 버리고 타이포 위계로 해결합니다. 챕터 번호 + 제목 + 핵심 문장(명조 풀쿼트) + 본문 전체. '다 중요한 텍스트'를 숨기지 않고 읽는 리듬을 만들어 보여줍니다. 훑는 사람은 풀쿼트 4개만 스쳐도 뼈대를 얻습니다.",
  },
  {
    id: "manifesto",
    name: "② 매니페스토 요약 + 상세",
    ref: "레퍼런스: 브랜드 선언문 패턴 (에이스호텔 · 프라이탁)",
    desc: "핵심 4문장을 선언문 블록으로 먼저 보여주고, 상세는 아래 접힘 카드로. 훑는 사람은 4줄로 전체를, 관심 있는 사람은 카드를 팝니다.",
  },
  {
    id: "peek",
    name: "③ 문단 경계 접힘 (기구현)",
    ref: "레퍼런스: 현행 페이드+더보기 문법의 개량",
    desc: "접힘은 유지하되 '잘리는 위치'만 고칩니다 — 고정 높이(54px)에서 문장이 중간에 잘리던 것을, 첫 문단은 온전히 보이고 다음 문단이 살짝 걸친 뒤 페이드되도록 카드별 측정. 이미 프리뷰 모임 소개에 적용되어 있는 그 버전입니다.",
  },
] as const

type VariantId = (typeof VARIANTS)[number]["id"]

function EditorialVariant() {
  return (
    <div className={styles.demo}>
      <div className={styles.demoTitleRow}>
        <h2 className={styles.demoTitle}>모임 소개</h2>
      </div>
      {CHAPTERS.map((c, i) => (
        <div key={c.key} className={styles.edChapter}>
          <div className={styles.edChapterHead}>
            <span className={styles.edNum}>{String(i + 1).padStart(2, "0")}</span>
            <h3 className={styles.edChapterTitle}>{c.label}</h3>
          </div>
          <p className={styles.edPull}>{c.pull}</p>
          <div className={styles.edBody}>
            {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
          </div>
          {c.note && <p className={styles.edNote}>{c.note}</p>}
        </div>
      ))}
    </div>
  )
}

function ManifestoVariant() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  return (
    <div className={styles.demo}>
      <div className={styles.demoTitleRow}>
        <h2 className={styles.demoTitle}>모임 소개</h2>
      </div>
      <div className={styles.mfBlock}>
        {CHAPTERS.map((c, i) => (
          <div key={c.key} className={styles.mfLine}>
            <span className={styles.mfNum}>{String(i + 1).padStart(2, "0")}</span>
            <span className={styles.mfText}>{c.pull}</span>
          </div>
        ))}
      </div>
      {CHAPTERS.map(c => {
        const isOpen = open.has(c.key)
        return (
          <div key={c.key} className={styles.mfItem}>
            <button className={styles.mfTitleBox} onClick={() => toggle(c.key)} aria-expanded={isOpen}>
              <span className={styles.mfLabel}>{c.label}</span>
              <span className={`${styles.mfArrow} ${isOpen ? styles.mfArrowOpen : ""}`}>▾</span>
            </button>
            <div className={`${styles.mfBody} ${isOpen ? styles.mfBodyOpen : ""}`}>
              <div className={styles.mfBodyInner}>
                <div className={styles.mfDesc}>
                  {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
                  {c.note && <p style={{ fontSize: 11, color: "#9a9590" }}>{c.note}</p>}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function FeatureDesignsPage() {
  const [variant, setVariant] = useState<VariantId>("editorial")
  const meta = VARIANTS.find(v => v.id === variant)!

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <h1 className={styles.pageTitle}>모임 소개 시안</h1>
        <p className={styles.pageSub}>
          같은 원고(확정 신규 원고)를 세 가지 노출 방식으로 비교합니다.
          위 버튼으로 전환하고, 각 시안을 직접 눌러보세요.
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

        {variant === "editorial" && <EditorialVariant />}
        {variant === "manifesto" && <ManifestoVariant />}
        {variant === "peek" && (
          <div style={{ margin: "0 -24px" }}>
            <FeatureBoxSectionV2 />
          </div>
        )}
      </div>
    </div>
  )
}
