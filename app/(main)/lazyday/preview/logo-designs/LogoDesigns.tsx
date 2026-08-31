"use client"

import { useState } from "react"
import s from "./logo-designs.module.css"

/**
 * 동적 로고 시안 6종 (운영자 2026-08-12: "Cafe24NyangiW 폰트로 손글씨 하트 svg 와
 * 텍스트를 굴려서 배치… 시안 5개 이상. 라운딩을 안 하는 게 낫다면 1행도")
 *
 * - 하트는 운영자 첨부 이미지(빗금 스크리블 하트)를 SVG 로 직접 재현 — 외부 이미지 없음
 * - 텍스트는 Cafe24 냥이체 W(아웃라인) 웹폰트, 시안 ⑥만 대비용 B(블랙) 병용
 * - 각 시안: 실제 내비 1행 목업(브랜드 텍스트 제거 상태) + 큰 무대
 * - prefers-reduced-motion 이면 전 시안 정적 (CSS 에서 일괄 차단)
 */

// ── 손그림 하트 (첨부 원본 재현: 빗금 스크리블 + 살짝 비대칭 윤곽) ──────────
function Heart({ variant = "scribble", className = "" }: { variant?: "scribble" | "outline"; className?: string }) {
  const d =
    "M50 83 C26 64 8 46 11.5 29.5 C14 16.5 29 10.5 38.5 17.5 C44 21.5 47.8 26.5 50 32 C52.5 26 56.5 21 62 17 C71.5 10 86.5 16 88.8 29 C91.8 45.5 75 63.5 50 83 Z"
  return (
    <svg viewBox="0 0 100 92" className={`${s.heart} ${className}`} aria-hidden focusable="false">
      {variant === "scribble" && (
        <>
          <clipPath id="lzHeartClip">
            <path d={d} />
          </clipPath>
          <g clipPath="url(#lzHeartClip)" className={s.heartScribble}>
            <path d="M6 47 L84 14" />
            <path d="M4 60 L92 24" />
            <path d="M14 70 L94 37" />
            <path d="M26 79 L92 51" />
            <path d="M38 87 L88 65" />
            <path d="M20 30 L54 15" />
          </g>
        </>
      )}
      <path className={s.heartOutline} d={d} />
    </svg>
  )
}

// 글자를 span 으로 쪼개고 --i(순번)를 실어 스태거 지연에 쓴다
function Letters({ word, cls }: { word: string; cls?: string }) {
  return (
    <>
      {word.split("").map((ch, i) => (
        <span key={i} className={`${s.ltr} ${cls ?? ""}`} style={{ "--i": i } as React.CSSProperties}>
          {ch}
        </span>
      ))}
    </>
  )
}

// ── 시안별 로고 본체 ──────────────────────────────────────────────
// 아치 배치 — 운영자 첨부 원본의 LAZYDAY 는 **가운데가 내려앉은 ∪(스마일) 곡선**이다
// (L 이 높고 Z·Y 가 가장 낮고 마지막 Y 가 다시 올라온다). ∩ 아치로 만들면 반대가 된다.
const ARCH_Y = [0, 0.13, 0.2, 0.22, 0.19, 0.1, -0.04] // em (아래로 +)
const ARCH_R = [11, 6.5, 2, 0, -3.5, -9, -15] // deg (곡선 접선 방향)

