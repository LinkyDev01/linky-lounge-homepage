"use client"

/** 장바구니 — 로그인 DB 도입 전 로컬 카트 (라운드 10). 주문은 결제 연동 전 안내. */

import { LazydayLink } from "@/components/common/LazydayLink"
import { BASE, useToast, WorkroomShell } from "../Shell"
import { useCart } from "../store"
import styles from "../home.module.css"

export function CartView() {
  return (
    <WorkroomShell>
      <CartBody />
    </WorkroomShell>
  )
}

function CartBody() {
  const { notify } = useToast()
  const cart = useCart()
  const total = cart.items.reduce((sum, i) => sum + (i.price ?? 0), 0)
  const hasUnpriced = cart.items.some((i) => i.price == null)

  return (
    <main className={styles.content}>
      <div className={styles.indexHead}>
        <div className={styles.sectionTitle}>
          <span>cart</span>
        </div>
      </div>

      {cart.items.length === 0 ? (
        <p className={styles.emptyNote}>
          카트가 비어 있습니다. <LazydayLink href={BASE}>홈에서 상품을 둘러보세요.</LazydayLink>
        </p>
      ) : (
        <div className={styles.cartList}>
          {cart.items.map((i) => (
            <div key={i.id} className={styles.cartRow}>
              {i.img && (
                <LazydayLink href={i.href} className={styles.cartThumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.img} alt="" />
                </LazydayLink>
              )}
              <div className={styles.cartInfo}>
                <LazydayLink href={i.href} className={styles.cartName}>
                  {i.name}
                </LazydayLink>
                <p className={styles.cartPrice}>{i.price != null ? `₩${i.price.toLocaleString()}` : "가격 미정"}</p>
              </div>
              <button type="button" className={styles.cartRemove} onClick={() => cart.remove(i.id)}>
                제거
              </button>
            </div>
          ))}
          <div className={styles.cartTotalRow}>
            <span>합계{hasUnpriced ? " (가격 미정 제외)" : ""}</span>
            <strong>₩{total.toLocaleString()}</strong>
          </div>
          <div className={styles.productActions}>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() =>
                notify("결제 연동은 준비 중입니다. 원데이 토크는 상품 페이지의 '구매하기'에서 바로 접수할 수 있습니다.")
              }
            >
              주문하기
            </button>
            <button type="button" className={styles.chipBtn} onClick={() => cart.clear()}>
              비우기
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
