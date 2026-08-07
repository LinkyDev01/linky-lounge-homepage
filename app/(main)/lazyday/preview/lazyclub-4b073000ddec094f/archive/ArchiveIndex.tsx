"use client"

/** 저장소 — 목록 문법(meetings)을 그대로 쓰되 가격·상태·카트 없이 이미지 + 캡션만.
 *  아직 올린 창작물이 없으면 빈 상태 문구 한 줄 (라운드 75 MVP). */

import { ARCHIVE_ITEMS } from "../archive-config"
import { ArrowIcon, WorkroomShell } from "../Shell"
import styles from "../home.module.css"

export function ArchiveIndex() {
  return (
    <WorkroomShell>
      <ArchiveBody />
    </WorkroomShell>
  )
}

function ArchiveBody() {
  const items = ARCHIVE_ITEMS
  const itemCount = items.length
  const lastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1)

  return (
    <main className={styles.content}>
      <div className={styles.indexHead}>
        <div className={styles.sectionTitle}>
          <span>
            <span>archive</span>
            <ArrowIcon />
          </span>
        </div>
      </div>
      {itemCount === 0 ? (
        <div className={styles.emptyBlock}>아직 쌓인 기록이 없습니다.</div>
      ) : (
        <div className={styles.meetingsList}>
          {items.map((item, idx) => {
            const isLastRow = idx >= lastRowStart
            const isLast = idx === itemCount - 1
            return (
              <article
                key={item.id}
                className={`${styles.item} ${isLastRow ? styles.rowLast : ""} ${isLast ? styles.itemLast : ""}`}
              >
                <figure className={styles.itemFigure}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" draggable={false} />
                </figure>
                <div className={styles.itemBody}>
                  <div>
                    {item.date && <div className={styles.itemCat}>{item.date}</div>}
                    <div className={styles.itemTitle}>{item.caption}</div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
