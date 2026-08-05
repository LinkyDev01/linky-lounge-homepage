"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import styles from "./poster-designs.module.css"

/**
 * 레이지데이 북클럽 4기 포스터 디자인 시안 쇼케이스 — 5가지 방향.
 * 레퍼런스: 슬기와 민(sulki-min.com) 포스터 9종 (운영자 제공 링크, 2026-08-05).
 * 각 시안은 서로 다른 레퍼런스의 조형 원리를 가져와 A1(594×841) 비율 캔버스에 구현.
 * 실사이트 미반영 — 프리뷰 전용 제안. 채택 시 인쇄용 원본 제작은 별도 단계.
 */

// ── 텍스트 데이터 (운영자 제공 원문 — 임의 수정 금지) ──────────
const TITLE = "레이지데이 북클럽 4기"

const MANIFESTO = [
  "얄팍한 사교와 지적 허영 사이에서 길을 잃은 시중의 모임들엔 여전히 환멸을 느낀다. 그렇다고 내 안의 관성과 경험이라는 좁은 필터 속만 맴돌기엔, 세상과 텍스트가 가진 깊이가 너무도 아득하다. 차라리 고립을 택하겠다던 오기는 결코 틀리지 않았지만, 타인의 단단한 사유를 통해 내 생각의 맹점을 깨뜨리고 싶다는 갈증마저 속일 수는 없었다.",
  "내가 바란 건 거창한 지식을 겨루는 과시의 장도, 적당한 매너로 서로를 우두망찰 다독이는 사교장도 아니다. 그저 텍스트라는 정교한 지도를 나침반 삼아, 저마다의 삶에서 정직하게 길어 올린 생각의 결들이 치열하게 부딪히는 그런 밀도 높은 공간이었다.",
  "서재의 깊이와 삶의 태도가 맞물려 일어나는 묵직한 진동. 문장 사이에 숨은 맥락을 읽어내고, 눈빛만으로도 논점이 공유되는 그런 단단한 공명. 결국 내 기준이 높았던 게 아니라, 내 사유가 온전히 뿌리내릴 제대로 된 장소를 찾지 못해 길 위에서 서성였을 뿐이다.",
]

const BOOKS = [
  { no: "1회차", title: "『변신』", author: "프란츠 카프카" },
  { no: "2회차", title: "『피로사회』", author: "한병철" },
  { no: "3회차", title: "『인간 실격』", author: "다자이 오사무" },
  { no: "4회차", title: "『사람, 장소, 환대』", author: "김현경" },
  { no: "5회차", title: "자유 독서모임", author: "" },
]
const PERIOD = "'26.09.07–'26.11.01 (격주, 5회)"
const PLACE = "사당역 링키라운지"

// ── 시안 메타 ───────────────────────────────────────────────
const VARIANTS = [
  {
    id: "specimen",
    name: "A. 활자 견본",
    ref: "레퍼런스: 쓔이써60 (2023) — 활자 견본 포스터",
    desc: "제목 한 줄을 크기의 사다리로 반복하는 스펙시멘(활자 견본) 문법. 이미지 없이 제목 자체가 형태이자 내용이 됩니다. 하단에 도서·일정을 조판 명세처럼 정리한 가장 단정하고 실용적인 안.",
  },
  {
    id: "multiples",
    name: "B. 남는 글자들",
    ref: "레퍼런스: 클래식 멀티플즈 (2010) + 초특태고딕 (2015)의 결락",
    desc: "제목 열 글자를 줄마다 한 글자씩 지워 나가는 체계적 소거. 빈칸이 오히려 골격이 되어 전체를 하나의 세트로 묶습니다. '같은 책도 기수마다, 사람마다 다르게 읽힌다'는 은유. 글자가 빠진 자리는 초특태고딕 포스터의 결락처럼 침묵으로 남습니다.",
  },
  {
    id: "mirror",
    name: "C. 마주 보기",
    ref: "레퍼런스: 한반도 오감도 (2014) + 호모 파베르 (2019)의 대칭",
    desc: "숫자 격자와 대각선 축, 그리고 180° 점대칭으로 마주 놓인 두 개의 제목. '타인의 사유를 통해 나를 비춘다'는 원고의 핵심을 서로를 비추는 거울 구조로 옮겼습니다. 대각선의 점은 격주 5회의 시간이 지나가는 궤적.",
  },
  {
    id: "manifesto",
    name: "D. 본문이 곧 포스터 (추천)",
    ref: "레퍼런스: 오민 퍼포먼스 포스터 (2018)",
    desc: "크레딧 목록을 제목 삼은 오민 포스터의 문법을 뒤집어, 운영자 원고 전문을 화면 전체에 깔고 그 안에서 제목 음절(레·이·지·데·북·클·럽·기)만 주황으로 표시했습니다. 제목이 본문 속 우연한 리듬으로 떠오릅니다 — 읽는 사람만 발견하는 포스터. 텍스트가 곧 브랜드인 레이지데이와 가장 결이 맞아 추천.",
  },
  {
    id: "cipher",
    name: "E. 봉인된 사유",
    ref: "레퍼런스: 7½: 암호적 상상 5 (2023)",
    desc: "보안봉투 패턴의 대각 띠가 제목을 부분적으로 가립니다. '봉인된 텍스트를 함께 개봉하는 모임'이라는 은유 — 띠를 탭하면 개봉됩니다. 다섯 시안 중 가장 그래픽이 강한 안.",
  },
] as const

