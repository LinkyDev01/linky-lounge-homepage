import { LazydayLink } from "@/components/common/LazydayLink"
import { ArrowIcon, WorkroomShell } from "../Shell"
// 서버 컴포넌트 — Shell("use client") 경유로 값을 받으면 프록시가 찍힌다 (base-path 직수입)
import { BASE } from "../base-path"
import { PEOPLE } from "../people-config"
import styles from "../home.module.css"

/**
 * 사람들 목록 (2026-08-21 — C안 단층 스택에서 **B안(목록+전용 페이지)으로 승격**).
 * 운영자: "이미지 밑에 있는 텍스트 p-i-e 페이지처럼 바로 안 보이면 좋겠어.
 *          클릭해야 전체 페이지로서 보이게. 문장 잘리면 … 형태로"
 *
 * 카드 = 사진 + 이름 + **약력 말줄임**. 전문은 /people/[slug] 에서만 본다.
 * ⚠ 말줄임은 별도 excerpt 필드를 만들지 않고 **본문을 그대로 렌더한 뒤 CSS line-clamp**
 *   로 자른다 — excerpt 를 따로 두면 원고가 두 벌이 되어 갈라진다(단일 출처 원칙).
 *   카드 안 링크는 CSS 에서 pointer-events:none 이라 카드 전체 클릭을 가로채지 않는다.
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

        <ul className={styles.peopleGrid}>
          {PEOPLE.map((p) => (
            <li key={p.slug} className={styles.peopleGridItem}>
              <LazydayLink href={`${BASE}/people/${p.slug}`} className={styles.personCard}>
                <figure className={styles.personCardPhoto}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo} alt={p.name} draggable={false} />
                </figure>
                <p className={styles.personCardName}>{p.name}</p>
                <div className={styles.personCardBio}>{p.bio}</div>
              </LazydayLink>
            </li>
          ))}
        </ul>
      </main>
    </WorkroomShell>
  )
}
