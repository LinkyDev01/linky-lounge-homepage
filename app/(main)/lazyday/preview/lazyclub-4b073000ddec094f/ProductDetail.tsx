"use client"

/**
 * 상품 상세 공용 컴포넌트 (라운드 10) — 원데이 토크·굿즈가 공유.
 * 레이아웃은 원문 상세 실측: 이미지 스택 1/8 · 텍스트 11/15 · 제목 36px.
 */

import { useState } from "react"
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
  /** buyHref 가 없을 때(=결제 미연동 상품) 구매 버튼이 띄울 안내. 없으면 상태별 기본 문구 */
  buyMessage?: string
  images: { src: string; alt: string }[]
  cartItem: CartItem
  /** 구매 옵션 (2026-08-11) — 색상은 브라운야드 문법(칩), 사이즈는 노아 문법(선택지 나열).
   *  지정 시 선택해야 구매·카트 담기가 진행된다. 옵션은 가격에 영향 없음 */
  options?: {
    colors?: { hex: string; name: string }[]
    sizes?: string[]
  }
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

  // 옵션 선택 상태 — 색상(브라운야드 칩) / 사이즈(노아 선택지)
  const [color, setColor] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const needColor = (p.options?.colors?.length ?? 0) > 1 // 단일 색은 자동 확정
  const needSize = (p.options?.sizes?.length ?? 0) > 0
  const optionParts = [
    needColor ? color : p.options?.colors?.[0]?.name ?? null,
    needSize ? size : null,
  ].filter(Boolean) as string[]
  const optionLabel = optionParts.join("/")
  const optionsReady = (!needColor || color !== null) && (!needSize || size !== null)

  /** 옵션 미선택 시 구매·카트를 막고 안내 (브라운야드 필수 옵션 문법) */
  function requireOptions(): boolean {
    if (optionsReady) return true
    notify(needColor && color === null ? "색상을 선택해주세요." : "사이즈를 선택해주세요.")
    return false
  }

  /** 옵션이 붙은 구매 링크 — 체크아웃 items 항목에 :옵션 으로 실린다 */
  const buyHrefWithOpts =
    p.buyHref && optionLabel
      ? p.buyHref.replace(/(items=[^&]+)/, (m) => `${m}:${encodeURIComponent(optionLabel)}`)
      : p.buyHref

  const buyMsg =
    p.status === "soldout"
      ? "마감된 모임입니다."
      : p.status === "upcoming"
      ? "오픈 예정입니다. 발매 알림은 준비 중입니다."
      : p.buyMessage ?? null

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

          {/* 옵션 — 색상: 브라운야드 칩 문법 / 사이즈: 노아 선택지 문법 (운영자 2026-08-11) */}
          {needColor && p.options?.colors && (
            <div className={styles.optGroup}>
              <p className={styles.optLabel}>색상{color ? ` — ${color}` : ""}</p>
              <div className={styles.optChips}>
                {p.options.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={c.name}
                    aria-pressed={color === c.name}
                    className={`${styles.optChip} ${color === c.name ? styles.optChipOn : ""}`}
                    style={{ background: c.hex }}
                    onClick={() => setColor(c.name)}
                  />
                ))}
              </div>
            </div>
          )}
          {needSize && p.options?.sizes && (
            <div className={styles.optGroup}>
              <p className={styles.optLabel}>사이즈</p>
              <div className={styles.optSizes}>
                {p.options.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    aria-pressed={size === sz}
                    className={`${styles.optSize} ${size === sz ? styles.optSizeOn : ""}`}
                    onClick={() => setSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.productActions}>
            {p.status === "open" && p.buyHref ? (
              optionsReady ? (
                <LazydayLink href={buyHrefWithOpts ?? p.buyHref} className={styles.chipBtn}>
                  구매하기
                </LazydayLink>
              ) : (
                <button type="button" className={styles.chipBtn} onClick={requireOptions}>
                  구매하기
                </button>
              )
            ) : (
              <button type="button" className={styles.chipBtn} onClick={() => notify(buyMsg ?? undefined)}>
                구매하기
              </button>
            )}
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => {
                if (!requireOptions()) return
                // 옵션이 다르면 다른 카트 항목 — id 에 #옵션 접미 (주문 코드 변환 시 # 앞만 사용)
                const item = optionLabel
                  ? { ...p.cartItem, id: `${p.cartItem.id}#${optionLabel}`, name: `${p.cartItem.name} (${optionLabel})` }
                  : p.cartItem
                notify(cart.add(item) ? "카트에 담았습니다." : "이미 카트에 담겨 있습니다.")
              }}
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
