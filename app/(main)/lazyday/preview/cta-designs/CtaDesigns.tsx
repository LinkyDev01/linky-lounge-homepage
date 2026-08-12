"use client"

import { useState } from "react"
import s from "./cta-designs.module.css"
import { IconArrowGlyph, IconBookmark, IconChevron, IconDoor, IconHandArrow, IconHeart } from "./CtaIcons"

/**
 * 하단 고정 CTA 시안.
 * ① 위 블록 — 강도 순 6안 비교 (운영자 2026-08-12 "너무 노골적이라" → E 채택)
 * ② 아래 블록 — 채택된 E(텍스트 링크형) 다듬기: **아이콘 × 밑줄 범위**
 *    (운영자 "단순 화살표가 최선일까, 아이콘 만들어볼래? 밑줄이 아이콘까지 쳐져야 할까?")
 * 각 안은 실제 랜딩 하단과 같은 조건(스크롤되는 본문 위에 고정, 종이색 배경,
 * 같은 문구·폭)에서 렌더한다. 프레임 안이 곧 모바일 뷰다.
 */

type Variant = {
  key: string
  name: string
  ref: string
  note: string
  /** 강도 — 시각적 점유감 (막대로 표시) */
  weight: number
}

const VARIANTS: Variant[] = [
  {
    key: "now",
    name: "현행 — 주황 풀바 + 갈색 스크림",
    ref: "지금 실사이트. 버튼 위로 갈색 그라데이션이 깔려 하단을 강하게 점유한다",
    note: "전환 유도는 가장 세지만, 운영자 지적대로 '노골적'",
    weight: 5,
  },
  {
    key: "noscrim",
    name: "A · 스크림만 걷기",
    ref: "버튼은 그대로, 위쪽 갈색 그라데이션만 제거해 종이 위에 버튼만 뜨게",
    note: "지금 강렬함의 절반은 버튼이 아니라 갈색 띠에서 온다 — 가장 작은 변경으로 큰 차이",
    weight: 4,
  },
  {
    key: "outline",
    name: "B · 아웃라인",
    ref: "브라운야드 — 배경은 종이색, 주황은 테두리와 글자에만",
    note: "브랜드 색은 지키면서 존재감을 한 단계 내린다. 로고 위에 안착했을 때 특히 조용",
    weight: 3,
  },
  {
    key: "pill",
    name: "C · 알약형 (좁은 폭)",
    ref: "노아 — 전폭 바 대신 가운데 정렬 260px 알약",
    note: "하단을 가로지르지 않아 콘텐츠를 덜 가린다. 다만 터치 타깃이 줄어 모바일 전환엔 불리",
    weight: 3,
  },
  {
    key: "ink",
    name: "D · 잉크 풀바",
    ref: "레이지클럽·워크룸 — 주황 대신 잉크(#1a1208) 바탕에 종이색 글자",
    note: "면적은 같지만 채도가 낮아 덜 튄다. 주황은 링크·강조에만 남겨 위계가 정리된다",
    weight: 4,
  },
  {
    key: "text",
    name: "E · 텍스트 링크형 ← 채택",
    ref: "워크룸프레스 — 버튼을 없애고 밑줄 텍스트 한 줄 + 기호",
    note: "가장 조용하다. 운영자 채택안 — 아래 블록에서 아이콘·밑줄을 다듬는다",
    weight: 1,
  },
]

/* ── E 다듬기: 아이콘 후보 ── */
type IconOpt = {
  key: string
  label: string
  el: React.ReactNode
  note: string
}

