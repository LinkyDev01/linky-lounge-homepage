"use client"

/** 장바구니 — 로그인 DB 도입 전 로컬 카트 (라운드 10).
 *  2026-08-11: 주문하기 → 결제위젯 체크아웃 연결. 카트 항목 id(`goods-<slug>` /
 *  `meeting-<slug>`)를 주문 코드로 옮겨 담는다 (lib/order-catalog 계약). */

import { LazyclubLink } from "../LazyclubLink"
import { HOME, useToast, WorkroomShell } from "../Shell"
import { useCart } from "../store"
import { meetingOrderCode } from "../one-day-config"
import { goodsCode } from "@/lib/order-catalog"
import { useBasePath } from "@/hooks/use-base-path"
import styles from "../home.module.css"

/** 카트 항목 id → 주문 코드 (+옵션). 결제 불가 항목(마감·가격 미정)은 null.
 *  id 의 #옵션 접미(색상/사이즈)는 코드 뒤에 :옵션 으로 실어 결제 요약·주문명에 쓴다 */
function orderCodeOf(rawId: string): string | null {
  const [id, opt] = rawId.split("#")
  const withOpt = (code: string | null) => (code && opt ? `${code}:${encodeURIComponent(opt)}` : code)
  if (id.startsWith("goods-")) return withOpt(goodsCode(id.slice("goods-".length)))
  // 모임 slug → 회차 코드 — 상세 구매하기와 같은 매핑 (one-day-config.meetingOrderCode)
  if (id.startsWith("meeting-")) return meetingOrderCode(id.slice("meeting-".length))
  return null
}

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
  const base = useBasePath()
  const total = cart.items.reduce((sum, i) => sum + (i.price ?? 0), 0)
  const hasUnpriced = cart.items.some((i) => i.price == null)
  // 결제 가능한 항목만 체크아웃으로 넘긴다 (마감·가격 미정은 서버 검증에서 걸린다)
  const codes = cart.items.map((i) => orderCodeOf(i.id)).filter((c): c is string => c !== null)
  const checkoutHref = `${base}/one-day-talk-01/checkout?items=${codes.join(",")}`

  return (
    <main className={styles.content}>
      <div className={styles.indexHead}>
        <div className={styles.sectionTitle}>
          <span>cart</span>
        </div>
      </div>

      {cart.items.length === 0 ? (
        <p className={styles.emptyNote}>
          카트가 비어 있습니다. <LazyclubLink href={HOME}>홈에서 상품을 둘러보세요.</LazyclubLink>
        </p>
      ) : (
        <div className={styles.cartList}>
          {cart.items.map((i) => (
            <div key={i.id} className={styles.cartRow}>
              {i.img && (
                <LazyclubLink href={i.href} className={styles.cartThumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.img} alt="" />
                </LazyclubLink>
              )}
              <div className={styles.cartInfo}>
                <LazyclubLink href={i.href} className={styles.cartName}>
                  {i.name}
                </LazyclubLink>
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
            {codes.length > 0 ? (
              <a href={checkoutHref} className={styles.chipBtn}>
                주문하기
              </a>
            ) : (
              <button
                type="button"
                className={styles.chipBtn}
                onClick={() => notify("지금 결제할 수 있는 상품이 카트에 없습니다.")}
              >
                주문하기
              </button>
            )}
            <button type="button" className={styles.chipBtn} onClick={() => cart.clear()}>
              비우기
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
