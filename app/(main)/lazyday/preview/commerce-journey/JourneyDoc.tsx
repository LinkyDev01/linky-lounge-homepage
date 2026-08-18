"use client"

import { useState } from "react"
import s from "./journey.module.css"

/**
 * 레이지클럽 커머스 — 고객여정 인터랙티브 설계 문서.
 *
 * 구조 (운영자 질문 "커머스 로드맵이 고객여정이야?"에 대한 답이 곧 이 문서의 뼈대):
 *   · **고객여정** = 고객이 겪는 흐름 (발견 → 탐색 → 결정 → 결제 → 참여/수령 → 이후)
 *   · **로드맵**   = 우리가 만드는 순서 — 여정의 빈틈(🟡 임시·⛔ 없음)에서 도출된다
 *   둘은 다른 것이고, 여정이 먼저다. 이 문서는 여정을 트랙별로 펼쳐 각 단계의
 *   현재 상태를 정직하게 표기하고, 하단에서 로드맵과 결정 필요 항목을 도출한다.
 *
 * 데이터는 이 파일 안에 정적으로 둔다 — 기획 문서라 단일 출처 컨피그와 무관하고,
 * 상태 표기가 코드 현실과 어긋나면 이 파일을 갱신한다 (2026-08-18 기준 실사).
 */

type Status = "done" | "temp" | "none"
const STATUS_LABEL: Record<Status, string> = { done: "구현됨", temp: "임시", none: "없음" }

type Stage = {
  key: string
  /** 단계 이름 (고객의 언어) */
  name: string
  /** 고객이 하는 일 */
  action: string
  /** 화면·터치포인트 (실제 라우트) */
  touch: string
  /** 지금 상태 */
  status: Status
  /** 상태 부연 — 무엇이 되고 무엇이 안 되나 */
  now: string
  /** 데이터는 어디에 있나 */
  data: string
  /** 빈틈 — 설계·구축이 필요한 것 (없으면 생략) */
  gap?: string
  /** 이탈 위험 — 이 단계에서 고객이 새는 지점 (여정 지도에 표시) */
  leak?: string
  /** 연결되는 로드맵 단계 번호 */
  roadmap?: number[]
}

type Track = { key: string; name: string; persona: string; stages: Stage[] }

