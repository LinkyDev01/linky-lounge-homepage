import type { Metadata } from "next"
import { WorkroomShell } from "../../Shell"
import { LazyclubLink } from "../../LazyclubLink"
import { BASE } from "../../base-path"
import styles from "../../home.module.css"
import h from "./hosts-v2.module.css"

/**
 * 모임장 페이지 v2 — **프리뷰 시안** (2026-09-04). 실사이트는 `/hosts`(v1, 09-03 승인)가 그대로 서빙된다.
 * 승인되면 이 트리를 `/hosts` 로 옮기고 v1 을 걷는다.
 *
 * 운영자 지적 3건(09-03 "좋긴 한데")에 대한 응답 — 자세한 근거는 hosts-v2.module.css 머리 주석:
 *   ① 브랜드 문장을 본문에서 뺐다(푸터에 이미 있다 — 반복하면 캐치프레이즈가 된다). 텍스트 대신
 *      **지난 모임 포스터 스트립**(레포 보유 이미지 9장, 전부 4:5)이 "이 이름으로 열린 모임"의 증거가 된다.
 *   ② 안내는 한 화면(세 단락 + 절차 3행)으로 줄이고, 기획서는 `/hosts/v2/apply` 에서 한 화면에 질문 하나씩.
 *   ③ "누구나"가 아니라 **브랜드를 함께 쓸 모임장**을 찾는다 — 주는 것 / 함께하고 싶은 분 / 함께할지를 정하는 자리.
 *      "마음에 두고 있던 이야기 하나면 충분한 시작" 삭제.
 *
 * 2차 (운영자 "딱딱한 느낌 — 메시지보다 문장과 단어 선정, 구조 때문인 것 같다"): 진단 세 가지를 고쳤다.
 *   ① 주어가 기관("레이지클럽이 내어 드립니다/맡습니다") → **"저희"** (운영자 원고 "안녕하세요. 천고든입니다",
 *      폼 "저희가 정리합니다"의 1인칭). ② 명사화 제목("~하는 것", "~정하는 자리") → 말하듯 풀어 쓴 제목.
 *   ③ 명사 나열("접수와 인터뷰, 결제와 안내, 그리고 …까지") → 동사가 있는 문장으로 끊어 쓴다.
 *   UX: 셋째 단락과 절차 3행이 겹치던 것을 줄이고, 링크 아래 "질문 여섯 개" 한 줄로 분량을 미리 알린다.
 *
 * ⚠ 카피는 초안(운영자 교체 대상). 책·영화 언급 없음, 북클럽은 포스터 캡션에 이름만.
 * ⚠ noindex — 시안 라우트. 내비·푸터·사이트맵 어디에도 없다.
 */

export const metadata: Metadata = {
  title: "모임장 (시안 v2) — 레이지클럽",
  description: "레이지클럽의 이름으로 모임을 열어 주실 분을 찾습니다.",
  robots: { index: false, follow: false },
}

/** 지금까지 열린 모임 — 레포 보유 포스터·카드 (전부 4:5). 최근 것이 앞. 캡션은 각 모임의 표기 그대로 */
const PAST = [
  { src: "/linky-lounge/book-club/home-v3/hero-4th-poster.webp", cap: "레이지데이 북클럽 4기" },
  { src: "/linky-lounge/book-club/home-v3/oneday-notsqueezing.webp", cap: "비로소, 나를 쥐어짜지 않는 법" },
  { src: "/linky-lounge/book-club/home-v3/oneday-anxiety-to-calm.webp", cap: "불안을 건너 고요로..." },
  { src: "/linky-lounge/book-club/home-v3/oneday-sisyphus.webp", cap: "원데이 토크, 시지프 신화" },
  { src: "/linky-lounge/book-club/home-v3/oneday-brahms.webp", cap: "원데이 토크, 브람스를 좋아하세요..." },
  { src: "/linky-lounge/book-club/home-v3/oneday-hope.webp", cap: "원데이 토크, 호프" },
  { src: "/linky-lounge/book-club/home-v3/poster-3rd.webp", cap: "레이지데이 북클럽 3기" },
  { src: "/linky-lounge/book-club/home-v3/poster-2nd.webp", cap: "레이지데이 북클럽 2기" },
  { src: "/linky-lounge/book-club/home-v3/poster-1st.webp", cap: "레이지데이 북클럽 1기" },
]

