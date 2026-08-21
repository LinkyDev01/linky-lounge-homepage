"use client"

/**
 * 상품 상세 공용 컴포넌트 (라운드 10) — 원데이 토크·굿즈가 공유.
 * 레이아웃은 원문 상세 실측: 이미지 스택 1/8 · 텍스트 11/15 · 제목 36px.
 */

import { useEffect, useState } from "react"
import { LazyclubLink } from "./LazyclubLink"
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
  /** href가 있으면 값 줄을 링크로 (문의의 카카오톡 채널 — 라운드 136) */
  fields: { label: string; lines: string[]; href?: string }[]
  price: number | null
  /** 구매하기 목적지 (open일 때만 링크 — soldout/upcoming은 안내) */
  buyHref?: string
  /** buyHref 가 없을 때(=결제 미연동 상품) 구매 버튼이 띄울 안내. 없으면 상태별 기본 문구 */
  buyMessage?: string
  images: { src: string; alt: string }[]
  cartItem: CartItem
  /** 구매 옵션 (2026-08-11) — 색상은 브라운야드 문법(칩), 사이즈는 노아 문법(선택지 나열).
   *  지정 시 선택해야 구매·카트 담기가 진행된다. 옵션은 가격에 영향 없음.
   *  색상에 img 가 있으면 칩 클릭 시 **첫 위치의 사진만 교체**된다 (운영자 2026-08-11
   *  "사진을 1열로 나열하지말고 컬러 클릭할 때만") */
  options?: {
    colors?: { hex: string; name: string; img?: string }[]
    sizes?: string[]
  }
  /** 배송 & 교환/반품 — 브라운야드 "Delievery & Returns" 레이어 문법 (2026-08-12).
   *  구매 버튼 아래 트리거를 누르면 우측에서 슬라이드로 열린다. 굿즈 전용 */
  deliveryReturns?: { label: string; lines: string[] }[]
  /** 워크룸 원본 문법(2026-08-19) — 데스크톱(≥721px)에서 좌측 포스터를 sticky 로 고정하는
   *  모임 상세 전용 그리드. **모임 상세 전체**(호프·브람스·시지프·신규)가 대상 — 굿즈 상세는
   *  절대 전달하지 않는다(픽셀 무변화 보장). centerBody 유무와 무관하게 켠다: 본문 섹션이
   *  없는 모임은 정보 컬럼과 나란히 놓일 뿐 sticky 자체는 동일하게 동작한다. 모바일(≤720px)은
   *  종전 productHero 모바일 값과 픽셀 동일 — 스택 순서만 유지, 별도 처리 불필요 */
  stickyPoster?: boolean
  /** 워크룸 원본 문법(2026-08-19) — 본문을 하단 전폭 섹션의 중앙 460px 컬럼에 렌더한다.
   *  본문이 긴 모임(현재는 신규 모임 하나)에만 준다 — 짧은 설명(호프·브람스·시지프)은 종전대로
   *  우측 요약 컬럼에 남는다. `stickyPoster` 와 별개 축: 이게 있으면 stickyPoster 도 항상 true
   *  여야 한다(본문 섹션은 sticky 그리드 없이는 배치할 자리가 없다). 있을 때 `images` 는 포스터
   *  1장만, `description` 은 보통 빈 배열로 둔다(본문은 이 prop 이 담당) */
  centerBody?: React.ReactNode
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

  // 선택한 색상의 제품컷이 있으면 첫 위치 사진을 그 컷으로 교체 (나열 아님 — 교체)
  const activeColorImg = color ? p.options?.colors?.find((c) => c.name === color)?.img : undefined

  // 노아식 커머스 배치(가격 상단·설명은 버튼 아래)는 **제품 상세**에만 (운영자 2026-08-12
  // "제품 상세 페이지는") — 옵션·배송레이어를 받는 페이지가 제품. 모임 상세는 종전 배치 유지
  const commerce = Boolean(p.options || (p.deliveryReturns && p.deliveryReturns.length > 0))

  // 워크룸 원본 문법(2026-08-19) — sticky 그리드는 "모임 상세 전체"(호프·브람스·시지프·
  // 신규) 공통, 하단 전폭 본문 섹션은 본문이 긴 모임(신규)만. 둘을 별개 변수로 둔다 —
  // 하나로 합쳐 있으면(이전 버그) 신규 모임에만 sticky 가 걸리고 기존 3개 모임은 종전
  // productHero 그대로 남는다. 굿즈 상세는 stickyPoster 를 안 주므로 아래 전부 false.
  const sticky = Boolean(p.stickyPoster)
  const feature = Boolean(p.centerBody)

  // 배송 & 교환/반품 레이어 (브라운야드 문법) — 열려 있으면 배경 스크롤 잠금 + ESC 닫기
  const [shipOpen, setShipOpen] = useState(false)
  useEffect(() => {
    if (!shipOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShipOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [shipOpen])

  return (
    <main className={styles.content}>
      <section
        className={
          sticky
            ? `${styles.nsqHero} ${!feature ? styles.nsqHeroBare : ""}`
            : `${styles.productHero} ${styles.detailHero}`
        }
      >
        <figure
          className={
            sticky
              ? `${styles.nsqFigure} ${feature ? styles.nsqFigureSpan : ""} ${styles.nsqFigureSticky}`
              : styles.productFigure
          }
        >
          {p.images.map((img, i) => (
            <div key={img.src} className={sticky ? undefined : styles.detailImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={i === 0 && activeColorImg ? activeColorImg : img.src}
                alt={i === 0 && activeColorImg ? `${p.title} — ${color}` : img.alt}
              />
              {p.status !== "open" && <StatusOverlay status={p.status} />}
            </div>
          ))}
        </figure>
        <div className={sticky ? styles.nsqInfo : styles.productInfo}>
          <div className={styles.itemCat}>
            {p.category}
            {p.badgeText ? ` · ${p.badgeText}` : ""}
          </div>
          <h1 className={`${styles.productTitle} ${p.sub ? "" : styles.productTitleNoSub}`}>{p.title}</h1>
          {p.sub && <p className={styles.productSub}>{p.sub}</p>}

          {/* 모임(classic): 설명·필드가 종전대로 가격 위에 */}
          {!commerce && (
            <>
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
                  {f.lines.map((line) =>
                    f.href ? (
                      <p key={line}>
                        <a href={f.href} target="_blank" rel="noopener noreferrer">
                          {line}
                        </a>
                      </p>
                    ) : (
                      <p key={line}>{line}</p>
                    ),
                  )}
                </div>
              ))}
            </div>
          )}
            </>
          )}

          {/* 가격 — 브라운야드 문법: 작고 담백하게. commerce 는 옵션 바로 위 (운영자 2026-08-12) */}
          <p className={styles.productPrice}>{p.price != null ? `₩${p.price.toLocaleString()}` : "가격 미정"}</p>

          {/* 색상 옵션 — 노아 문법: 색별 제품컷 썸네일 + 이름·가격 (운영자 2026-08-12).
              목록·미리보기의 원형 칩과 달리 상세에서는 이미지로 고른다 */}
          {needColor && p.options?.colors && (
            <div className={styles.optGroup}>
              <p className={styles.optLabel}>Select Color{color ? ` — ${color}` : ""}</p>
              <ul className={styles.optThumbs}>
                {p.options.colors.map((c) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      aria-pressed={color === c.name}
                      className={`${styles.optThumb} ${color === c.name ? styles.optThumbOn : ""}`}
                      onClick={() => setColor(c.name)}
                    >
                      <span className={styles.optThumbImg} style={c.img ? undefined : { background: c.hex }}>
                        {c.img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.img} alt="" loading="lazy" decoding="async" />
                        )}
                      </span>
                      <span className={styles.optThumbName}>{c.name}</span>
                      {p.price != null && (
                        <span className={styles.optThumbPrice}>₩{p.price.toLocaleString()}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
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
                <LazyclubLink href={buyHrefWithOpts ?? p.buyHref} className={styles.chipBtn}>
                  구매하기
                </LazyclubLink>
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

          {/* ── 구매 버튼 아래 = 상품 설명·기타 안내 (노아 상세 순서, 운영자 2026-08-12).
              commerce(제품)에만 — 모임은 위 classic 블록이 담당 ── */}
          {commerce && (
          <div className={styles.productBelow}>
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
                    {f.lines.map((line) =>
                      f.href ? (
                        <p key={line}>
                          <a href={f.href} target="_blank" rel="noopener noreferrer">
                            {line}
                          </a>
                        </p>
                      ) : (
                        <p key={line}>{line}</p>
                      ),
                    )}
                  </div>
                ))}
              </div>
            )}
            {p.deliveryReturns && p.deliveryReturns.length > 0 && (
              <button type="button" className={styles.shipTrigger} onClick={() => setShipOpen(true)}>
                <span>배송 &amp; 교환/반품</span>
                <svg viewBox="0 0 12 12" aria-hidden className={styles.shipArrow}>
                  <path d="M3 1.5 L8 6 L3 10.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
            )}
          </div>
          )}
        </div>

        {/* 워크룸 원본 문법 — 본문 중앙 460px 컬럼 (2026-08-19). feature 모임 전용.
            ⚠ nsqHero 그리드 "안"의 아이템이어야 한다 — nsqFigure 의 grid-row:1/3 sticky 범위가
            이 섹션까지 걸치려면 같은 그리드 컨테이너를 공유해야 함(밖에 두면 무효화됨) */}
        {feature && (
          <section className={styles.nsqBody}>
            <div className={styles.nsqBodyInner}>{p.centerBody}</div>
          </section>
        )}
      </section>

      {/* 배송 & 교환/반품 레이어 — 브라운야드 실측 이식: 우측 고정 패널이
          right:-600px → 0 으로 transition ease .5s, 뒤에 rgba(0,0,0,.25) 스크림.
          라벨은 좌측 140px 고정(모바일은 블록) (2026-08-12) */}
      {p.deliveryReturns && p.deliveryReturns.length > 0 && (
        <>
          <div
            className={`${styles.shipBack} ${shipOpen ? styles.shipBackOn : ""}`}
            onClick={() => setShipOpen(false)}
            aria-hidden
          />
          <aside
            className={`${styles.shipLayer} ${shipOpen ? styles.shipLayerOn : ""}`}
            aria-hidden={!shipOpen}
          >
            <div className={styles.shipInner}>
              <p className={styles.shipTitle}>
                Delivery &amp; Returns
                <button type="button" className={styles.shipClose} onClick={() => setShipOpen(false)} aria-label="닫기">
                  ✕
                </button>
              </p>
              <div className={styles.shipBoxWrap}>
                <ul>
                  {p.deliveryReturns.map((d) => (
                    <li key={d.label}>
                      <label>{d.label}</label>
                      {d.lines.map((line) => (
                        <span key={line} className={line.startsWith("(") ? styles.shipDim : undefined}>
                          {line}
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </>
      )}
    </main>
  )
}
