import { notFound } from "next/navigation"
import { LazydayLink } from "@/components/common/LazydayLink"
import { ArrowIcon, WorkroomShell } from "../../Shell"
// 서버 컴포넌트 — Shell("use client") 경유로 값을 받으면 프록시가 찍힌다 (base-path 직수입)
import { BASE } from "../../base-path"
import { findPerson, PEOPLE } from "../../people-config"
import { HostIntro } from "../../HostIntro"
import { ONE_DAY_MEETINGS } from "../../one-day-config"
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

  // hostSlug 가 지정된 모임만. 진행자 미확정 모임은 자연히 빠진다
  const meetings = ONE_DAY_MEETINGS.filter((m) => m.hostSlug === p.slug)

  return (
    <WorkroomShell>
      <main className={styles.content}>
        <div className={styles.indexHead}>
          <div className={styles.sectionTitle}>
            <LazydayLink href={`${BASE}/people`}>
              <span>people</span>
              <ArrowIcon />
            </LazydayLink>
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
                {meetings.map((m) => (
                  <li key={m.slug}>
                    <LazydayLink href={`${BASE}/meetings/${m.slug}`} className={styles.personMeetingItem}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.thumbnail} alt="" draggable={false} />
                      <span className={styles.personMeetingBody}>
                        <span className={styles.personMeetingTitle}>{m.title}</span>
                        <span className={styles.personMeetingMeta}>
                          {m.date}
                          {m.status !== "open" && ` · ${m.status === "soldout" ? "마감" : "오픈 예정"}`}
                        </span>
                      </span>
                    </LazydayLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </WorkroomShell>
  )
}