const TRACKS: Track[] = [
  {
    key: "oneday",
    name: "원데이 모임",
    persona: "인스타·지인 소개로 레이지클럽을 처음 만나 원데이 토크에 참가해 보는 사람",
    stages: [
      {
        key: "discover",
        name: "발견",
        action: "인스타그램·소개 링크로 진입해 인트로(코밍순)를 만난다",
        touch: "lazy-club.com (인트로 애니메이션 → 마크 클릭 시 홈)",
        status: "done",
        now: "인트로·홈(워크룸 문법) 완성. 홈 리스트에서 모임·굿즈가 한 눈에 보인다.",
        leak: "인트로만 보고 이탈 — 홈으로 이끄는 것이 마크 클릭 하나뿐이다.",
        data: "-",
      },
      {
        key: "browse",
        name: "탐색",
        action: "모임 목록을 훑고 상세에서 일시·장소·가격을 확인한다",
        touch: "/meetings (카테고리 필터) · /meetings/[slug] 상세",
        status: "done",
        now: "목록·상세·related 완성. 상태 3단계(open/soldout/upcoming) 오버레이.",
        leak: "일정이 안 맞으면 그대로 끝 — '다음 모임 알림 받기'가 없다.",
        data: "one-day-config.ts (정적 단일 출처)",
      },
      {
        key: "decide",
        name: "결정",
        action: "카트에 담거나 저장(북마크)해 두고, 구매하기를 누른다",
        touch: "/cart · 상세의 구매하기/카트 담기/저장",
        status: "temp",
        now: "카트·저장은 로그인 없이 실동작 — 단 이 기기 브라우저에만 남는다.",
        leak: "담아 두고 떠나면 다른 기기에선 빈 카트 — 이어 볼 길이 없다.",
        data: "localStorage (lazyday_cart · lazyday_saved) — 서버 없음",
        gap: "기기를 바꾸면 카트·저장이 사라진다. 회원 도입 시 서버 승격(로드맵 5).",
        roadmap: [5],
      },
      {
        key: "pay",
        name: "결제",
        action: "이름·전화만 넣고 결제한다 (주소 없음 — 라운드 7 원칙)",
        touch: "/one-day-talk-01/apply → checkout (토스 위젯) → success에서 신청폼",
        status: "temp",
        now: "토스페이먼츠 위젯·금액 재검증(confirm)까지 구현돼 있으나 PG 신청 심사 대기 중 — 승인 전까지는 실결제가 열리지 않는다.",
        leak: "지금은 실결제 불가 — 여정이 여기서 끊긴다 (PG 심사 대기).",
        data: "결제 승인 후 GAS 시트에 주문 기록 (서버 DB 없음)",
        gap: "주문의 정본이 시트뿐 — 취소·환불·정원 관리가 수작업. 주문 DB(로드맵 2)는 토스 승인과 무관하게 먼저 만들 수 있다.",
        roadmap: [2, 3],
      },
      {
        key: "attend",
        name: "참여",
        action: "안내를 받고 링키라운지에 온다",
        touch: "결제 완료 화면 안내 + (수동) 연락",
        status: "temp",
        now: "자동 안내는 결제 완료 화면뿐. 리마인드·변경 안내는 운영자 수동.",
        leak: "전날 리마인드가 없어 노쇼 위험이 온전히 남는다.",
        data: "GAS 시트",
        gap: "참가 확정·전날 리마인드 알림 자동화 (기수제의 리마인드 GAS 문법 재사용 가능).",
        roadmap: [2],
      },
      {
        key: "after",
        name: "이후",
        action: "다음 모임 소식을 받고 다시 온다",
        touch: "카카오 채널 · 인스타",
        status: "none",
        now: "재방문 동선이 없다 — 참가 이력도, 관심 알림도 남지 않는다.",
        leak: "여정의 종점이 막다른 길 — 다시 오려면 처음(발견)부터.",
        data: "-",
        gap: "회원(카카오 로그인) + 참가 이력·알림 수신 동의. 북클럽 커뮤니티 명세 7건과 접점 — 계정을 하나로 볼지 결정 필요.",
        roadmap: [5],
      },
    ],
  },
  {
    key: "goods",
    name: "굿즈 구매",
    persona: "모임에 왔다가 또는 피드에서 굿즈를 보고 사고 싶어진 사람",
    stages: [
      {
        key: "browse",
        name: "탐색",
        action: "샵 목록·상세에서 사진과 설명을 본다",
        touch: "/shop · /shop/[slug] (사진 스택·sold out/coming soon)",
        status: "done",
        now: "상세 3종 완성. 가격·구매 문법 유지 (워크룸식).",
        leak: "sold out 이면 재입고 알림 없이 끝.",
        data: "goods-config.ts",
      },
      {
        key: "decide",
        name: "결정",
        action: "카트에 담는다",
        touch: "/cart",
        status: "temp",
        now: "카트 실동작 (localStorage).",
        leak: "기기 밖에선 카트가 없다.",
        data: "localStorage",
        roadmap: [5],
      },
      {
        key: "pay",
        name: "결제",
        action: "주문·결제한다",
        touch: "카트 '주문하기' → 티켓형(이름·전화)",
        status: "temp",
        now: "굿즈 전용 결제 흐름은 미완 — 원데이 흐름의 재사용 설계만 있다. PG 심사 대기와 겹친다.",
        leak: "결제로 이어지는 길 자체가 아직 없다.",
        data: "-",
        gap: "굿즈 주문·재고 차감·결제 연동 (로드맵 3~4).",
        roadmap: [3, 4],
      },
      {
        key: "receive",
        name: "수령",
        action: "받아 간다",
        touch: "현장 수령 (배송 없음 — 주소를 수집하지 않는 원칙과 맞물림)",
        status: "none",
        now: "수령 안내 흐름이 없다.",
        leak: "사고도 어떻게 받는지 모른다 — 문의로만 해결.",
        data: "-",
        gap: "⚠ 결정 필요: 배송을 열 것인가? 열면 주소 수집이 필요해져 '주소 등 불필요 정보 미수집' 원칙(라운드 7)을 재검토해야 한다. 현장 수령 유지면 수령 안내만 설계하면 된다.",
        roadmap: [4],
      },
    ],
  },
  {
    key: "member",
    name: "재방문·회원 (미래)",
    persona: "두 번째 방문부터의 모든 사람 — 지금은 매번 처음부터 다시 시작한다",
    stages: [
      {
        key: "login",
        name: "로그인",
        action: "계정으로 들어온다",
        touch: "/login (현재 안내 토스트 = 6순위 목업)",
        status: "none",
        now: "화면 자리만 있다. 인증 없음.",
        leak: "회원이 될 방법이 없다 — 트랙 전체가 미개통.",
        data: "-",
        gap: "카카오 소셜 우선 (기획 확정) — 인증 제공자·세션 방식 결정 필요.",
        roadmap: [5],
      },
      {
        key: "sync",
        name: "이어 하기",
        action: "다른 기기에서도 카트·저장·주문 내역을 본다",
        touch: "(없음)",
        status: "none",
        now: "카트·저장이 기기 안에 갇혀 있다.",
        leak: "기기를 바꾸는 순간 이어 하기가 끊긴다.",
        data: "localStorage → 서버 승격 대상",
        gap: "회원 DB 스키마 (회원·주문·카트·저장) + localStorage 이관 설계.",
        roadmap: [2, 5],
      },
      {
        key: "history",
        name: "내역·재참여",
        action: "참가 이력을 보고 다음 모임을 신청한다",
        touch: "(없음)",
        status: "none",
        now: "이력이라는 개념 자체가 없다.",
        leak: "재참여를 권할 근거 데이터가 없다.",
        data: "-",
        gap: "주문 DB(로드맵 2)가 먼저 있어야 이력이 생긴다. 북클럽 기수제 이력과 통합할지 결정 필요.",
        roadmap: [2, 5],
      },
    ],
  },
]

