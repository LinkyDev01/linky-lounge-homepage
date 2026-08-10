"use client"

/** 제품(굿즈) 목록 — 모임 목록과 같은 리스트 문법 (라운드 85, 운영자:
 *  "모임과 제품은 각각만 목록화된 페이지야 … 제품 클릭하면 굿즈만 보여야지").
 *  굿즈 3종만 진열 — 기수·모임은 여기 없음. 데이터는 goods-config 단일 출처. */

import { LazydayLink } from "@/components/common/LazydayLink"
import { GOODS } from "../goods-config"
import { ArrowIcon, BASE, SaveIcon, useToast, WorkroomShell } from "../Shell"
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
              {/* 라운드 125 (레퍼런스 brownyard.co.kr 상품 목록):
                  · 상태는 중앙 반투명 블랙박스 대신 **좌상단 라벨 + 이미지 불투명도 저하**
                    (브라운야드 .is-soldout { opacity:.45 } 문법 — 운영자 지정)
                  · 라벨 위치는 뉴 어라이벌·아웃오브스탁 공통 좌상단 */}
              <figure className={`${styles.itemFigure} ${g.status !== "open" ? styles.shopFigDim : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.img} alt={g.name} draggable={false} />
                {/* 좌상단 배지는 coming soon 전용 — soldout 은 브라운야드처럼 정보 행의
                    붉은 OUT OF STOCK 이 맡는다 (라운드 127, 중복 표기 방지) */}
                {g.status === "upcoming" && <span className={styles.shopBadge}>coming soon</span>}
              </figure>
              <div className={styles.itemBody}>
                {/* 정보 행 순서 (라운드 127, 운영자): 상품명 → 컬러 원 → 가격 → 아웃오브스탁 */}
                <div>
                  <div className={styles.shopName}>{g.name}</div>
                  {g.colors.length > 0 && (
                    <div className={styles.colorChips} aria-label="컬러 옵션">
                      {g.colors.map((c) => (
                        <span key={c} className={styles.colorChip} style={{ background: c }} />
                      ))}
                    </div>
                  )}
                  <div className={styles.shopPrice}>{g.price != null ? `₩${g.price.toLocaleString("ko-KR")}` : "Coming Soon"}</div>
                  {g.status === "soldout" && <div className={styles.shopStock}>out of stock</div>}
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