function Logo({ v, size }: { v: string; size: number }) {
  const st = { fontSize: size } as React.CSSProperties
  if (v === "g") {
    // ⑦ 원형 뱃지 — 운영자 표현 "텍스트를 굴려서 배치"의 가장 직접적 해석.
    // 가운데 스크리블 하트 고정, 둘레의 문구가 천천히 한 방향으로 돈다 (실링 왁스/도장 결)
    return (
      <span className={`${s.logo} ${s.vG}`} style={st} aria-label="I love LAZYDAY">
        <svg viewBox="0 0 120 120" className={s.badge} aria-hidden focusable="false">
          <defs>
            <path id="lzRing" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
          </defs>
          <g className={s.badgeSpin}>
            <text className={s.badgeText}>
              <textPath href="#lzRing" startOffset="0">
                I LOVE LAZYDAY · I LOVE LAZYDAY ·
              </textPath>
            </text>
          </g>
        </svg>
        <Heart className={s.badgeHeart} />
      </span>
    )
  }
  if (v === "h") {
    // ⑧ 곡선 산책 — 하트가 글자 위 아치를 따라 **구르며** 좌→우로 지나간다 (offset-path)
    return (
      <span className={`${s.logo} ${s.vH}`} style={st} aria-label="I love LAZYDAY">
        <span className={s.hTrack}>
          <Heart className={s.hRoller} />
        </span>
        <span className={`${s.row} ${s.hWord}`}>
          <span>I</span>
          <span className={s.hHeartSlot}>
            <Heart />
          </span>
          <span className={s.word}>LAZYDAY</span>
        </span>
      </span>
    )
  }
  if (v === "i") {
    // ⑨ 도미노 — 글자가 순서대로 앞으로 넘어갔다 돌아온다 (Y축 회전, 원근)
    return (
      <span className={`${s.logo} ${s.row} ${s.vI}`} style={st} aria-label="I love LAZYDAY">
        <span className={`${s.ltr} ${s.flipL}`} style={{ "--i": 0 } as React.CSSProperties}>
          I
        </span>
        <Heart />
        <span className={s.word}>
          <Letters word="LAZYDAY" cls={s.flipL} />
        </span>
      </span>
    )
  }
  if (v === "a") {
    // ① 포스터 그대로 — 2행(I ♥ / LAZYDAY 아치), 전체가 천천히 숨 쉬듯 흔들
    return (
      <span className={`${s.logo} ${s.vA}`} style={st} aria-label="I love LAZYDAY">
        <span className={s.aTop}>
          <span className={s.aI}>I</span>
          <Heart />
        </span>
        <span className={s.aArch}>
          {"LAZYDAY".split("").map((ch, i) => (
            <span
              key={i}
              className={s.aLtr}
              style={{ "--i": i, "--ay": `${ARCH_Y[i]}em`, "--ar": `${ARCH_R[i]}deg` } as React.CSSProperties}
            >
              {ch}
            </span>
          ))}
        </span>
      </span>
    )
  }
  if (v === "d") {
    // ④ 하트만 데굴데굴 — 텍스트 정적, 하트가 바퀴처럼 한 바퀴 구르고 쉼
    return (
      <span className={`${s.logo} ${s.row} ${s.vD}`} style={st} aria-label="I love LAZYDAY">
        <span>I</span>
        <Heart />
        <span className={s.word}>LAZYDAY</span>
      </span>
    )
  }
  const cls = v === "b" ? s.waveL : v === "c" ? s.jellyL : v === "e" ? s.hopL : s.popL
  return (
    <span className={`${s.logo} ${s.row} ${s[`v${v.toUpperCase()}` as "vB"]}`} style={st} aria-label="I love LAZYDAY">
      <span className={`${s.ltr} ${cls}`} style={{ "--i": 0 } as React.CSSProperties}>
        I
      </span>
      {/* 하트는 전 시안 원본 그대로 **빗금 스크리블** — 브랜드 마크의 정체성이라
          시안 변수로 두지 않는다 (운영자 첨부 원본) */}
      <Heart />
      <span className={s.word}>
        <Letters word="LAZYDAY" cls={cls} />
      </span>
    </span>
  )
}

