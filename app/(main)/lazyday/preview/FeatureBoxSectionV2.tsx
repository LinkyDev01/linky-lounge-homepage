"use client"

import { useLayoutEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import styles from "../FeatureBoxSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"

/**
 * 모임 소개 — 상호작용은 '페이드 + ...더보기' 형태 유지 (운영자 결정 2026-07-03)
 * 개선 제안 (2026-07-03 재검토): 접힘 높이를 고정 54px → '첫 문단 전체 +
 * 다음 문단 슬리버'로 카드별 측정. 훑기만 해도 각 카드의 요지(첫 문단)가
 * 온전히 읽히고, 페이드는 문장 중간이 아닌 문단 경계 뒤에서 시작된다.
 * 텍스트는 운영자 전달 원고(2026-07-03)로 교체, '불균형의 균형' 카드는
 * 첫 카드에 요지가 흡수되어 제외.
 */
const items: { label: ReactNode; paragraphs: ReactNode[]; note?: string }[] = [
  {
    label: <><span className={styles.accent}>이런 분들</span>과 함께해요</>,
    paragraphs: [
      <>쉽게 공감하는 대화보다 <span className={styles.accent}>문학·철학·예술</span> 안에서 낯선 시각과 부딪히는 순간을 기다리는 멤버들과 함께합니다. 무색무취한 이야기에 고개만 끄덕이는 자리가 아니라, 각자의 결이 다른 곳에서 팽팽하게 대립하는 자리입니다.</>,
      <>비슷한 결을 가졌다고 같은 결론에 도달할 필요는 없습니다. 같은 문장 앞에서 멈춰 서도, 거기서 이어지는 생각은 저마다 다릅니다. 그 <span className={styles.accent}>불협화음</span> 속에서 내 이야기는 비로소 또렷해집니다.</>,
      <>그렇기에 모든 멤버는 참여 전, <span className={styles.accent}>인터뷰</span>를 통해 서로의 결을 확인합니다. 모임이 궁금하다면, 대화의 결이 맞을지 확인하는 인터뷰부터 시작해 보세요.</>,
    ],
  },
  {
    label: <><span className={styles.accent}>철학과 고전</span>을 함께 읽어요</>,
    paragraphs: [
      <>기수별 텍스트는 철학서와 고전 소설을 교차하여 읽는 구조로 구성됩니다. 철학자의 시선으로 내 생각을 꺼내놓을 <span className={styles.accent}>생각의 도구</span>를 먼저 갖추고, 그 확장된 시선으로 고전 속 <span className={styles.accent}>저자의 의도</span>를 정직하게 들여다봅니다.</>,
      <>도구를 갖추고 다시 마주하는 문장은 때로 전혀 다른 무게로 다가옵니다. 우리가 같은 고전을 읽으면서도 한층 더 <span className={styles.accent}>밀도 높은 대화</span>를 나눌 수 있는 이유입니다.</>,
    ],
  },
  {
    label: <><span className={styles.accent}>사유의 밀도</span>를 높일 질문을 던져요</>,
    paragraphs: [
      <>단순한 독후감이나 일상적인 썰을 나누는 자리가 아닙니다. 레이지데이가 텍스트에 발을 붙여 정교하게 준비한 <span className={styles.accent}>발제문</span>으로 대화가 시작되고, 호스트는 그 흐름 속에서 <span className={styles.accent}>사유의 축</span>이 무너지지 않도록 이끕니다.</>,
      <>&lsquo;이 문장에서 <span className={styles.accent}>저자의 진짜 의도</span>는 무엇인가&rsquo;에서 출발하여 &lsquo;그 사실이 나의 어떤 이야기와 맞닿아 있는가&rsquo;로 수렴하는 구조입니다. 질문은 정답을 내기 위함이 아니라, 각자의 삶을 향한 <span className={styles.accent}>정직한 고백</span>을 이끌어내기 위한 도구일 뿐입니다.</>,
    ],
  },
  {
    label: <><span className={styles.accent}>생각이 무르익는 공간</span>에서 모여요</>,
    paragraphs: [
      <>레이지데이가 직접 관리하고 운영하는 약 30평 규모의 공간, 링키라운지(<span className={styles.accent}>사당역 10번 출구</span> 도보 3분)에서 진행합니다.</>,
      <>상업 공간의 소음이나 낯선 시선에서 벗어나, 오롯이 텍스트와 서로의 대화에만 <span className={styles.accent}>온전히 몰입할 수 있는 정갈한 환경</span>입니다. 준비된 다과와 함께, 느긋하게 생각이 무르익는 시간을 감각해 보세요.</>,
    ],
    note: "*상황에 따라 장소가 변경될 수 있습니다",
  },
]

// 접힘 상태에서 첫 문단 아래로 보여줄 다음 문단 슬리버 높이(px).
// 페이드(36px)가 슬리버를 덮어 '아래 더 있다'는 신호만 남긴다.
const PEEK_SLIVER = 34

export function FeatureBoxSectionV2() {
  // 첫 카드는 기본 펼침 — 스크롤만 하는 사용자도 핵심 가치를 바로 읽도록
  const [openSet, setOpenSet] = useState<Set<number>>(new Set([0]))
  const firstPRefs = useRef<(HTMLParagraphElement | null)[]>([])
  // 카드별 접힘 높이 = 첫 문단 전체 높이 + 슬리버 (문장 중간에서 잘리지 않게)
  const [peekHeights, setPeekHeights] = useState<number[]>([])

  useLayoutEffect(() => {
    const measure = () => {
      setPeekHeights(firstPRefs.current.map(p => (p ? p.offsetHeight + PEEK_SLIVER : 0)))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  const toggle = (i: number) => {
    setOpenSet(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <section id="feature" className={styles.section}>
      <div className={styles.inner}>
        <FadeUp>
          <div className={styles.titleRow}>
            <h2 className={styles.sectionTitle}>모임 소개</h2>
          </div>
        </FadeUp>
        <div className={styles.list}>
          {items.map((item, i) => {
            const isOpen = openSet.has(i)
            return (
              <div key={i} className={styles.item}>
                <button
                  type="button"
                  className={styles.titleBox}
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.label}>{item.label}</span>
                  <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}>▾</span>
                </button>
                <div
                  className={styles.quote}
                  onClick={() => toggle(i)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onKeyDown={e => e.key === "Enter" && toggle(i)}
                  style={{ cursor: isOpen ? "default" : "pointer" }}
                >
                  <div
                    className={`${styles.peekWrap} ${isOpen ? styles.peekOpen : ""}`}
                    style={!isOpen && peekHeights[i] ? { maxHeight: peekHeights[i] } : undefined}
                  >
                    {item.paragraphs.map((p, j) => (
                      <p
                        key={j}
                        className={styles.desc}
                        ref={j === 0 ? el => { firstPRefs.current[i] = el } : undefined}
                      >
                        {p}
                      </p>
                    ))}
                    {!isOpen && (
                      <div className={styles.fadeWrap}>
                        <div className={styles.fadeBg} />
                      </div>
                    )}
                  </div>
                  {!isOpen && <span className={styles.moreHint}>...더보기</span>}
                  {isOpen && item.note && <p className={styles.note}>{item.note}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