/** 로드맵 — 위 여정의 빈틈에서 도출된 구축 순서 (여정이 먼저, 로드맵은 그 결과) */
const ROADMAP = [
  {
    n: 1,
    name: "정적 카탈로그 + 로컬 카트",
    state: "done" as Status,
    desc: "홈·목록·상세·카트(localStorage)·티켓형 접수. 지금 상태.",
  },
  {
    n: 2,
    name: "주문 서버화",
    state: "none" as Status,
    desc: "주문 DB + 어드민 조회. 정본을 시트에서 DB로. ⚠ 토스 심사와 무관하게 지금 착수 가능 — 심사 대기 기간의 최적 작업.",
  },
  {
    n: 3,
    name: "결제 정식 오픈",
    state: "temp" as Status,
    desc: "토스 위젯은 구현돼 있음 — PG 신청 심사 대기 중. 승인되면 원데이부터 열고 굿즈로 확장.",
  },
  {
    n: 4,
    name: "굿즈 주문·수령",
    state: "none" as Status,
    desc: "재고 차감·수령(또는 배송 — 주소 수집 원칙 재검토 필요) 흐름.",
  },
  {
    n: 5,
    name: "회원",
    state: "none" as Status,
    desc: "카카오 로그인 + 카트·저장 서버 승격 + 참가 이력. 북클럽 커뮤니티 명세와 계정 통합 여부 결정 필요.",
  },
]

/** 운영자 결정이 필요한 항목 — 설계를 진행하려면 이 답들이 먼저 필요하다 */
const DECISIONS = [
  { q: "북클럽 회원과 레이지클럽 계정을 하나로 보나?", why: "DB 스키마·로그인 동선·커뮤니티 명세 7건이 전부 여기 걸린다" },
  { q: "인증은 카카오 소셜 단독으로 시작하나?", why: "기획은 카카오 우선 — 단독이면 구현이 절반으로 준다" },
  { q: "DB 호스팅 (Supabase / Vercel Postgres / 기타)", why: "로드맵 2의 첫 삽. 어드민 화면 방식도 따라온다" },
  { q: "굿즈에 배송을 여나, 현장 수령을 유지하나?", why: "'주소 미수집' 원칙(라운드 7)의 재검토 여부가 갈린다" },
]

