import { notFound } from "next/navigation"
import { LazyclubLink } from "../../LazyclubLink"
import { ArrowIcon, WorkroomShell } from "../../Shell"
// 서버 컴포넌트 — Shell("use client") 경유로 값을 받으면 프록시가 찍힌다 (base-path 직수입)
import { BASE } from "../../base-path"
import { findPerson, PEOPLE } from "../../people-config"
import { HostIntro } from "../../HostIntro"
import { ONE_DAY_MEETINGS } from "../../one-day-config"
import { CURRENT_SEASON, CURRENT_SEASON_HOSTS } from "../../season-item"
import styles from "../../home.module.css"

export function generateStaticParams() {
  return PEOPLE.map((p) => ({ slug: p.slug }))
}

/**
 * 인물 전용 페이지 (2026-08-21, B안 승격 — 레퍼런스 p-i-e.kr/people/{slug}).
 * 목록 카드에서 약력이 말줄임되고, 전문은 여기서 본다.
 * 서식은 모임 상세와 공유하는 HostIntro — 이름 제목 + 우측 '오려낸' 사진 + 명조 약력.
 * 하단은 p-i-e 문법의 **역참조**: 이 사람이 진행하는 모임.
 */
export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = findPerson(slug)
  if (!p) notFound()

  // hostSlug 가 지정된 모임만. 진행자 미확정 모임은 자연히 빠진다.
  // 목적지·표기가 제각각이라(기수는 다른 도메인) 한 모양으로 normalize 한 뒤 렌더한다
  type PersonMeeting = {
    key: string
    href: string
    external?: boolean
    thumbnail: string
    title: string
    meta: string
  }
  const oneDay: PersonMeeting[] = ONE_DAY_MEETINGS.filter((m) => m.hostSlug === p.slug).map((m) => ({
    key: m.slug,
    href: `${BASE}/meetings/${m.slug}`,
    thumbnail: m.thumbnail,
    title: m.title,
    // 상태 표기를 가운뎃점으로 잇지 않는다 (운영자 2026-08-21) — 소괄호로 날짜와 구분
    meta: m.date + (m.status !== "open" ? ` (${m.status === "soldout" ? "마감" : "오픈 예정"})` : ""),
  }))
  // 레이지데이 북클럽 현재 기수 — **맨 위** (운영자 2026-08-21). 원데이 모임 목록에는
  // 없는 상품이라(다른 도메인) season-item 단일 출처에서 따로 가져온다
  const meetings: PersonMeeting[] = [
    ...(CURRENT_SEASON_HOSTS.includes(p.slug)
      ? [
          {
            key: CURRENT_SEASON.id,
            href: CURRENT_SEASON.link,
            external: true,
            thumbnail: CURRENT_SEASON.thumbnail,
            title: CURRENT_SEASON.title,
            meta: CURRENT_SEASON.tag,
          },
        ]
      : []),
    ...oneDay,
  ]

  return (
    <WorkroomShell>
      <main className={styles.content}>
        <div className={styles.indexHead}>
          <div className={styles.sectionTitle}>
            <LazyclubLink href={`${BASE}/people`}>
              <span>사람</span>
              <ArrowIcon />
            </LazyclubLink>
          </div>
        </div>

        <section className={styles.personBlock}>
          <HostIntro photo={p.photo} name={p.name} instagram={p.instagram}>
            {p.bio}
          </HostIntro>

          {meetings.length > 0 && (
            <div className={styles.personMeetings}>
              <p className={styles.personMeetingsLabel}>진행하는 모임</p>
              <ul className={styles.personMeetingList}>
                {meetings.map((m) => {
                  const body = (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.thumbnail} alt="" draggable={false} loading="lazy" decoding="async" />
                      <span className={styles.personMeetingBody}>
                        <span className={styles.personMeetingTitle}>{m.title}</span>
                        <span className={styles.personMeetingMeta}>{m.meta}</span>
                      </span>
                    </>
                  )
                  return (
                    <li key={m.key}>
                      {/* 기수는 다른 도메인이라 새 탭 — LazyclubLink 는 내부 경로 전용 */}
                      {m.external ? (
                        <a
                          href={m.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.personMeetingItem}
                        >
                          {body}
                        </a>
                      ) : (
                        <LazyclubLink href={m.href} className={styles.personMeetingItem}>
                          {body}
                        </LazyclubLink>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>
      </main>
    </WorkroomShell>
  )
}
