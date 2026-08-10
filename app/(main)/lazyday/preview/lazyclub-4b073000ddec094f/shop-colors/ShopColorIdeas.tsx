"use client"

/**
 * 제품 컬러 표기 — 발산 시안 6안 (라운드 131, 운영자 "발산적으로 뿜어서").
 * 공통 전제: 컬러는 제품 이미지 **바로 밑** (확정, 실목록에도 반영됨).
 * 여기서는 표현 방식만 발산한다. 전부 머그(5색) 카드 하나로 통일해 비교.
 * 셸(WorkroomShell)을 둘러 lazy-club.com/shop-colors 로 바로 열린다.
 */

import { useState } from "react"
import { WorkroomShell } from "../Shell"
import styles from "./shop-colors.module.css"

const MUG = "/linky-lounge/book-club/home-v3/goods-mug.webp"
const COLORS: Array<{ hex: string; name: string }> = [
  { hex: "#99bbab", name: "민트" },
  { hex: "#c9ad52", name: "옐로" },
  { hex: "#c6a298", name: "핑크" },
  { hex: "#8395a3", name: "블루" },
  { hex: "#5d5f5c", name: "그레이" },
]

function Card({ chips, under, overlay }: { chips?: React.ReactNode; under?: React.ReactNode; overlay?: React.ReactNode }) {
  return (
    <div className={styles.card}>
      <figure className={styles.fig}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MUG} alt="Coffee Mug" draggable={false} />
        {overlay}
      </figure>
      {under}
      {chips}
      <div className={styles.cardName}>Coffee Mug (5-color)</div>
      <div className={styles.cardPrice}>₩999,999</div>
    </div>
  )
}

export function ShopColorIdeas() {
  return (
    <WorkroomShell>
      <main className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.title}>제품 컬러 표기 — 발산 6안</h1>
          <p className={styles.lede}>
            공통 전제: 컬러는 제품 이미지 바로 밑(확정). 표현 방식만 발산했습니다. C·D·E는 만져
            보세요 — 호버(모바일은 탭)에 반응합니다.
          </p>
          <div className={styles.grid}>
            <VariantA />
            <VariantB />
            <VariantC />
            <VariantD />
            <VariantE />
            <VariantF />
          </div>
        </div>
      </main>
    </WorkroomShell>
  )
}

/* A. 도트 — 기준안 (현행) */
function VariantA() {
  return (
    <section className={styles.variant}>
      <h2 className={styles.vName}>A. 도트 — 기준안 (현행 유지)</h2>
      <p className={styles.vDesc}>브라운야드 표준. 정적 원 11px, 왼쪽 정렬. 가장 조용하다.</p>
      <Card
        chips={
          <div className={styles.dots}>
            {COLORS.map((c) => (
              <span key={c.hex} className={styles.dot} style={{ background: c.hex }} />
            ))}
          </div>
        }
      />
    </section>
  )
}

/* B. 이미지 안 종이 라벨 */
function VariantB() {
  return (
    <section className={styles.variant}>
      <h2 className={styles.vName}>B. 종이 라벨 — 이미지를 살짝 문다</h2>
      <p className={styles.vDesc}>
        종이색 사각이 이미지 좌하단을 물고 들어가 그 위에 도트. 이미지와 정보가 한 몸처럼 붙는다.
      </p>
      <Card
        overlay={
          <div className={styles.tray}>
            {COLORS.map((c) => (
              <span key={c.hex} className={styles.dot} style={{ background: c.hex }} />
            ))}
          </div>
        }
      />
    </section>
  )
}

/* C. 색띠 스트립 */
function VariantC() {
  return (
    <section className={styles.variant}>
      <h2 className={styles.vName}>C. 색띠 — 이미지 하단에 붙은 스트립</h2>
      <p className={styles.vDesc}>
        5색이 폭을 균등 분할한 9px 띠. 호버한 구간만 살짝 자란다. 도형을 안 그리고 색 자체가 조판이
        된다.
      </p>
      <Card
        under={
          <div className={styles.strip} aria-label="컬러 옵션">
            {COLORS.map((c) => (
              <span key={c.hex} className={styles.stripSeg} style={{ background: c.hex }} />
            ))}
          </div>
        }
      />
    </section>
  )
}

/* D. 칩 + 이름 잉크 */
function VariantD() {
  const [name, setName] = useState<string | null>(null)
  return (
    <section className={styles.variant}>
      <h2 className={styles.vName}>D. 칩 + 이름 — 만지면 이름을 말한다</h2>
      <p className={styles.vDesc}>
        평소엔 A와 동일. 호버·탭한 색의 이름이 옆에 잉크로 스윽. 정보는 요구한 사람에게만 (발견형).
      </p>
      <Card
        chips={
          <div className={styles.named}>
            {COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                className={`${styles.dot} ${styles.namedDot}`}
                style={{ background: c.hex }}
                aria-label={c.name}
                onPointerEnter={() => setName(c.name)}
                onPointerLeave={() => setName(null)}
                onClick={() => setName(c.name)}
              />
            ))}
            <span className={`${styles.namedLabel} ${name ? styles.namedLabelOn : ""}`}>{name ?? " "}</span>
          </div>
        }
      />
    </section>
  )
}

/* E. 셀렉터 — 커머스 대비 */
function VariantE() {
  const [sel, setSel] = useState(1)
  return (
    <section className={styles.variant}>
      <h2 className={styles.vName}>E. 셀렉터 — 커머스로 가는 다리</h2>
      <p className={styles.vDesc}>
        클릭한 색에 잉크 링, 카드 밑줄이 그 색으로 물든다. 지금은 표기, 판매 열리면 그대로 옵션
        선택기가 된다.
      </p>
      <Card
        chips={
          <>
            <div className={styles.selRow} role="radiogroup" aria-label="컬러 선택">
              {COLORS.map((c, i) => (
                <button
                  key={c.hex}
                  type="button"
                  role="radio"
                  aria-checked={sel === i}
                  aria-label={c.name}
                  className={`${styles.selDot} ${sel === i ? styles.selDotOn : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => setSel(i)}
                />
              ))}
            </div>
            <div className={styles.selUnderline} style={{ background: COLORS[sel].hex }} />
          </>
        }
      />
    </section>
  )
}

/* F. 물감 견본 */
function VariantF() {
  return (
    <section className={styles.variant}>
      <h2 className={styles.vName}>F. 물감 견본 — 손으로 칠한 자국</h2>
      <p className={styles.vDesc}>
        정원(正圓) 대신 살짝 비뚤어진 견본 조각. I ♥ LAZYDAY 손그림 결과 어울리는 유일한 비정형.
      </p>
      <Card
        chips={
          <div className={styles.swatches} aria-label="컬러 옵션">
            {COLORS.map((c) => (
              <span key={c.hex} className={styles.swatch} style={{ background: c.hex }} />
            ))}
          </div>
        }
      />
    </section>
  )
}
