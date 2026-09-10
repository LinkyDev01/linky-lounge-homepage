import type { Metadata } from "next"
import { WorkroomShell } from "../Shell"
import { LazyclubLink } from "../LazyclubLink"
import { BASE } from "../base-path"
import { KAKAO_CHAT_URL } from "@/app/(main)/lazyday/support"
import { PAST_MEETINGS } from "./past-meetings"
import { HOSTS_FIELDS, HOSTS_POSTER } from "./hosts-config"
import styles from "../home.module.css"
import h from "./hosts.module.css"

/**
 * 호스트 모집 — lazy-club.com/hosts (v3, 2026-09-10 운영자 카드뉴스 5장 반영).
 *
 * 구도 = **모임 상세와 같은 것**(운영자 "1페이지가 포스터고, 2~5는 정보를 바탕으로 나머지 상세정보를
 * 다른 모임소개 신청링크로 연결짓고"): 좌 sticky 포스터(카드뉴스 1장) · 우 요약(카테고리 '레이지클럽' →
 * 제목 → 소개 세 단락(2장 원문, 명조) → 모임 운영 안내(3장) → 잉크 칩 '기획서 쓰기' = 모임 상세의
 * '구매하기' 자리) · 하단 본문 컬럼(저희가 준비하는 것 / 이런 분 / 모임 페이지를 만들 때 필요한 것(4장) /
 * 만나서 이야기합니다(5장) / 절차 / 지금까지 열린 모임 / 기획서 링크). 레이아웃 클래스는 home.module.css
 * 의 .nsq* / .product* 를 **그대로 소비**(수정 0) — ProductDetail 은 가격·카트가 붙어 있어 쓰지 않는다.
 *
 * 표기: 사용자 화면은 **'호스트'**(운영자 원문 — 카드·카드뉴스 전부 호스트), '레이지클럽'은 붙여 쓴다.
 * 관리 화면·시트 이름('모임장 기획서')과 방침 문구는 그대로다(시트 이름을 바꾸면 GAS 가 새 탭을 만든다).
 * v2 문체 원칙(주어 '저희', 말하듯 쓴 제목, 동사가 있는 문장)은 본문 단락에 그대로 살아 있다.
 * ⚠ 운영자 원문이 아닌 문장은 초안(교체 대상). 색인은 레이아웃 호스트 판정(lazy-club.com 만 index), 사이트맵 등재.
 */

export const metadata: Metadata = {
  title: "호스트 모집 — 레이지클럽",
  description: "레이지클럽 호스트를 모집합니다. 자신만의 뚜렷한 주제로 4회차의 모임을 이끌어 주실 분을 찾습니다.",
}

