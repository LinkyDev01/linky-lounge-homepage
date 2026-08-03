import { SEASON } from "../../season-config"
import s from "./home-v3.module.css"

/**
 * 홈 v3 시안 — 정적 골격 (docs/redesign/03-layout-spec.md v2)
 * - 카피: docs/redesign/05-copy-elements.md 확정 카피 v1.1 전문
 * - 모션 없음 (골격 승인 후 다음 세션), 그래픽 자리는 회색 플레이스홀더
 * - ?type=a|b|c 서체 전환: a 마루부리+Pretendard / b NotoSerifKR900+Pretendard / c 마루부리+SUIT
 */

type TypeVariant = "a" | "b" | "c"

const DISPLAY_FONT_FILE: Record<TypeVariant, string> = {
  a: "/fonts/home-v3/MaruBuri-Bold.subset.woff2",
  b: "/fonts/home-v3/NotoSerifKR-900.subset.woff2",
  c: "/fonts/home-v3/MaruBuri-Bold.subset.woff2",
}

const TYPE_LABEL: Record<TypeVariant, string> = {
  a: "a — 마루 부리 + Pretendard",
  b: "b — Noto Serif KR 900 + Pretendard",
  c: "c — 마루 부리 + SUIT",
}

/** 시안용 카드 목업 데이터 — 1·2번은 실제 지난 원데이 토크, 3번은 문법·뱃지 시연용 가상 예시 */
const ONE_DAY_CARDS = [
  {
    kind: "photo" as const,
    badge: "closed" as const,
    title: "브람스를 좋아하세요...",
    author: "프랑수아즈 사강",
    meta: "8/2 (일) 19:00–22:00 · 링키라운지",
  },
  {
    kind: "graphic" as const,
    badge: "closed" as const,
    title: "시지프 신화",
    author: "알베르 카뮈",
    meta: "8/9 (일) 19:00–22:00 · 링키라운지",
  },
  {
    kind: "graphic" as const,
    badge: "open" as const,
    title: "변신",
    author: "프란츠 카프카",
    meta: "9월 · 링키라운지",
  },
]

const MARQUEE_KEYWORDS = [
  "좋은 질문",
  "사유의 마찰",
  "엇갈리는 시선",
  "대화의 밀도",
  "느린 속도",
  "몰입",
  "환대",
  "이어지는 대화",
]

const BRAND_PARAGRAPHS = [
  "문학과 철학, 예술의 한가운데서, 쉽게 공감하는 대화보다 서로 다른 시선과 부딪히는 순간을 기다리는 사람들이 모입니다. 무색무취한 이야기에 고개만 끄덕이지 않습니다. 서로의 시선이 엇갈리는 순간, 고립되어 있던 내 관점이 타인의 시선에 부딪혀 언제든 깨질 수 있음을 받아들이며 그 순간을 환대합니다.",
  "비슷한 결을 가졌다고 같은 결론에 도달할 필요는 없습니다. 같은 이야기 앞에 멈춰 서도 이어지는 생각은 저마다 엇갈리고, 그 불협화음 속에서 우리가 가진 생각의 윤곽은 더 또렷해집니다.",
  "그래서 모든 멤버는 참여에 앞서 인터뷰를 진행합니다. 서로의 결을 미리 엿보며, 우리의 대화가 앞으로 어떻게 얽혀 나갈지 함께 가늠해 보는 첫 출발점이 되어 줍니다.",
]

/** 요일 라인 — season-config 단일 출처에서 파생 (같은 시간대 연속 요일 병합) */
function dayLines(): string[] {
  const lines: string[] = []
  let labels: string[] = []
  let time = ""
  for (const d of SEASON.days) {
    if (d.time === time) {
      labels.push(d.label)
    } else {
      if (labels.length) lines.push(`${labels.map((l) => l.replace("요일", "")).join("·")}요일 ${time}`)
      labels = [d.label]
      time = d.time
    }
  }
  if (labels.length) lines.push(`${labels.map((l) => l.replace("요일", "")).join("·")}요일 ${time}`)
  return lines.map((l) => l.replace(", ", " · "))
}

