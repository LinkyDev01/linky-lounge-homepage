"use client"

/** 원데이 토크 목록 — 홈 리스트 문법 재사용.
 *  라운드 39 (운영자): 두 상품(시지프·브람스)만 진열 — 시지프(모집중)를 맨 위,
 *  브람스는 sold out. 랜딩 콘텐츠·지난 기수·카테고리 필터는 목록에서 제외
 *  (지난 기수 진열은 홈 하단 '레이지데이 북클럽' 섹션이 담당). */

import { LazydayLink } from "@/components/common/LazydayLink"
import { ONE_DAY_MEETINGS } from "../one-day-config"
import { ArrowIcon, BASE, SaveIcon, StatusOverlay, useToast, WorkroomShell } from "../Shell"
import { useSaved } from "../store"
import styles from "../home.module.css"

export function MeetingsIndex() {
  return (
    <WorkroomShell>
      <IndexBody />
    </WorkroomShell>
  )
}

function IndexBody() {
  const { notify } = useToast()
  const saved = useSaved()

  // 모집중(시지프) 먼저 → sold out(브람스)
  const items = [...ONE_DAY_MEETINGS]
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1))
    .map((m) => ({
      id: `meeting-${m.slug}`,
      category: m.catLabel, // 원데이토크 통일 / 개별 모임장은 이름 (운영자 2026-08-21)
      status: m.status,
      title: m.title,
      link: `${BASE}/meetings/${m.slug}`,
      thumbnail: m.thumbnail,
    }))
  const itemCount = items.length
  const lastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1)

  return (
    <main className={styles.content}>
      <div className={styles.indexHead}>
        <div className={styles.sectionTitle}>
          <span>
            <span>모임</span>
            <ArrowIcon />
          </span>
        </div>
      </div>
      <div className={styles.meetingsList}>
        {items.map((m, idx) => {
          const isLastRow = idx >= lastRowStart
          const isLast = idx === itemCount - 1
          return (
            <article
              key={m.id}
              className={`${styles.item} ${isLastRow ? styles.rowLast : ""} ${isLast ? styles.itemLast : ""}`}
            >
              <LazydayLink href={m.link} className={styles.itemLink} aria-label={`${m.title} 안내로 이동`} />
              {m.thumbnail && (
                <figure className={styles.itemFigure}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.thumbnail} alt="" draggable={false} />
                  {m.status !== "open" && <StatusOverlay status={m.status} />}
                </figure>
              )}
              <div className={styles.itemBody}>
                <div>
                  <div className={styles.itemCat}>{m.category}</div>
                  <div className={styles.itemTitle}>{m.title}</div>
                </div>
                <div className={styles.itemBottom}>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    aria-label={`${m.title} 저장`}
                    onClick={() => notify(saved.toggle(m.id) ? "저장했습니다." : "저장을 해제했습니다.")}
                  >
                    <SaveIcon filled={saved.has(m.id)} />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
