"use client"

import { useState } from "react"
import s from "./cta-designs.module.css"

/**
 * 하단 고정 CTA 6안 — 강도 순으로 늘어놓고 같은 문맥에서 비교한다.
 * 각 안은 **실제 랜딩 하단과 같은 조건**(스크롤되는 본문 위에 고정, 종이색 배경,
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
    name: "E · 텍스트 링크형",
    ref: "워크룸프레스 — 버튼을 없애고 밑줄 텍스트 한 줄 + 화살표",
    note: "가장 조용하다. 모집 페이지 특성상 전환이 크게 떨어질 수 있어 권하지 않음",
    weight: 1,
  },
]

const DUMMY = [
  "얄팍한 사교와 지적 허영 사이에서 길을 잃은 당신에게.",
  "레이지데이는 문학과 철학, 예술의 한가운데에서 쉽게 공감하는 대화보다 서로 다른 시선과 부딪히는 순간을 기다리는 사람들이 모입니다.",
  "비슷한 결을 가졌다고 같은 결론에 도달할 필요는 없습니다. 같은 이야기 앞에 멈춰 서도 이어지는 생각은 저마다 엇갈리고, 그 불협화음 속에서 우리가 가진 생각의 윤곽은 더 또렷해집니다.",
  "그래서 모든 멤버는 참여에 앞서 인터뷰를 진행합니다. 서로의 결을 미리 엿보며, 우리의 대화가 앞으로 어떻게 얽혀 나갈지 함께 가늠해 보는 첫 출발점이 되어 줍니다.",
  "한 시즌 동안 네 권의 책을 함께 읽고, 낮의 대화로 깊게 이야기합니다.",
]

export function CtaDesigns() {
  const [v, setV] = useState("noscrim")
  const cur = VARIANTS.find((x) => x.key === v)!

  return (
    <main className={s.page}>
      <h1 className={s.title}>하단 CTA 시안 — 현행 포함 6안</h1>
      <p className={s.lead}>
        운영자: “현재 CTA가 상당히 강렬한데 대안 있다면 말해줘. 나쁘진 않지만 너무 노골적이라.”
        <br />
        아래 프레임은 <strong>실제 랜딩 하단과 같은 조건</strong>(스크롤되는 본문 위 고정·같은 문구·같은 폭)입니다.
        프레임 안을 스크롤해 보세요.
      </p>

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

      {/* 모바일 프레임 — 안쪽이 곧 390px 뷰 */}
      <div className={s.frame} data-variant={v}>
        <div className={s.scroller}>
          <div className={s.dummy}>
            {DUMMY.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
            {DUMMY.map((t, i) => (
              <p key={`b${i}`}>{t}</p>
            ))}
          </div>
        </div>
        <div className={s.ctaWrap}>
          <span className={s.cta}>
            4기 신청하기
            {v === "text" && <span className={s.arrow}> →</span>}
          </span>
        </div>
      </div>

      <p className={s.foot}>
        추천: <strong>A(스크림만 걷기)</strong> — 변경이 가장 작고, 지금 강렬함의 원인(갈색 띠)을 정확히 제거합니다.
        더 내리고 싶으면 <strong>D(잉크 풀바)</strong>가 다음 후보 — 면적은 유지하되 채도만 낮춥니다.
        <br />
        E는 조용하지만 모집 페이지에서 전환 손실이 커 권하지 않습니다.
      </p>
    </main>
  )
}
