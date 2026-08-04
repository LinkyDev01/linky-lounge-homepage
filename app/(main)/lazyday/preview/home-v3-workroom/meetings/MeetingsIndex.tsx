"use client"

/** 원데이 토크 목록 — 홈 리스트 문법 재사용 + 카테고리 필터 (워크룸 아카이브 대응) */

import { useState } from "react"
import { LazydayLink } from "@/components/common/LazydayLink"
import { ONE_DAY_MEETINGS } from "../one-day-config"
import { LANDING_DOCS, PAST_SEASONS } from "../WorkroomHome"
import { ArrowIcon, BASE, SaveIcon, StatusOverlay, useToast, WorkroomShell } from "../Shell"
import { useSaved } from "../store"
import styles from "../home.module.css"

const CATEGORIES = ["전체", "booktalk", "documents", "bookclub"] as const

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
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("전체")

  const badge = (status: string) => (status === "open" ? "모집중" : status === "soldout" ? "마감" : "오픈 예정")
  const all = [
    ...ONE_DAY_MEETINGS.map((m) => ({
      id: `meeting-${m.slug}`,
      category: m.category as string,
      badgeText: badge(m.status),
      status: m.status,
      title: m.title,
      meta: m.date,
      link: `${BASE}/meetings/${m.slug}`,
      thumbnail: m.thumbnail,
    })),
    ...LANDING_DOCS.map((d) => ({ id: `doc-${d.meta}`, status: "open" as const, badgeText: "", ...d })),
    ...PAST_SEASONS,
  ]
  const items = filter === "전체" ? all : all.filter((i) => i.category === filter)
  const itemCount = items.length
  const lastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1)

  return (
    <main className={styles.content}>
      <div className={styles.indexHead}>
        <div className={styles.sectionTitle}>
          <span>
            <span>meetings</span>
            <ArrowIcon />
          </span>
        </div>
        {/* 카테고리 필터 — 원문 아카이브 필터 대응(텍스트 링크 문법) */}
        <div className={styles.filterRow}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.filterBtn} ${filter === c ? styles.filterBtnActive : ""}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
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
                  <div className={styles.itemCat}>
                    {m.category}
                    {m.badgeText ? ` · ${m.badgeText}` : ""}
                  </div>
                  <div className={styles.itemTitle}>{m.title}</div>
                </div>
                <div className={styles.itemBottom}>
                  {m.meta && <div className={styles.itemDate}>{m.meta}</div>}
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
      {items.length === 0 && <p className={styles.emptyNote}>해당 분류의 항목이 아직 없습니다.</p>}
    </main>
  )
}
