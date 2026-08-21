"use client"

/** 기록 페이지 (2026-08-21 개편) — 홈 '기록' 섹션의 후기 캐러셀+모달을 그대로 이식
 *  (운영자 "기록 페이지 들어가면 아무것도 없는데 … 현재 전체보기에 있는 후기를 이식").
 *  컴포넌트는 RecordsCarousel 공용 — 사본 금지. 헤더도 'archive' → '기록'.
 *  구 저장소(비제품 창작물 피드, 라운드 75)는 아래 LegacyArchiveBody 로 보존 — 미렌더 */

import { ARCHIVE_ITEMS } from "../archive-config"
import { ArrowIcon, WorkroomShell } from "../Shell"
import { RecordsCarousel } from "../WorkroomHome"
import styles from "../home.module.css"

export function ArchiveIndex() {
  return (
    <WorkroomShell>
      <ArchiveBody />
    </WorkroomShell>
  )
}

function ArchiveBody() {
  return (
    <main className={styles.content}>
      <div className={styles.indexHead}>
        <div className={styles.sectionTitle}>
          <span>
            <span>기록</span>
            <ArrowIcon />
          </span>
        </div>
      </div>
      {/* 홈 기록 섹션과 같은 풀블리드 래퍼(.books) — 캐러셀 좌우 여백 문법 동일 */}
      <section className={styles.books}>
        <RecordsCarousel />
      </section>
    </main>
  )
}

/** 구 저장소 목록 (라운드 75) — 렌더하지 않음. 비제품 창작물 피드가 살아나면 복원 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyArchiveBody() {
  const items = ARCHIVE_ITEMS
  const itemCount = items.length
  const lastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1)

  return (
    <main className={styles.content}>
      <div className={styles.indexHead}>
        <div className={styles.sectionTitle}>
          <span>
            <span>기록</span>
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
