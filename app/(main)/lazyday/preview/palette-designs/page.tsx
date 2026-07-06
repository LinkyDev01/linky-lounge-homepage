"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import styles from "./palette-designs.module.css"

/**
 * 섹션 배경 팔레트 시안 쇼케이스 — 운영자 요청 (2026-07-06):
 * "섹션별 교차되는 컬러가 다소 진해. 다른 컬러 베이스로 동일한 톤(명도·채도)의
 *  현재 페이지에 적합한 배경색으로 올려봐."
 * 현행 베이지 쌍(B #ede0d0 / A #f5ede4)과 같은 명도·채도(HSL 기준
 * B: S45%/L87%, A: S46%/L93%)에서 색상(Hue)만 바꾼 후보 + 보정안 2종을
 * 실제 랜딩 구성 요소(명조 본문·카드·주황 CTA·괘선 박스)를 얹은 목업으로 비교.
 * 실사이트 미반영 — 프리뷰 전용 제안.
 */

type Palette = {
  key: string
  name: string
  /** 짙은 쪽 (섹션 배경 B 대응) */
  b: string
  /** 밝은 쪽 (섹션 배경 A 대응) */
  a: string
  ref: string
  note: string
}

const PALETTES: Palette[] = [
  {
    key: "current",
    name: "현행 베이지",
    b: "#ede0d0",
    a: "#f5ede4",
    ref: "비교 기준 — 현재 프로덕션 (H 33°)",
    note: "지금 실사이트에 올라가 있는 교차 쌍입니다. 아래 후보들과 같은 명도·채도입니다.",
  },
  {
    key: "greige",
    name: "웜 그레이지",
    b: "#e5ded7",
    a: "#f1eeea",
    ref: "레퍼런스: 무인양품·킨포크 지류 톤 (H 33° 유지, 채도만 45→20%)",
    note: "색상은 그대로 두고 채도를 절반 이하로 내린 보정안 — 색이 '옅어지는' 것이 아니라 '차분해지는' 방향이라, 진하다는 인상의 원인(누런 기운)이 빠집니다. 주황 CTA·명조 잉크와의 조화가 현행과 가장 가깝습니다.",
  },
  {
    key: "sage",
    name: "세이지 그린",
    b: "#d9edcf",
    a: "#eaf5e5",
    ref: "레퍼런스: 식물성 서점·아르떼 에세이 표지 (H 100°, 명도·채도 동일)",
    note: "명도·채도를 그대로 두고 색상만 녹색으로 옮긴 후보. 같은 톤인데도 눈이 초록을 더 밝게 받아들여 체감상 가장 가볍습니다. 다만 주황 CTA와 보색 계열이라 브랜드 인상이 크게 달라집니다.",
  },
  {
    key: "rose",
    name: "더스티 로즈",
    b: "#edd6cf",
    a: "#f5e9e5",
    ref: "레퍼런스: 문학 에세이 북커버·블러시 톤 (H 15°, 명도·채도 동일)",
    note: "베이지에서 붉은 쪽으로 반 발짝 — 변화 폭이 가장 작아 안전하지만, '진하다'는 인상은 크게 달라지지 않을 수 있습니다.",
  },
  {
    key: "blue",
    name: "미스트 블루",
    b: "#cfdeed",
    a: "#e5edf5",
    ref: "레퍼런스: 하드커버 학술서·리넨 북클로스 (H 210°, 명도·채도 동일)",
    note: "쿨 톤 후보 — 주황 CTA가 가장 또렷하게 살아나고 지적인 인상. 대신 다과·아늑함 같은 온기 어휘와는 결이 다릅니다.",
  },
  {
    key: "oat",
    name: "오트밀 (톤업)",
    b: "#f2e9dc",
    a: "#f9f4ec",
    ref: "보정안: 현행 색상 유지, 명도만 87→91% (색상·채도 동일)",
    note: "'다소 진해'를 가장 직접적으로 해결하는 안 — 색은 그대로, 짙은 쪽만 한 단계 밝힙니다. 교차 대비가 줄어드는 만큼 섹션 경계가 은은해집니다.",
  },
]