/** 모임 페이지를 만들 때 필요한 것 — 카드뉴스 4장 원문 */
const NEEDS = [
  { title: "모임 소개", body: "모임의 전반적인 기획 의도, 각 회차별 다룰 콘텐츠(도서, 영화 등) 및 세부 진행 내용" },
  { title: "호스트 자기소개", body: "이름, 나이, 성별, 전화번호와 참여자들에게 호스트 본인을 알릴 수 있는 소개 글" },
  { title: "호스트 프로필 사진", body: "본인을 나타낼 수 있는 선명한 컬러 사진" },
  { title: "인스타그램 아이디", body: "" },
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

            {/* 소개 — 카드뉴스 2장 원문('레이지 클럽' → '레이지클럽'만 붙여 씀) */}
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

            {/* 모임 운영 안내 — 카드뉴스 3장 원문 + '문의'(모임 상세와 같은 자리) */}
            <div className={styles.productFields}>
              {HOSTS_FIELDS.map((f) => (
                <div key={f.label} className={styles.productField}>
                  <p>{f.label}</p>
                  {f.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ))}
              <div className={styles.productField}>
                <p>문의</p>
                <p>
                  <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer">
                    카카오톡 채널
                  </a>
                </p>
              </div>
            </div>

            {/* 모임 상세의 '구매하기' 자리 — 여기서는 기획서로 */}
            <div className={styles.productActions}>
              <LazyclubLink href={`${BASE}/hosts/apply`} className={styles.chipBtn}>
                기획서 쓰기
              </LazyclubLink>
            </div>
            <p className={h.actionNote}>질문 여섯 개에 답하면 됩니다. 중간에 나가도 적은 내용은 남아 있습니다.</p>
          </div>

          {/* 하단 본문 — 모임 상세 본문 컬럼(포스터 오른쪽 460px) */}
          <section className={styles.nsqBody}>
            <div className={styles.nsqBodyInner}>
              <div className={h.body}>
                <section className={h.section}>
                  <h2 className={h.sectionTitle}>저희가 준비하는 것</h2>
                  <p className={h.para}>
                    호스트에게는 레이지클럽이라는 이름과, 그 이름으로 열리는 자리를 드립니다. 장소는 사당, 을지로,
                    시청, 강남, 성수, 홍대 가운데 함께 정합니다. 멤버를 모으고 인터뷰하고, 결제와 안내를 챙기는
                    일도 저희가 합니다. 홈과 일정, 사람 페이지에 모임과 호스트를 소개하는 일까지 저희 몫입니다.
                    호스트는 모임에만 마음을 쓰시면 됩니다.
                  </p>
                </section>

                <section className={h.section}>
                  <h2 className={h.sectionTitle}>이런 분과 함께하고 싶습니다</h2>
                  <p className={h.para}>
                    자기 모임을 처음부터 끝까지 직접 만들고 이끌어 가실 분입니다. 어떤 이야기를 나누고 싶은지,
                    어떤 사람들과 어떤 시간을 보내고 싶은지를 먼저 그려 오시면, 네 번의 만남이 실제 모임이 될
                    때까지 저희가 곁에서 함께 준비합니다. 레이지클럽이라는 이름을 함께 쓰는 일이니, 이 이름이
                    지켜 온 결도 함께 지켜 주셨으면 합니다.
                  </p>
                </section>

                <section className={h.section}>
                  <h2 className={h.sectionTitle}>모임 페이지를 만들 때 필요한 것</h2>
                  <p className={h.para}>웹사이트의 모임 상세 페이지 구성을 위해 아래의 자료가 필요합니다.</p>
                  <div className={h.steps}>
                    {NEEDS.map((n, i) => (
                      <div key={n.title} className={h.step}>
                        <span className={h.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                        <p className={h.stepBody}>
                          <span className={h.stepTitle}>{n.title}</span>
                          {n.body}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className={h.note}>
                    기획서에서는 모임 소개와 자기소개를 먼저 받습니다. 프로필 사진과 인스타그램 아이디는 만나서
                    이야기한 뒤에 받습니다.
                  </p>
                </section>

                <section className={h.section}>
                  <h2 className={h.sectionTitle}>만나서 이야기합니다</h2>
                  <p className={h.para}>
                    기획서를 보내 주시면 내용을 확인한 후 개별 연락을 드려 대면 인터뷰 일정을 조율합니다.
                    링키라운지에서 뵙거나 전화를 드립니다. 함께할지를 서로 정하는 자리이고, 일정과 장소, 정원은
                    그 자리에서 함께 정합니다. 이메일(contact@lazy-club.com)이나 인스타그램 DM으로 남겨 주셔도
                    됩니다.
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
                      <span className={h.stepTitle}>이야기</span>링키라운지에서 뵙거나 전화로. 일정과 장소, 정원을 함께 정합니다.
                    </p>
                  </div>
                  <div className={h.step}>
                    <span className={h.stepNum}>03</span>
                    <p className={h.stepBody}>
                      <span className={h.stepTitle}>개설</span>모임 페이지가 열리고 홈과 일정에 오릅니다. 그때부터 멤버를 맞는 일은 저희가 합니다.
                    </p>
                  </div>
                </div>

                {/* 증거: 지금까지 이 이름으로 열린 모임 */}
                <div className={h.stripBlock}>
                  <span className={h.stripLabel}>지금까지 열린 모임</span>
                  <div className={h.strip}>
                    {PAST_MEETINGS.map((p) => (
                      <figure key={p.src} className={h.card}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.src} alt={p.cap} loading="lazy" decoding="async" draggable={false} />
                        <figcaption className={h.cardCap}>{p.cap}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>

                <p className={h.cta}>
                  <LazyclubLink href={`${BASE}/hosts/apply`} className={h.ctaLink}>
                    모임 기획서 쓰기
                    <svg className={h.ctaArrow} width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                      <path d="M1 7L7 1M7 1H2.5M7 1V5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </LazyclubLink>
                </p>
                <p className={h.ctaNote}>질문 여섯 개에 답하면 됩니다.</p>
              </div>
            </div>
          </section>
        </section>
      </main>
    </WorkroomShell>
  )
}
