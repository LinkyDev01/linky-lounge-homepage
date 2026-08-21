import { LazydayLink } from "@/components/common/LazydayLink"
import { ArrowIcon, WorkroomShell } from "../Shell"
// 서버 컴포넌트 — Shell("use client") 경유로 값을 받으면 프록시가 찍힌다 (base-path 직수입)
import { BASE } from "../base-path"
import { PEOPLE } from "../people-config"
import { HostIntro } from "../HostIntro"
import { ONE_DAY_MEETINGS } from "../one-day-config"
import styles from "../home.module.css"

/**
 * 사람들 (2026-08-20 신설 — C안, 레퍼런스 p-i-e.kr/people).
 *
 * p-i-e 는 목록(카드 그리드) + 상세(sticky 사진) 2층 구조지만, 우리는 인원이 아직
 * 2명이라 카드 2장짜리 그리드가 빈약해 보인다 → **단층 스택**으로 합쳤다:
 * 모임 상세에서 검증된 HostIntro 서식을 그대로 세로로 쌓고, p-i-e 의 진짜 가치인
 * **역참조**(사람 → 그 사람이 진행하는 모임)만 가져온다.
 * 인원이 늘면 이 블록을 상세로, 목록을 카드 그리드로 쪼개면 그대로 p-i-e 구조가 된다.
 *
 * 원고·사진은 people-config 단일 출처 — 모임 상세와 같은 것을 읽는다.
 */
export default function PeoplePage() {
  return (
    <WorkroomShell>
      <main className={styles.content}>
        <div className={styles.indexHead}>
          <div className={styles.sectionTitle}>
            <span>
              <span>people</span>
              <ArrowIcon />
            </span>
          </div>
        </div>

        {PEOPLE.map((p) => {
          // 역참조 — hostSlug 가 지정된 모임만. 진행자 미확정 모임은 자연히 빠진다
          const meetings = ONE_DAY_MEETINGS.filter((m) => m.hostSlug === p.slug)
          return (
            // id = #gorden / #andongmin 딥링크 (scroll-margin-top 은 CSS 가 헤더 높이만큼)
            <section key={p.slug} id={p.slug} className={styles.personBlock}>
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
          )
        })}
      </main>
    </WorkroomShell>
  )
}