export default async function HomeV3Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const sp = await searchParams
  const t: TypeVariant = sp.type === "b" || sp.type === "c" ? sp.type : "a"

  return (
    <div className={s.page} data-type={t}>
      <link rel="preload" href={DISPLAY_FONT_FILE[t]} as="font" type="font/woff2" crossOrigin="anonymous" />

      {/* 1280px 한정 — 축 좌측 바깥 세로쓰기 메타 1개 (03 §0) */}
      <div className={s.sideMeta} aria-hidden>
        LAZYDAY BOOKCLUB
      </div>

      {/* ① 히어로 — 오프셋 금지 */}
      <section className={s.hero}>
        <div className={s.shell}>
          <header className={s.nav}>
            {/* 로고 화면 노출 = mono-ink (로고 종결 규칙 2026-08-03) */}
            <img className={s.navLogo} src="/assets/logo/logo-mono-ink.svg" alt="레이지데이 북클럽" />
            <nav className={s.navMenu}>
              <a href="#season">기수제</a>
              <a href="#oneday">원데이</a>
              <a href="#brand">브랜드</a>
            </nav>
          </header>

          <div className={s.heroGrid}>
            <div className={s.heroText}>
              <h1 className={s.heroHeadline}>
                <span className={s.hl1}>타인의 낯선 시선을</span>
                <span className={s.hl2}>기꺼이 환대하는 분들</span>
              </h1>
              <p className={s.heroSub}>레이지데이 북클럽 {SEASON.name} 모집 · 두 달, 네 권, 한 테이블</p>
              <a className={s.cta} href="#season">
                북클럽({SEASON.name}) 알아보기
              </a>
            </div>
            {/* 그래픽 자산 자리 — 4:5, 390px에서는 헤드라인 아래 축소 배치 */}
            <div className={s.heroArt}>
              <div className={s.ph45}>그래픽 자산 자리 · 4:5</div>
            </div>
          </div>
        </div>
        {/* 하단 악센트 띠 8px 풀블리드 (색은 잠정 옐로 — 팔레트 실측 후 확정) */}
        <div className={s.accentBand} aria-hidden />
      </section>

      {/* ② 시즌 모집 — 신문 공고 박스, 오프셋 금지 */}
      <section id="season" className={s.season}>
        <div className={s.shell}>
          <div className={s.noticeBox}>
            <header className={s.noticeHead}>
              <h2 className={s.noticeTitle}>레이지데이 북클럽 {SEASON.name} 멤버를 모집합니다.</h2>
              <span className={s.stamp}>모집중</span>
            </header>
            <div className={s.doubleRule} aria-hidden />
            <dl className={s.noticeRows}>
              <div className={s.noticeRow}>
                <dt>기간</dt>
                <dd>{SEASON.periodLabel}</dd>
              </div>
              <div className={s.noticeRow}>
                <dt>요일</dt>
                <dd>
                  {dayLines().map((l) => (
                    <span key={l} className={s.dayLine}>
                      {l}
                    </span>
                  ))}
                </dd>
              </div>
              <div className={s.noticeRow}>
                <dt>발제문</dt>
                <dd>질문을 통해 각자가 가진 사유의 궤적을 엿봅니다</dd>
              </div>
            </dl>
          </div>
          <a className={s.cta} href="/lazyday">
            북클럽({SEASON.name}) 알아보기
          </a>
        </div>
      </section>

      {/* ③ 원데이 북토크 — 오프셋 구역 1 (카드 2문법 + 계단) */}
      <section id="oneday" className={s.oneday}>
        <div className={s.shell}>
          <h2 className={s.sectionTitle}>원데이 북토크</h2>
          <p className={s.sectionLead}>한 권의 책으로 밀도 있는 시간을 나눕니다</p>

          <ul className={s.cardGrid}>
            {ONE_DAY_CARDS.map((c) => (
              <li key={c.title} className={s.card}>
                <div className={c.kind === "photo" ? s.cardMediaPhoto : s.cardMediaGraphic}>
                  {c.kind === "photo" ? "인물 사진 자리 · 4:5" : "그래픽 자리 · 4:3"}
                </div>
                <div className={s.cardBody}>
                  <span className={c.badge === "open" ? s.badgeOpen : s.badgeClosed}>
                    {c.badge === "open" ? "모집중" : "마감"}
                  </span>
                  <h3 className={s.cardTitle}>
                    『{c.title}』 <span className={s.cardAuthor}>{c.author}</span>
                  </h3>
                  <p className={s.cardMeta}>{c.meta}</p>
                </div>
              </li>
            ))}
          </ul>

          <a className={s.moreLink} href="#oneday">
            전체 보기 →
          </a>

          {/* 빈 상태 대체 기능 블록 — UI 목업 (동작 없음) */}
          <div className={s.notifyBlock}>
            <p className={s.notifyLabel}>모집 알림 신청</p>
            <form className={s.notifyForm} action="#" aria-label="모집 알림 신청 (목업)">
              <input className={s.notifyInput} type="email" placeholder="이메일 주소" disabled />
              <button className={s.notifyBtn} type="button" disabled>
                알림 받기
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ④ 브랜드/후기 — 오프셋 구역 2 */}
      <section id="brand" className={s.brand}>
        <div className={s.shell}>
          <h2 className={s.sectionTitle}>레이지데이의 결</h2>
          <div className={s.brandGrid}>
            <div className={s.brandBody}>
              {BRAND_PARAGRAPHS.map((p) => (
                <p key={p.slice(0, 12)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
        {/* 마퀴 자리 — 색면 풀블리드 띠 (정적 골격: 애니메이션 없음) */}
        <div className={s.marquee}>
          <div className={s.shell}>
            <p className={s.marqueeText}>{MARQUEE_KEYWORDS.join("  ·  ")}</p>
          </div>
        </div>
        <div className={s.shell}>
          <a className={s.brandLink} href="#brand">
            About Lazyday Bookclub
          </a>
        </div>
      </section>

      {/* ⑤ 클로징 CTA — 오프셋 금지, 전부 축 정렬 */}
      <section className={s.closing}>
        <div className={s.shell}>
          <h2 className={s.closingHeadline}>보지 못한 맹점을 날카롭게 짚어내 줄 타인의 시선을 마주합니다</h2>
          <a className={s.cta} href="/lazyday">
            북클럽({SEASON.name}) 알아보기
          </a>
          <footer className={s.footer}>
            <img className={s.footerLogo} src="/assets/logo/logo-mono-ink.svg" alt="" aria-hidden />
            <span className={s.footerMeta}>© 2026 Lazyday Bookclub</span>
          </footer>
        </div>
      </section>

      {/* 시안 전용 서체 전환기 — 실사이트 이식 시 제거 */}
      <div className={s.typeSwitch}>
        <span className={s.typeSwitchLabel}>{TYPE_LABEL[t]}</span>
        {(["a", "b", "c"] as const).map((v) => (
          <a key={v} href={`?type=${v}`} className={v === t ? s.typeBtnActive : s.typeBtn}>
            {v}
          </a>
        ))}
      </div>
    </div>
  )
}