export default function PaletteDesignsPage() {
  const [active, setActive] = useState("greige")
  const p = PALETTES.find((x) => x.key === active)!
  const vars = { "--bg-a": p.a, "--bg-b": p.b } as CSSProperties

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>섹션 배경 팔레트 시안</h1>
        <p className={styles.desc}>
          현행 교차 쌍과 동일한 톤(명도·채도)에서 컬러 베이스만 바꾼 후보 4종 +
          보정안(채도·명도 조정) 2종. 탭을 눌러 실제 랜딩 구성 요소 위에서 비교하세요.
        </p>
        <div className={styles.tabs}>
          {PALETTES.map((x) => (
            <button
              key={x.key}
              className={`${styles.tab} ${x.key === active ? styles.tabActive : ""}`}
              onClick={() => setActive(x.key)}
            >
              <span className={styles.tabSwatch} aria-hidden>
                <i style={{ background: x.b }} />
                <i style={{ background: x.a }} />
              </span>
              {x.name}
            </button>
          ))}
        </div>
        <p className={styles.refLine}>{p.ref}</p>
        <p className={styles.noteLine}>{p.note}</p>
        <p className={styles.hexLine}>
          B(짙은 쪽) <code>{p.b}</code> · A(밝은 쪽) <code>{p.a}</code>
        </p>
      </header>

      {/* ── 랜딩 축소 목업: B/A/B/A/B 교차 위에 실제 구성 요소를 얹어 판단 ── */}
      <div className={styles.mock} style={vars}>
        {/* 선정도서 (B) — 카드·명조 본문과의 조화 */}
        <section className={`${styles.sec} ${styles.secB}`}>
          <div className={styles.secTitleRow}>
            <h2 className={styles.secTitle}>선정 도서</h2>
          </div>
          <div className={styles.card}>
            <p className={styles.cardWeek}>WEEK 1</p>
            <p className={styles.cardBook}>데미안</p>
            <p className={styles.serif}>
              새는 알에서 나오려고 투쟁한다. 알은 세계이다. 태어나려는 자는 하나의
              세계를 깨뜨려야 한다. 우리가 함께 읽으며 나눌 첫 문장입니다.
            </p>
          </div>
        </section>

        {/* 모임 소개 (A) — 풀 인용·명조 문단 */}
        <section className={`${styles.sec} ${styles.secA}`}>
          <div className={styles.secTitleRow}>
            <h2 className={styles.secTitle}>모임 소개</h2>
          </div>
          <p className={styles.eyebrow}>TEXTS</p>
          <p className={styles.pull}>소설이 던진 모순에 철학이 이름을 붙입니다.</p>
          <p className={styles.serif}>
            기수마다 고전 소설과 철학서를 교차해 읽습니다. 소설 속 인물들이 던진
            모순에, 철학자의 개념으로 이름을 붙입니다. 그렇게 벼려진{" "}
            <strong>생각의 도구</strong>로 <strong>저자의 의도</strong>를 다시
            들여다봅니다.
          </p>
        </section>

        {/* 진행 방식 (B) — 콰이어트 리스트 헤어라인 */}
        <section className={`${styles.sec} ${styles.secB}`}>
          <div className={styles.secTitleRow}>
            <h2 className={styles.secTitle}>진행 방식</h2>
          </div>
          <p className={styles.stepNum}>STEP 01</p>
          <p className={styles.stepLabel}>발제문으로 시작해요</p>
          <p className={styles.serifSub}>
            대화는 텍스트의 구체적인 문장과 인용에 단단히 발을 붙인 발제문에서
            시작됩니다.
          </p>
          <div className={styles.hairline} />
          <p className={styles.stepNum}>STEP 02</p>
          <p className={styles.stepLabel}>질문으로 깊어져요</p>
        </section>

        {/* 일정·장소 (A) — 괘선 박스(카드 지면)와의 대비 */}
        <section className={`${styles.sec} ${styles.secA}`}>
          <div className={styles.secTitleRow}>
            <h2 className={styles.secTitle}>일정·장소</h2>
          </div>
          <div className={styles.paperBox}>
            <div className={styles.ruleThick} />
            <div className={styles.ruleThin} />
            <p className={styles.paperTitle}>3기 일정</p>
            <p className={styles.paperRow}>1회차 · 7/15 (수) · 19:30</p>
            <p className={styles.paperRowDash}>자유 독서모임 · 9/6 (일)</p>
          </div>
        </section>

        {/* 클로징 (B) — 주황 CTA와의 조화 */}
        <section className={`${styles.sec} ${styles.secB} ${styles.secCenter}`}>
          <p className={styles.ctaTitle}>3기 모집은 곧 마감됩니다.</p>
          <span className={styles.ctaBtn}>3기 신청하기</span>
        </section>
      </div>
    </main>
  )
}
