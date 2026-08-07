"use client"

/** 제품(굿즈) 목록 — 모임 목록과 같은 리스트 문법 (라운드 85, 운영자:
 *  "모임과 제품은 각각만 목록화된 페이지야 … 제품 클릭하면 굿즈만 보여야지").
 *  굿즈 3종만 진열 — 기수·모임은 여기 없음. 데이터는 goods-config 단일 출처. */

import { LazydayLink } from "@/components/common/LazydayLink"
import { GOODS } from "../goods-config"
import { ArrowIcon, BASE, SaveIcon, StatusOverlay, useToast, WorkroomShell } from "../Shell"
import { useSaved } from "../store"
import styles from "../home.module.css"

export function ShopIndex() {
  return (
    <WorkroomShell>
      <IndexBody />
    </WorkroomShell>
  )
}

function IndexBody() {
  const { notify } = useToast()
  const saved = useSaved()

  const itemCount = GOODS.length
  const lastRowStart = itemCount - (itemCount % 2 === 0 ? 2 : 1)

  return (
    <main className={styles.content}>
      <div className={styles.indexHead}>
        <div className={styles.sectionTitle}>
          <span>
            <span>shop</span>
            <ArrowIcon />
          </span>
        </div>
      </div>
      <div className={styles.meetingsList}>
        {GOODS.map((g, idx) => {
          const isLastRow = idx >= lastRowStart
          const isLast = idx === itemCount - 1
          const id = `goods-${g.slug}`
          return (
            <article
              key={g.slug}
              className={`${styles.item} ${isLastRow ? styles.rowLast : ""} ${isLast ? styles.itemLast : ""}`}
            >
              <LazydayLink href={`${BASE}/shop/${g.slug}`} className={styles.itemLink} aria-label={`${g.name} 상세로 이동`} />
              <figure className={styles.itemFigure}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.img} alt={g.name} draggable={false} />
                {g.status !== "open" && <StatusOverlay status={g.status} />}
              </figure>
              <div className={styles.itemBody}>
                <div>
                  <div className={styles.itemCat}>{g.cat}</div>
                  <div className={styles.shopName}>{g.name}</div>
                </div>
                <div className={styles.itemBottom}>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    aria-label={`${g.name} 저장`}
                    onClick={() => notify(saved.toggle(id) ? "저장했습니다." : "저장을 해제했습니다.")}
                  >
                    <SaveIcon filled={saved.has(id)} />
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