// ── 시안 메타 ────────────────────────────────────────────────────
const VARIANTS = [
  {
    k: "a",
    name: "① 포스터 아치 — 숨 쉬는 굴림",
    ref: "첨부 원본의 2행 아치 배치 그대로 + 전체가 종이 인형처럼 좌우로 천천히 흔들리고 글자마다 미세 요동",
    note: "정체성 보존 최우선. 2행이라 내비에선 세로로 촘촘하게 줄여 쓴다",
  },
  {
    k: "b",
    name: "② 한 줄 물결 — 파도타기",
    ref: "1행 I ♥ LAZYDAY. 글자들이 순서대로 위아래 파도 (레이지클럽 유휴 셔플의 리듬감 계열)",
    note: "내비 1행에 가장 자연스러운 컴팩트형 · 추천",
  },
  {
    k: "c",
    name: "③ 젤리 — 제자리 요동",
    ref: "글자마다 ±6° 씩 갸웃갸웃, 하트는 살짝 부풀었다 줄어듦. 이동 없이 제자리라 가장 점잖다",
    note: "차분한 손글씨 결 — 본문 방해 최소",
  },
  {
    k: "d",
    name: "④ 데굴데굴 하트",
    ref: "텍스트는 정적, 하트만 4초마다 바퀴처럼 한 바퀴 구른다 (통통 튀는 착지)",
    note: "모션이 한 점에 응축 — 시선 분산이 적다",
  },
  {
    k: "e",
    name: "⑤ 폴짝 — 유휴 홉",
    ref: "평소엔 정지, 몇 초에 한 번 글자 하나가 폴짝 뛴다 (레이지클럽 유휴 셔플과 같은 '가끔 움직임' 문법)",
    note: "거의 정적이라 로고 피로감이 없다",
  },
  {
    k: "f",
    name: "⑥ 심장박동 — 팝 등장",
    ref: "진입 시 글자가 하나씩 통통 튀며 등장, 이후 하트만 두근두근 (두 박자 심장박동)",
    note: "진입 인상 강함 — 랜딩 히어로형. 냥이체 B(블랙) 대비 확인용",
  },
  {
    k: "g",
    name: "⑦ 원형 뱃지 — 굴러가는 문구",
    ref: "가운데 하트 고정, 둘레의 I LOVE LAZYDAY 가 천천히 한 방향으로 돈다 (실링 왁스·도장 결)",
    note: '"텍스트를 굴려서 배치"의 가장 직접적 해석 · 정사각이라 내비·파비콘·굿즈까지 한 마크로',
  },
  {
    k: "h",
    name: "⑧ 곡선 산책 — 구르는 하트",
    ref: "하트 하나가 글자 위 아치를 따라 좌→우로 굴러 지나간다 (경로를 따라 회전까지)",
    note: "로고 자체는 정적이고 하트만 여행 — 이야기가 있는 움직임",
  },
  {
    k: "i",
    name: "⑨ 도미노 — 넘어갔다 돌아오기",
    ref: "글자가 순서대로 앞으로 넘어갔다 제자리로 (Y축 회전·원근). 종이 인형이 넘어가는 결",
    note: "리듬이 또렷해 시선을 확실히 끈다 — 강도 조절 필요",
  },
] as const

export function LogoDesigns() {
  const [v, setV] = useState<string>("b")
  const cur = VARIANTS.find((x) => x.k === v)!
  return (
    <main className={s.page}>
      <h1 className={s.title}>동적 로고 — I ♥ LAZYDAY 시안 6</h1>
      <p className={s.lead}>
        Cafe24 냥이체 W(아웃라인) + 손그림 스크리블 하트 SVG. 내비 1행에서 “레이지데이 북클럽” 텍스트를 빼고 이
        로고가 자리와 움직임을 대신한다. 탭으로 전환.
      </p>

      <div className={s.tabs} role="tablist">
        {VARIANTS.map((x) => (
          <button
            key={x.k}
            role="tab"
            aria-selected={v === x.k}
            className={`${s.tab} ${v === x.k ? s.tabOn : ""}`}
            onClick={() => setV(x.k)}
          >
            {x.name}
          </button>
        ))}
      </div>

      <p className={s.desc}>
        <strong>{cur.name}</strong> — {cur.ref}. <span className={s.note}>{cur.note}</span>
      </p>

      {/* 내비 1행 목업 — 브랜드 텍스트 제거 상태 (로고가 정체성 담당) */}
      <div className={s.navMock} key={`nav-${v}`}>
        <div className={s.navRow1}>
          {/* 브랜드 텍스트가 빠진 자리를 로고가 대신하므로 종전 로고보다 크게 잡는다.
              ①은 2행이라 행당 높이가 절반이어서 더 작은 수치 */}
          <Logo v={v} size={v === "a" ? 15 : 21} />
          <span className={s.navApply}>신청하기</span>
        </div>
        <div className={s.navRow2}>
          {["선정도서", "모임소개", "진행방식", "일정·장소", "후기·FAQ"].map((t, i) => (
            <span key={t} className={i === 0 ? s.navTabOn : undefined}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* 큰 무대 */}
      <div className={s.stage} key={`stage-${v}`}>
        <Logo v={v} size={v === "a" ? 44 : 52} />
      </div>

      <p className={s.foot}>
        하트·글자 전부 코드(SVG·웹폰트) — 이미지 없음. 모든 시안 prefers-reduced-motion 시 정적. 채택안은
        반응형 초안 내비(모바일 포함)에 이식.
      </p>
    </main>
  )
}