export default function HostsV2Page() {
  return (
    <WorkroomShell>
      <main className={styles.content}>
        <div className={styles.indexHead}>
          <div className={styles.sectionTitle}>
            <span>
              <span>모임장</span>
            </span>
          </div>
        </div>

        <div className={h.wrap}>
          <h1 className={h.headline}>레이지클럽의 이름으로 모임을 열어 주실 분을 찾습니다.</h1>

          {/* ── 증거: 지금까지 이 이름으로 열린 모임 ── */}
          <div className={h.stripBlock}>
            <span className={h.stripLabel}>지금까지 열린 모임</span>
            <div className={h.strip}>
              {PAST.map((p) => (
                <figure key={p.src} className={h.card}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.cap} loading="lazy" decoding="async" draggable={false} />
                  <figcaption className={h.cardCap}>{p.cap}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          <section className={h.section}>
            <h2 className={h.sectionTitle}>저희가 준비하는 것</h2>
            <p className={h.para}>
              모임장에게는 레이지클럽이라는 이름과, 그 이름으로 열리는 자리를 드립니다. 링키라운지를 내어
              드리고 다과를 준비합니다. 멤버를 모으고 인터뷰하고, 결제와 안내를 챙기는 일도 저희가 합니다.
              홈과 일정, 사람 페이지에 모임과 모임장을 소개하는 일까지 저희 몫입니다. 모임장은 모임에만
              마음을 쓰시면 됩니다.
            </p>
          </section>

          <section className={h.section}>
            <h2 className={h.sectionTitle}>이런 분과 함께하고 싶습니다</h2>
            <p className={h.para}>
              자기 모임을 처음부터 끝까지 직접 만들고 이끌어 가실 분입니다. 어떤 이야기를 나누고 싶은지, 어떤
              사람들과 어떤 시간을 보내고 싶은지를 먼저 그려 오시면, 그 그림이 실제 모임이 될 때까지 저희가
              곁에서 함께 준비합니다. 레이지클럽이라는 이름을 함께 쓰는 일이니, 이 이름이 지켜 온 결도 함께
              지켜 주셨으면 합니다.
            </p>
          </section>

          <section className={h.section}>
            <h2 className={h.sectionTitle}>만나서 이야기합니다</h2>
            <p className={h.para}>
              기획서를 보내 주시면 링키라운지에서 뵙거나 전화를 드립니다. 함께할지를 서로 정하는 자리입니다.
              형식과 일정, 정원은 그 자리에서 함께 정합니다.
            </p>
          </section>

          <div className={h.steps}>
            <div className={h.step}>
              <span className={h.stepNum}>01</span>
              <p className={h.stepBody}>
                <span className={h.stepTitle}>기획서</span>질문 여섯 개. 중간에 나가도 적은 내용은 남아 있습니다.
              </p>
            </div>
            <div className={h.step}>
              <span className={h.stepNum}>02</span>
              <p className={h.stepBody}>
                <span className={h.stepTitle}>이야기</span>링키라운지에서 뵙거나 전화로. 형식과 일정, 정원을 함께 정합니다.
              </p>
            </div>
            <div className={h.step}>
              <span className={h.stepNum}>03</span>
              <p className={h.stepBody}>
                <span className={h.stepTitle}>개설</span>모임 페이지가 열리고 홈과 일정에 오릅니다. 그때부터 멤버를 맞는 일은 저희가 합니다.
              </p>
            </div>
          </div>

          <p className={h.cta}>
            <LazyclubLink href={`${BASE}/hosts/v2/apply`} className={h.ctaLink}>
              모임 기획서 쓰기
              <svg className={h.ctaArrow} width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                <path d="M1 7L7 1M7 1H2.5M7 1V5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </LazyclubLink>
          </p>
          <p className={h.ctaNote}>질문 여섯 개에 답하면 됩니다.</p>
        </div>
      </main>
    </WorkroomShell>
  )
}
