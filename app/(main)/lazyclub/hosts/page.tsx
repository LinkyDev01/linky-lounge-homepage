import type { Metadata } from "next"
import { WorkroomShell } from "../Shell"
import { LazyclubLink } from "../LazyclubLink"
import { BASE } from "../base-path"
import { HOSTS_FIELDS, HOSTS_POSTER } from "./hosts-config"
import styles from "../home.module.css"
import h from "./hosts.module.css"

/**
 * 호스트 모집 — lazy-club.com/hosts (v5, 2026-09-10 카드 원문 텍스트판).
 *
 * 운영자 "저걸 텍스트로 적어달라는 의미. 톤앤매너 맞추어서" — 카드뉴스 2~5장의 **문장을 그대로** 옮기고
 * 서식만 사이트 것(모임 상세 구도)을 쓴다. 페이지가 지어낸 문장·항목은 없다: v3 의 초안 단락(저희가 준비하는 것 /
 * 이런 분 / 절차 / 지난 모임 / 안내문)과 원문에 없던 '모집 마감'·'문의 카카오톡'은 두지 않는다.
 * 이미지판은 /hosts/cards(링크 없음·noindex).
 *
 * 구도: 좌 sticky 포스터(1장) · 우 카테고리 '레이지클럽' → 제목(2장 머리글, '레이지 클럽'은 카테고리 줄로) →
 * 2장 세 단락 → 3장 운영 안내(productFields) → 잉크 칩 '기획서 쓰기'(승인된 기획서 폼 진입) ·
 * 하단 본문 컬럼(460)에 4장(제목·문장·항목 1~4)과 5장(문장) → 텍스트 링크 '기획서 쓰기 ↗'.
 * 원문 조정은 두 곳뿐: '레이지 클럽' → '레이지클럽'(운영자 2026-09-10 표기 확정), 5장의 사이트 주소 줄은 뺐다(이 사이트다).
 * 레이아웃 클래스는 home.module.css 소비만(수정 0).
 */

export const metadata: Metadata = {
  title: "호스트 모집 — 레이지클럽",
  description: "레이지클럽 호스트를 모집합니다. 자신만의 뚜렷한 주제를 가지고 4회차의 모임을 이끌어주실 분을 찾고 있습니다.",
}

/** 호스트 지원 시 필요 사항 — 카드뉴스 4장 원문(항목·줄 그대로) */
const NEEDS: { title: string; lines: string[] }[] = [
  { title: "모임 소개", lines: ["모임의 전반적인 기획 의도", "각 회차별 다룰 콘텐츠(도서, 영화 등) 및 세부 진행 내용"] },
  { title: "호스트 자기소개", lines: ["이름, 나이, 성별, 전화번호 필수 기재", "참여자들에게 호스트 본인을 알릴 수 있는 소개 글"] },
  { title: "호스트 프로필 사진", lines: ["본인을 나타낼 수 있는 선명한 컬러 사진"] },
  { title: "인스타그램 아이디", lines: [] },
]

export default function HostsPage() {
  return (
    <WorkroomShell>
      <main className={styles.content}>
        <section className={styles.nsqHero}>
          <figure className={`${styles.nsqFigure} ${styles.nsqFigureSpan} ${styles.nsqFigureSticky}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HOSTS_POSTER} alt="WE ARE HIRING — NEW LEADERS. 레이지클럽 호스트 모집 포스터" />
          </figure>

          <div className={styles.nsqInfo}>
            <div className={styles.itemCat}>레이지클럽</div>
            <h1 className={`${styles.productTitle} ${styles.productTitleNoSub}`}>호스트를 모집합니다.</h1>

            {/* 카드뉴스 2장 원문 */}
            <div className={styles.productDesc}>
              <p>
                레이지클럽은 일상 속에서 느긋함을 찾길 소망하는 모임 플랫폼입니다. 레이지데이 북클럽으로 첫걸음을
                내디뎠으며, 앞으로는 더 다양하고 깊이 있는 취향을 아우르기 위해 &lsquo;레이지클럽&rsquo;으로 영역을
                넓혀가려 합니다.
              </p>
              <p>새로운 확장을 앞두고, 레이지클럽과 함께 느긋한 시간을 만들어갈 새로운 호스트를 모십니다.</p>
              <p>
                자신만의 뚜렷한 주제를 가지고 4회차의 모임을 이끌어주실 분을 찾고 있습니다. 책, 영화 등 매개체는
                무엇이든 자유롭게 선택하실 수 있으며, 4번의 만남이 유기적으로 연결될 수 있다면 어떤 기획이든
                환영합니다.
              </p>
            </div>

            {/* 카드뉴스 3장 '모임 운영 안내' 원문 */}
            <div className={styles.productFields}>
              {HOSTS_FIELDS.map((f) => (
                <div key={f.label} className={styles.productField}>
                  <p>{f.label}</p>
                  {f.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ))}
            </div>

            <div className={styles.productActions}>
              <LazyclubLink href={`${BASE}/hosts/apply`} className={styles.chipBtn}>
                기획서 쓰기
              </LazyclubLink>
            </div>
          </div>

          <section className={styles.nsqBody}>
            <div className={styles.nsqBodyInner}>
              <div className={h.body}>
                {/* 카드뉴스 4장 원문 */}
                <section className={h.section}>
                  <h2 className={h.sectionTitle}>호스트 지원 시 필요 사항</h2>
                  <p className={h.para}>웹사이트의 모임 상세 페이지 구성을 위해 아래의 자료가 필요합니다.</p>
                  <div className={h.steps}>
                    {NEEDS.map((n, i) => (
                      <div key={n.title} className={h.step}>
                        <span className={h.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                        <p className={h.stepBody}>
                          <span className={h.stepTitleBlock}>{n.title}</span>
                          {n.lines.map((line) => (
                            <span key={line} className={h.stepLine}>
                              {line}
                            </span>
                          ))}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 카드뉴스 5장 원문 */}
                <section className={h.section}>
                  <p className={h.para}>
                    지원을 원하시는 분은 이메일(contact@lazy-club.com) 또는 인스타그램 DM을 통해 위 내용을 남겨주세요.
                    보내주신 내용을 확인한 후, 개별 연락을 통해 대면 인터뷰 일정을 조율할 예정입니다.
                  </p>
                </section>

                <p className={h.cta}>
                  <LazyclubLink href={`${BASE}/hosts/apply`} className={h.ctaLink}>
                    기획서 쓰기
                    <svg className={h.ctaArrow} width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                      <path d="M1 7L7 1M7 1H2.5M7 1V5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </LazyclubLink>
                </p>
              </div>
            </div>
          </section>
        </section>
      </main>
    </WorkroomShell>
  )
}
