import { LazyclubLink } from "../LazyclubLink"
import { ArrowIcon, WorkroomShell } from "../Shell"
// 서버 컴포넌트 — Shell("use client") 경유로 값을 받으면 프록시가 찍힌다 (base-path 직수입)
import { BASE } from "../base-path"
import { PEOPLE } from "../people-config"
import { HostIntro } from "../HostIntro"
import styles from "../home.module.css"

/**
 * 사람들 목록 (2026-08-21).
 *
 * 서식은 **기존 HostIntro 그대로** — 이름 제목 + 사진을 우측에 띄우고 약력이 그 옆으로
 * 흐르는 병렬 구조 (운영자 2026-08-21: "기존 레이아웃 서식 유지해야지. C안처럼 사진과
 * 병렬로 놔야해"). 목록에서는 약력이 CSS line-clamp 로 잘리고(데스크톱 7줄 / 모바일 5줄),
 * 전문은 카드를 눌러 들어가는 /people/[slug] 에서 본다.
 *
 * ⚠ 카드 전체 클릭은 **오버레이 링크**(.itemLink — 목록 카드의 기존 문법)로 건다.
 *   카드를 <a> 로 감싸면 약력 안의 링크와 앵커가 중첩돼 무효 HTML 이 되고, 브라우저가
 *   바깥 앵커를 조기 종료해 카드 뒷부분이 클릭되지 않는다.
 * ⚠ 말줄임은 별도 excerpt 필드 없이 본문을 그대로 렌더한 뒤 자른다 — excerpt 를 두면
 *   원고가 두 벌이 되어 갈라진다(단일 출처 원칙).
 */
export default function PeoplePage() {
  return (
    <WorkroomShell>
      <main className={styles.content}>
        <div className={styles.indexHead}>
          <div className={styles.sectionTitle}>
            <span>
              <span>사람</span>
              <ArrowIcon />
            </span>
          </div>
        </div>

        <ul className={styles.peopleGrid}>
          {PEOPLE.map((p) => (
            <li key={p.slug} className={styles.personCard}>
              <LazyclubLink
                href={`${BASE}/people/${p.slug}`}
                className={styles.itemLink}
                aria-label={`${p.name} 소개로 이동`}
              />
              <HostIntro photo={p.photo} name={p.name} instagram={p.instagram}>
                {p.bio}
                {/* 잘린 약력 아래 클릭 유도 — 실제 클릭은 카드 오버레이(.itemLink)가 받는다 */}
                <p className={styles.personCardMore}>더보기</p>
              </HostIntro>
            </li>
          ))}
        </ul>
      </main>
    </WorkroomShell>
  )
}
