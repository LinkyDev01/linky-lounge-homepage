"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import styles from "./FeatureQuietSection.module.css"

/**
 * 모임 소개 — 콰이어트 '①+ 페이드 이어 읽기' (운영자 확정 2026-07-06)
 * 원본: preview/feature-designs-quiet 쇼케이스의 개선판 시안 (픽셀 동일 이식).
 * 콰이어트 조판(좁은 단·중앙 정렬·명조·여백) + 본문 두 줄 페이드 컷(궁금증 장치).
 * 본문 조판은 종이책식(음절 줄바꿈+양쪽 정렬, 2026-07-06 확정).
 * 텍스트는 확정 신규 원고 — 운영자 보완 원고 대기 중 (DECISIONS.md).
 * 기존 FeatureBoxSectionV2는 비교용으로 보존 (렌더에서만 교체).
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

function FadeChapter({ c, open, onToggle }: { c: Chapter; open: boolean; onToggle: () => void }) {
  return (
    <div className={styles.qtChapter}>
      <p className={styles.qtEyebrow}>{c.eyebrow}</p>
      <h3 className={styles.qtLabel}>{c.label}</h3>
      <p className={styles.qtPull}>{c.pull}</p>
      <div
        className={`${styles.qtPeek} ${open ? styles.qtPeekOpen : ""}`}
        onClick={() => { if (!open) onToggle() }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={e => { if (e.key === "Enter" && !open) onToggle() }}
      >
        <div className={styles.qtBody}>
          {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
        </div>
        {c.note && open && <p className={styles.qtNote}>{c.note}</p>}
        {!open && <div className={styles.qtPeekFade} aria-hidden />}
      </div>
      <button className={styles.qtMore} onClick={onToggle} aria-expanded={open}>
        {open ? "접기" : "이어 읽기"}
      </button>
    </div>
  )
}

export function FeatureQuietSection() {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })

  return (
    <section id="feature" className={styles.section}>
      <h2 className={styles.qtTitle}>모임 소개</h2>
      {CHAPTERS.map((c, i) => (
        <div key={c.key}>
          <FadeChapter c={c} open={open.has(c.key)} onToggle={() => toggle(c.key)} />
          {i < CHAPTERS.length - 1 && <div className={styles.qtDivider} aria-hidden>·</div>}
        </div>
      ))}
    </section>
  )
}
