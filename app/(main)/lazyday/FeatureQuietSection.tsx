"use client"

import { useLayoutEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
import styles from "./FeatureQuietSection.module.css"

/**
 * 모임 소개 — 콰이어트 '①+ 페이드 이어 읽기' (운영자 확정 2026-07-06)
 * 원본: preview/feature-designs-quiet 쇼케이스의 개선판 시안 (픽셀 동일 이식).
 * 콰이어트 조판(좁은 단·중앙 정렬·명조·여백) + 본문 두 줄 페이드 컷(궁금증 장치).
 * 본문 조판은 종이책식(음절 줄바꿈+양쪽 정렬, 2026-07-06 확정).
 * 텍스트는 운영자 확정 원고 (2026-07-06 보완본 — verbatim, 임의 수정 금지).
 * 원본: preview/FeatureQuietSection.tsx — 픽셀 동일 이식 (2026-07-06 배포 승인).
 * 프리뷰 쌍과 드리프트 금지. 기존 FeatureBoxSection은 고아 보존.
 */

type Chapter = {
  key: string
  label: string
  /** 챕터 사진 (15e 시안, 2026-07-28) — object-position은 촬영 구도별 지정값 */
  photo: { src: string; position: string }
  paragraphs: ReactNode[]
  note?: string
}

const CHAPTERS: Chapter[] = [
  {
    key: "people",
    label: "타인의 낯선 시선을 기꺼이 환대하는 분들과",
    photo: { src: "/linky-lounge/book-club/feature/feature-people.webp", position: "center 46%" },
    paragraphs: [
      <><strong>문학과 철학, 예술</strong>의 한가운데서, 쉽게 공감하는 대화보다 서로 다른 시선과 부딪히는 순간을 기다리는 사람들이 모입니다. 무색무취한 이야기에 고개만 끄덕이지 않습니다. 서로의 시선이 엇갈리는 순간, 고립되어 있던 내 관점이 타인의 시선에 부딪혀 언제든 깨질 수 있음을 받아들이며 그 순간을 환대합니다.</>,
      <>비슷한 결을 가졌다고 같은 결론에 도달할 필요는 없습니다. 같은 이야기 앞에 멈춰 서도 이어지는 생각은 저마다 엇갈리고, 그 <strong>불협화음</strong> 속에서 우리가 가진 생각의 윤곽은 더 또렷해집니다.</>,
      <>그래서 모든 멤버는 참여에 앞서 <strong>인터뷰</strong>를 진행합니다. 서로의 결을 미리 엿보며, 우리의 대화가 앞으로 어떻게 얽혀 나갈지 함께 가늠해 보는 첫 출발점이 되어 줍니다.</>,
    ],
  },
  {
    key: "books",
    label: "고전 속 인물들의 복잡한 내면을 철학적 시선으로",
    photo: { src: "/linky-lounge/book-club/feature/feature-books.webp", position: "center 52%" },
    paragraphs: [
      <>기수마다 고전 소설과 철학서를 교차하여 읽습니다. 소설 속 인물들이 던진 욕망과 모순에 철학자의 시선을 덧대어 봅니다. 그렇게 벼려진 <strong>철학</strong>이라는 관점으로 <strong>저자의 의도</strong>를, 인물의 욕망을 통해 <strong>인간의 본성</strong>을 파헤쳐 봅니다.</>,
      <>철학이라는 관점을 갖추고 다시 만난 문장은 처음과 전혀 다르게 읽힙니다. 그래서 같은 고전을 읽고도, <strong>대화의 밀도</strong>가 달라집니다.</>,
    ],
  },
  {
    key: "questions",
    label: "질문을 통해 각자가 가진 사유의 궤적을 엿보며",
    photo: { src: "/linky-lounge/book-club/feature/feature-questions.webp", position: "38% center" },
    paragraphs: [
      <>대화는 텍스트의 인용에 단단히 발을 붙인 <strong>발제문</strong>에서 시작됩니다. 단순한 감상을 나누고 흩어지는 자리가 아닙니다. 호스트는 대화의 중심을 지키며 우리가 길을 잃지 않도록 부드럽게 방향을 짚어 줍니다.</>,
      <>&lsquo;저자의 진짜 의도는 무엇인가&rsquo;에서 시작해, 책 속의 화두를 건네며 <strong>사유의 마찰</strong>을 빚어냅니다. 질문은 하나의 정답으로 수렴하기 위한 것이 아니라, 저마다 깊이 감추어 두었던 <strong>사유의 궤적</strong>을 비추어 주는 창이 되어 줍니다.</>,
    ],
  },
  {
    key: "space",
    label: "대화에만 온전히 몰입할 수 있는 공간에서",
    photo: { src: "/linky-lounge/book-club/feature/feature-space.webp", position: "center center" },
    paragraphs: [
      <>모임은 <strong>링키라운지</strong>(사당역 10번 출구 도보 3분)에서 열립니다.</>,
      <>주변의 소음이나 시선에서 벗어나 <strong>온전히 대화에 집중</strong>할 수 있는 아늑한 공간에서, 다과를 곁들이며 여유로운 호흡으로 이야기를 나눕니다.</>,
    ],
    note: "*상황에 따라 장소가 변경될 수 있습니다",
  },
]

function FadeChapter({ c, open, onToggle }: { c: Chapter; open: boolean; onToggle: () => void }) {
  // 실제 콘텐츠 높이를 측정해 정확한 값으로 애니메이션 — 고정 max-height(1200px)로는
  // 열림이 순간처럼 보이고 닫힘은 보이지 않는 구간 때문에 지연돼 보인다 (운영자 지적 2026-07-06)
  const peekRef = useRef<HTMLDivElement>(null)
  const [maxH, setMaxH] = useState<number | undefined>(undefined)
  useLayoutEffect(() => {
    if (open && peekRef.current) setMaxH(peekRef.current.scrollHeight)
    else setMaxH(undefined)
  }, [open])
  return (
    <div className={styles.qtChapter}>
      {/* 챕터 사진 — 풀블리드 190px + 잉크 워시 (15e 시안). 장식이므로 alt 빈 값, 리빌 없음 */}
      <div className={styles.qtPhoto} aria-hidden>
        <Image
          src={c.photo.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 640px, 100vw"
          style={{ objectFit: "cover", objectPosition: c.photo.position }}
        />
        <span className={styles.qtPhotoWash} />
      </div>
      <h3 className={styles.qtLabel}>{c.label}</h3>
      <div
        ref={peekRef}
        className={`${styles.qtPeek} ${open ? styles.qtPeekOpen : ""}`}
        style={maxH !== undefined ? { maxHeight: maxH } : undefined}
        onClick={() => { if (!open) onToggle() }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={e => { if (e.key === "Enter" && !open) onToggle() }}
      >
        <div className={styles.qtBody}>
          {c.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
        </div>
        {c.note && <p className={styles.qtNote}>{c.note}</p>}
        <div className={`${styles.qtPeekFade} ${open ? styles.qtPeekFadeHidden : ""}`} aria-hidden />
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
