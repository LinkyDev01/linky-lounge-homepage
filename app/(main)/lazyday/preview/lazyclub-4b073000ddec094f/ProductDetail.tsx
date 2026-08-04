"use client"

/**
 * 상품 상세 공용 컴포넌트 (라운드 10) — 원데이 토크·굿즈가 공유.
 * 레이아웃은 원문 상세 실측: 이미지 스택 1/8 · 텍스트 11/15 · 제목 36px.
 */

import { LazydayLink } from "@/components/common/LazydayLink"
import { SaveIcon, StatusOverlay, useToast, WorkroomShell } from "./Shell"
import { useCart, useSaved, type CartItem } from "./store"
import styles from "./home.module.css"

export type DetailProps = {
  id: string
  category: string
  badgeText?: string
  status: "open" | "soldout" | "upcoming"
  title: string
  sub?: string
  description: string[]
  fields: { label: string; lines: string[] }[]
  price: number | null
  /** 구매하기 목적지 (open일 때만 링크 — soldout/upcoming은 안내) */
  buyHref?: string
  images: { src: string; alt: string }[]
  cartItem: CartItem
}

export function ProductDetail(props: DetailProps) {
  return (
    <WorkroomShell>
      <DetailBody {...props} />
    </WorkroomShell>
  )
}

function DetailBody(p: DetailProps) {
  const { notify } = useToast()
  const cart = useCart()
  const saved = useSaved()

  const buyMsg =
    p.status === "soldout" ? "마감된 모임입니다." : p.status === "upcoming" ? "오픈 예정입니다. 발매 알림은 준비 중입니다." : null

  return (
    <main className={styles.content}>
      <section className={`${styles.productHero} ${styles.detailHero}`}>
        <figure className={styles.productFigure}>
          {p.images.map((img) => (
            <div key={img.src} className={styles.detailImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} />
              {p.status !== "open" && <StatusOverlay status={p.status} />}
            </div>
          ))}
        </figure>
        <div className={styles.productInfo}>
          <div className={styles.itemCat}>
            {p.category}
            {p.badgeText ? ` · ${p.badgeText}` : ""}
          </div>
          <h1 className={styles.productTitle}>{p.title}</h1>
          {p.sub && <p className={styles.productSub}>{p.sub}</p>}
          <div className={styles.productDesc}>
            {p.description.map((para) => (
              <p key={para.slice(0, 20)}>{para}</p>
            ))}
          </div>
          {p.fields.length > 0 && (
            <div className={styles.productFields}>
              {p.fields.map((f) => (
                <div key={f.label} className={styles.productField}>
                  <p>{f.label}</p>
                  {f.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
          <p className={styles.productPrice}>{p.price != null ? `₩${p.price.toLocaleString()}` : "가격 미정"}</p>
          <div className={styles.productActions}>
            {p.status === "open" && p.buyHref ? (
              <LazydayLink href={p.buyHref} className={styles.chipBtn}>
                구매하기
              </LazydayLink>
            ) : (
              <button type="button" className={styles.chipBtn} onClick={() => notify(buyMsg ?? undefined)}>
                구매하기
              </button>
            )}
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => notify(cart.add(p.cartItem) ? "카트에 담았습니다." : "이미 카트에 담겨 있습니다.")}
            >
              카트 담기
            </button>
          </div>
          <button
            type="button"
            className={styles.saveBtn}
            aria-label="저장"
            onClick={() => notify(saved.toggle(p.id) ? "저장했습니다." : "저장을 해제했습니다.")}
          >
            <SaveIcon filled={saved.has(p.id)} />
          </button>
        </div>
      </section>
    </main>
  )
}