const ICONS: IconOpt[] = [
  { key: "none", label: "① 없음", el: null, note: "밑줄만으로 링크임을 말한다. 가장 조용하지만 '어디로 가는지'는 문구가 전부 감당해야 한다" },
  {
    key: "arrow",
    label: "② → 활자",
    el: <IconArrowGlyph />,
    note: "지금 시안. 서체가 그리는 글리프라 본문과 굵기·색이 자동으로 맞는다. 안전하지만 브랜드 흔적은 없다",
  },
  {
    key: "chevron",
    label: "③ › 셰브런",
    el: <IconChevron />,
    note: "화살표에서 축을 빼 촉만 남긴 것. 15px에서 가장 또렷하고, 밑줄과 겹쳐 읽히지 않는다",
  },
  {
    key: "hand",
    label: "④ 손그림 화살표",
    el: <IconHandArrow />,
    note: "마크·하트와 같은 손의 흔적(크레파스 질감). 브랜드 서명이 CTA까지 이어진다 — 작은 크기라 번짐은 낮춤",
  },
  {
    key: "heart",
    label: "⑤ 크레파스 하트",
    el: <IconHeart />,
    note: "마크의 하트를 그대로 축소. 서명은 가장 강하지만 '좋아요'로 읽힐 위험이 있다",
  },
  {
    key: "bookmark",
    label: "⑥ 책갈피",
    el: <IconBookmark />,
    note: "독서모임 맥락을 직접 말한다. 다만 '이동'이 아니라 '저장'으로 읽힐 수 있다",
  },
  {
    key: "door",
    label: "⑦ 문",
    el: <IconDoor />,
    note: "'들어오세요' — 모집의 뜻에 가장 가깝지만, 이 크기에서 문틀·화살표가 뭉쳐 보인다",
  },
  {
    key: "underarrow",
    label: "⑧ 밑줄이 곧 화살표",
    el: null,
    note: "아이콘을 따로 두지 않고 밑줄을 오른쪽으로 흘려 그 끝을 촉으로 세운다. 두 질문(아이콘·밑줄 범위)이 한 번에 풀린다",
  },
]

const DUMMY = [
  "얄팍한 사교와 지적 허영 사이에서 길을 잃은 당신에게.",
  "레이지데이는 문학과 철학, 예술의 한가운데에서 쉽게 공감하는 대화보다 서로 다른 시선과 부딪히는 순간을 기다리는 사람들이 모입니다.",
  "비슷한 결을 가졌다고 같은 결론에 도달할 필요는 없습니다. 같은 이야기 앞에 멈춰 서도 이어지는 생각은 저마다 엇갈리고, 그 불협화음 속에서 우리가 가진 생각의 윤곽은 더 또렷해집니다.",
  "그래서 모든 멤버는 참여에 앞서 인터뷰를 진행합니다. 서로의 결을 미리 엿보며, 우리의 대화가 앞으로 어떻게 얽혀 나갈지 함께 가늠해 보는 첫 출발점이 되어 줍니다.",
  "한 시즌 동안 네 권의 책을 함께 읽고, 낮의 대화로 깊게 이야기합니다.",
]

function Dummy() {
  return (
    <div className={s.dummy}>
      {DUMMY.map((t, i) => (
        <p key={i}>{t}</p>
      ))}
      {DUMMY.map((t, i) => (
        <p key={`b${i}`}>{t}</p>
      ))}
    </div>
  )
}