type VariantId = (typeof VARIANTS)[number]["id"]

// ── A. 활자 견본 ────────────────────────────────────────────
const SPEC_SIZES = [
  { size: 7.9, label: "96" },
  { size: 6.7, label: "72" },
  { size: 5.6, label: "60" },
  { size: 4.7, label: "48" },
  { size: 3.9, label: "36" },
  { size: 3.2, label: "28" },
]
function SpecimenPoster() {
  return (
    <div className={`${styles.poster} ${styles.specPoster}`}>
      <div className={styles.specHead}>
        <span>레이지데이 북클럽 — 4기 견본</span>
        <span>LAZYDAY BOOK CLUB, SEASON 4</span>
      </div>
      <div className={styles.specLines}>
        {SPEC_SIZES.map((s, i) => (
          <div key={s.label} className={styles.specRow}>
            <span className={styles.specLabel}>{s.label}</span>
            <span
              className={`${styles.specText} ${i === 3 ? styles.specTextAccent : ""}`}
              style={{ fontSize: `${s.size}cqw` }}
            >
              {TITLE}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.specInfo}>
        <div>
          <p className={styles.specInfoHead}>대상 도서</p>
          {BOOKS.map(b => (
            <p key={b.no} className={styles.specInfoLine}>
              {b.no} · {b.title}{b.author ? ` ${b.author}` : ""}
            </p>
          ))}
        </div>
        <div>
          <p className={styles.specInfoHead}>일정</p>
          <p className={styles.specInfoLine}>{PERIOD}</p>
          <p className={`${styles.specInfoHead} ${styles.specInfoHeadGap}`}>장소</p>
          <p className={styles.specInfoLine}>{PLACE}</p>
        </div>
      </div>
    </div>
  )
}

// ── B. 남는 글자들 ──────────────────────────────────────────
const MULTI_GLYPHS = ["레", "이", "지", "데", "이", "북", "클", "럽", "4", "기"]
// 줄마다 하나씩 사라지는 순서 (고정 — 흩어진 빈칸이 골격을 이루도록)
const REMOVE_ORDER = [7, 2, 9, 4, 0, 8, 3, 6, 1, 5]
function MultiplesPoster() {
  return (
    <div className={`${styles.poster} ${styles.multiPoster}`}>
      <div className={styles.multiField}>
        {MULTI_GLYPHS.map((_, line) => {
          const removed = new Set(REMOVE_ORDER.slice(0, line))
          return (
            <div key={line} className={styles.multiRow}>
              {MULTI_GLYPHS.map((g, i) => (
                <span
                  key={i}
                  className={`${styles.multiCell} ${line === 0 ? styles.multiCellAccent : ""}`}
                >
                  {removed.has(i) ? "" : g}
                </span>
              ))}
            </div>
          )
        })}
      </div>
      <p className={styles.multiInfo}>
        {TITLE} — {PERIOD} · {PLACE}
      </p>
    </div>
  )
}

// ── C. 마주 보기 ────────────────────────────────────────────
const CROW_DIGITS = "1234567890".split("")
function MirrorPoster() {
  const rows = Array.from({ length: 11 }, (_, r) => r)
  return (
    <div className={`${styles.poster} ${styles.mirrorPoster}`}>
      <p className={styles.mirrorTitle}>{TITLE}</p>
      <div className={styles.mirrorField}>
        {rows.map(r =>
          r === 5 ? (
            <p key={r} className={styles.mirrorInfo}>
              {PERIOD} · {PLACE}
            </p>
          ) : (
            <div key={r} className={styles.mirrorRow}>
              {(() => {
                const dotAt = r < 5 ? r : r - 1
                const cells: ReactNode[] = []
                let d = 0
                for (let c = 0; c < 11; c++) {
                  if (c === dotAt) {
                    cells.push(<span key={c} className={styles.mirrorDot}>●</span>)
                  } else {
                    cells.push(<span key={c}>{CROW_DIGITS[d++]}</span>)
                  }
                }
                return cells
              })()}
            </div>
          ),
        )}
      </div>
      <p className={`${styles.mirrorTitle} ${styles.mirrorTitleFlip}`}>{TITLE}</p>
    </div>
  )
}

// ── D. 본문이 곧 포스터 ─────────────────────────────────────
const TITLE_CHARS = new Set(["레", "이", "지", "데", "북", "클", "럽", "기"])
function markTitleChars(text: string) {
  return text.split("").map((ch, i) =>
    TITLE_CHARS.has(ch) ? (
      <em key={i} className={styles.maniMark}>{ch}</em>
    ) : (
      ch
    ),
  )
}
function ManifestoPoster() {
  return (
    <div className={`${styles.poster} ${styles.maniPoster}`}>
      <div className={styles.maniBody}>
        {MANIFESTO.map((p, i) => (
          <p key={i} className={styles.maniPara}>{markTitleChars(p)}</p>
        ))}
      </div>
      <div className={styles.maniFoot}>
        <p className={styles.maniFootTitle}>{TITLE}</p>
        <p className={styles.maniFootInfo}>
          {PERIOD}
          <br />
          {PLACE}
        </p>
      </div>
    </div>
  )
}

// ── E. 봉인된 사유 ──────────────────────────────────────────
function CipherPoster() {
  const [opened, setOpened] = useState(false)
  return (
    <div className={`${styles.poster} ${styles.cipherPoster}`}>
      <div className={styles.cipherTitleBlock}>
        <p className={styles.cipherLine}>레이지데이</p>
        <p className={styles.cipherLine}>북클럽</p>
        <p className={`${styles.cipherLine} ${styles.cipherLineAccent}`}>4기</p>
      </div>
      <div className={styles.cipherInfo}>
        {BOOKS.map(b => (
          <p key={b.no} className={styles.cipherInfoLine}>
            {b.no} · {b.title}{b.author ? ` ${b.author}` : ""}
          </p>
        ))}
        <p className={`${styles.cipherInfoLine} ${styles.cipherInfoGap}`}>{PERIOD}</p>
        <p className={styles.cipherInfoLine}>{PLACE}</p>
      </div>
      <button
        type="button"
        aria-label={opened ? "봉인 되돌리기" : "봉인 개봉하기"}
        className={`${styles.cipherBand} ${opened ? styles.cipherBandOpened : ""}`}
        onClick={() => setOpened(o => !o)}
      />
      <p className={styles.cipherHint}>{opened ? "다시 탭하면 봉인됩니다" : "패턴 띠를 탭하면 개봉됩니다"}</p>
    </div>
  )
}

// ── 페이지 ──────────────────────────────────────────────────
export default function PosterDesignsPage() {
  const [variant, setVariant] = useState<VariantId>("specimen")
  const meta = VARIANTS.find(v => v.id === variant)!

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <h1 className={styles.pageTitle}>4기 포스터 디자인 시안</h1>
        <p className={styles.pageSub}>
          슬기와 민 포스터 9종을 레퍼런스로, 서로 다른 조형 원리의 시안 다섯 개를
          A1(594×841) 비율 캔버스에 구현했습니다. 위 버튼으로 시안을 전환해 비교해 보세요.
          모두 타이포그래피만으로 구성 — 사진·일러스트 없음.
        </p>

        <div className={styles.switcher}>
          {VARIANTS.map(v => (
            <button
              key={v.id}
              className={`${styles.switchBtn} ${variant === v.id ? styles.switchBtnActive : ""}`}
              onClick={() => setVariant(v.id)}
            >
              {v.name}
            </button>
          ))}
        </div>

        <div className={styles.variantMeta}>
          <p className={styles.variantName}>{meta.name}</p>
          <p className={styles.variantRef}>{meta.ref}</p>
          <p className={styles.variantDesc}>{meta.desc}</p>
        </div>

        {variant === "specimen" && <SpecimenPoster />}
        {variant === "multiples" && <MultiplesPoster />}
        {variant === "mirror" && <MirrorPoster />}
        {variant === "manifesto" && <ManifestoPoster />}
        {variant === "cipher" && <CipherPoster />}

        <p className={styles.posterCaption}>A1 비율 (594×841) · 화면 검토용 — 인쇄 원본은 채택 후 제작</p>
      </div>
    </div>
  )
}