export function JourneyDoc() {
  const [trackKey, setTrackKey] = useState(TRACKS[0].key)
  const track = TRACKS.find((t) => t.key === trackKey)!
  const [stageKey, setStageKey] = useState(track.stages[0].key)
  const stage = track.stages.find((x) => x.key === stageKey) ?? track.stages[0]

  const pickTrack = (k: string) => {
    setTrackKey(k)
    setStageKey(TRACKS.find((t) => t.key === k)!.stages[0].key)
  }

  return (
    <div className={s.page}>
      <header className={s.head}>
        <p className={s.kicker}>LAZY CLUB — 커머스 설계 문서 v1 (2026-08-18)</p>
        <h1 className={s.title}>고객여정이 먼저, 로드맵은 그 결과</h1>
        <p className={s.lede}>
          <strong>고객여정</strong>은 고객이 겪는 흐름이고, <strong>커머스 로드맵</strong>은 우리가
          만드는 순서입니다 — 같은 것이 아닙니다. 이 문서는 여정을 트랙별로 펼쳐 각 단계의 현재
          상태를 정직하게 표기하고, 그 빈틈에서 로드맵과 결정 항목을 도출합니다.
        </p>
        <div className={s.legend}>
          <span><i className={`${s.dot} ${s.done}`} />구현됨</span>
          <span><i className={`${s.dot} ${s.temp}`} />임시 (동작하지만 완성이 아님)</span>
          <span><i className={`${s.dot} ${s.none}`} />없음 (설계 필요)</span>
        </div>
      </header>

      <nav className={s.tracks} aria-label="여정 트랙">
        {TRACKS.map((t) => (
          <button
            key={t.key}
            className={`${s.trackBtn} ${t.key === trackKey ? s.trackOn : ""}`}
            onClick={() => pickTrack(t.key)}
          >
            {t.name}
          </button>
        ))}
      </nav>
      <p className={s.persona}>{track.persona}</p>

      {/* ── 여정 지도 — 전 단계가 한눈에 보이고, 각 단계의 이탈점(고객이 새는 곳)이
          우측 가지로 붙는다 (운영자 2026-08-18 "고객여정도 그려야지. 그래야 우리가
          누락된 부분을 파악할 수 있어"). 노드를 누르면 아래 상세가 바뀐다. */}
      <div className={s.map} role="tablist" aria-label="여정 지도">
        {track.stages.map((st, i) => (
          <div key={st.key} className={s.mapRow}>
            <div className={s.mapRail}>
              <i className={`${s.mapNode} ${s[st.status]}`} aria-hidden />
              {i < track.stages.length - 1 && <i className={s.mapLine} aria-hidden />}
            </div>
            <div className={s.mapBody}>
              <button
                role="tab"
                aria-selected={st.key === stage.key}
                className={`${s.mapBtn} ${st.key === stage.key ? s.mapBtnOn : ""}`}
                onClick={() => setStageKey(st.key)}
              >
                <span className={s.mapName}>{i + 1}. {st.name}</span>
                <span className={s.mapAction}>{st.action}</span>
              </button>
              {st.leak && (
                <p className={s.mapLeak}>
                  <span className={s.leakMark} aria-hidden>↘</span> {st.leak}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <section key={`${trackKey}-${stage.key}`} className={s.panel}>
        <div className={s.panelHead}>
          <h2 className={s.panelTitle}>{stage.name}</h2>
          <span className={`${s.badge} ${s[stage.status]}`}>{STATUS_LABEL[stage.status]}</span>
        </div>
        <dl className={s.rows}>
          <div className={s.row}><dt>고객 행동</dt><dd>{stage.action}</dd></div>
          <div className={s.row}><dt>화면</dt><dd>{stage.touch}</dd></div>
          <div className={s.row}><dt>지금</dt><dd>{stage.now}</dd></div>
          <div className={s.row}><dt>데이터</dt><dd>{stage.data}</dd></div>
          {stage.gap && (
            <div className={`${s.row} ${s.gapRow}`}>
              <dt>빈틈</dt>
              <dd>
                {stage.gap}
                {stage.roadmap && (
                  <span className={s.rmRefs}>
                    {stage.roadmap.map((n) => (
                      <a key={n} href="#roadmap" className={s.rmRef}>로드맵 {n}</a>
                    ))}
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section id="roadmap" className={s.roadmap}>
        <h2 className={s.secTitle}>커머스 로드맵 — 여정의 빈틈에서 도출한 구축 순서</h2>
        <ol className={s.rmList}>
          {ROADMAP.map((r) => (
            <li key={r.n} className={s.rmItem}>
              <div className={s.rmHead}>
                <span className={s.rmNum}>{r.n}</span>
                <span className={s.rmName}>{r.name}</span>
                <span className={`${s.badge} ${s[r.state]}`}>{STATUS_LABEL[r.state]}</span>
              </div>
              <p className={s.rmDesc}>{r.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={s.decisions}>
        <h2 className={s.secTitle}>진행 전 운영자 결정 필요 4건</h2>
        <ol className={s.dcList}>
          {DECISIONS.map((d, i) => (
            <li key={i} className={s.dcItem}>
              <p className={s.dcQ}>{d.q}</p>
              <p className={s.dcWhy}>{d.why}</p>
            </li>
          ))}
        </ol>
        <p className={s.foot}>
          이 문서는 기획 초안입니다 — 결정이 내려지면 해당 칸을 갱신하고, 로드맵 2(주문 서버화)의
          상세 설계(DB 스키마·어드민)로 넘어갑니다.
        </p>
      </section>
    </div>
  )
}