/** 밑줄 끝에서 솟는 촉 — ⑧ 전용. 밑줄(1px)과 같은 높이에 중심을 맞춘다 */
function UnderArrowHead() {
  return (
    <svg className={s.underHead} viewBox="0 0 9 12" aria-hidden focusable="false">
      <path d="M1.6 1.6 L6.8 6 L1.6 10.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CtaDesigns() {
  const [v, setV] = useState("text")
  const cur = VARIANTS.find((x) => x.key === v)!

  const [icon, setIcon] = useState("hand")
  const [rule, setRule] = useState<"text" | "all">("text")
  const curIcon = ICONS.find((x) => x.key === icon)!
  const isUnderArrow = icon === "underarrow"

  return (
    <main className={s.page}>
      <h1 className={s.title}>하단 CTA 시안</h1>
      <p className={s.lead}>
        아래 프레임은 <strong>실제 랜딩 하단과 같은 조건</strong>(스크롤되는 본문 위 고정·같은 문구·같은 폭)입니다.
        프레임 안을 스크롤해 보세요.
      </p>

      {/* ── ① 강도 6안 ── */}
      <h2 className={s.h2}>① 강도 — 현행 포함 6안</h2>
      <div className={s.tabs} role="tablist">
        {VARIANTS.map((x) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={v === x.key}
            className={`${s.tab} ${v === x.key ? s.tabOn : ""}`}
            onClick={() => setV(x.key)}
          >
            {x.name}
          </button>
        ))}
      </div>

      <p className={s.desc}>
        <strong>{cur.name}</strong> — {cur.ref}.
        <br />
        <span className={s.note}>{cur.note}</span>
        <span className={s.weight} aria-label={`시각적 점유감 ${cur.weight}/5`}>
          점유감 {"■".repeat(cur.weight)}
          <span className={s.weightOff}>{"■".repeat(5 - cur.weight)}</span>
        </span>
      </p>

      <div className={s.frame} data-variant={v}>
        <div className={s.scroller}>
          <Dummy />
        </div>
        <div className={s.ctaWrap}>
          <span className={s.cta}>
            4기 신청하기
            {v === "text" && <span className={s.arrow}> →</span>}
          </span>
        </div>
      </div>

      {/* ── ② E 다듬기 ── */}
      <h2 className={s.h2}>② 채택안 E 다듬기 — 아이콘 × 밑줄 범위</h2>
      <p className={s.lead}>
        운영자: “밑줄 정도면 충분한데 단순 화살표가 최선일까, 아니면 적절한 아이콘 만들어볼래? 그리고 밑줄이 화살표
        또는 아이콘까지 쳐져야 할까?”
      </p>

      {/* 실제 크기 나열 — 프레임 없이 아이콘만 나란히 */}
      <div className={s.lineup}>
        {ICONS.filter((x) => x.el).map((x) => (
          <button
            key={x.key}
            className={`${s.lineupItem} ${icon === x.key ? s.lineupOn : ""}`}
            onClick={() => setIcon(x.key)}
            aria-pressed={icon === x.key}
          >
            <span className={s.lineupIcon}>{x.el}</span>
            <span className={s.lineupLabel}>{x.label}</span>
          </button>
        ))}
      </div>

      <div className={s.tabs} role="tablist" aria-label="아이콘">
        {ICONS.map((x) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={icon === x.key}
            className={`${s.tab} ${icon === x.key ? s.tabOn : ""}`}
            onClick={() => setIcon(x.key)}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className={s.tabs} role="tablist" aria-label="밑줄 범위">
        <button
          role="tab"
          aria-selected={rule === "text"}
          className={`${s.tab} ${s.tabSm} ${rule === "text" ? s.tabOn : ""}`}
          onClick={() => setRule("text")}
          disabled={isUnderArrow || icon === "none"}
        >
          밑줄: 텍스트만
        </button>
        <button
          role="tab"
          aria-selected={rule === "all"}
          className={`${s.tab} ${s.tabSm} ${rule === "all" ? s.tabOn : ""}`}
          onClick={() => setRule("all")}
          disabled={isUnderArrow || icon === "none"}
        >
          밑줄: 아이콘까지
        </button>
        {(isUnderArrow || icon === "none") && (
          <span className={s.tabHint}>
            {isUnderArrow ? "⑧은 밑줄 자체가 화살표라 범위 선택이 없습니다" : "①은 아이콘이 없어 범위 선택이 없습니다"}
          </span>
        )}
      </div>

      <p className={s.desc}>
        <strong>{curIcon.label}</strong> — <span className={s.note}>{curIcon.note}</span>
      </p>

      <div className={s.frame} data-variant="text">
        <div className={s.scroller}>
          <Dummy />
        </div>
        <div className={s.ctaWrap}>
          <span className={s.textLink} data-icon={icon} data-rule={isUnderArrow ? "none" : icon === "none" ? "text" : rule}>
            <span className={s.textLinkLabel}>4기 신청하기</span>
            {curIcon.el}
            {isUnderArrow && <UnderArrowHead />}
          </span>
        </div>
      </div>

      <p className={s.foot}>
        <strong>추천</strong> — 아이콘은 <strong>④ 손그림 화살표</strong>. 마크(I♥LAZYDAY)와 하트가 이미 손그림이라,
        CTA에만 활자 화살표가 서면 그 자리만 다른 손이 그린 것처럼 보입니다. 더 조용하게 가려면{" "}
        <strong>③ 셰브런</strong>, 브랜드를 더 세게 말하려면 <strong>⑧ 밑줄이 곧 화살표</strong>.
        <br />
        <strong>밑줄은 텍스트에만.</strong> 밑줄은 “여기가 링크다”라는 활자 관습이고 아이콘은 방향 신호라 역할이
        다릅니다. 아이콘까지 그으면 선이 길어지며 바닥에 상자를 그린 것처럼 보여, E를 고른 이유(조용함)와 충돌합니다.
        예외가 ⑧인데, 그건 밑줄과 화살표를 아예 한 획으로 합쳐 그 충돌 자체를 없앤 안입니다.
        <br />
        <span className={s.note}>
          이식할 때 함께 반영할 것: 텍스트 링크는 터치 타깃이 작아지므로 탭 영역을 글자 밖으로 넓혀(높이 44px 이상)
          잡습니다. 화면에 보이는 선은 그대로 두고 히트 영역만 키웁니다.
        </span>
      </p>
    </main>
  )
}
