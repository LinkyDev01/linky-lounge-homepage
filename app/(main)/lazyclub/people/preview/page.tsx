import type { Metadata } from "next"
import { LazyclubLink } from "../../LazyclubLink"
import { ArrowIcon, WorkroomShell } from "../../Shell"
import { BASE } from "../../base-path"
import { PEOPLE } from "../../people-config"
import { HostIntro } from "../../HostIntro"
import { HostsAside, type HostsAsideVariant } from "../HostsAside"
import styles from "../../home.module.css"

/**
 * 프리뷰 — 사람 페이지에 모임장 aside 를 /meetings 구도(좌 목록 + 우 sticky)로 붙인 실배치.
 * 승인되면 people/page.tsx 로 옮기고 이 라우트는 지운다 (hosts/v2 와 같은 절차). noindex.
 * 스위처(쿼리): v=frame|posters (포스터 재료) · cols=2|1 (사람 카드 열 수)
 */
export const metadata: Metadata = {
  title: "사람 — 모임장 aside 프리뷰",
  robots: { index: false, follow: false },
}

const VARIANTS: { key: HostsAsideVariant; label: string }[] = [
  { key: "frame", label: "빈 프레임" },
  { key: "posters", label: "지난 포스터" },
]
const COLS = [
  { key: "2", label: "카드 2열" },
  { key: "1", label: "카드 1열" },
]

export default async function PeoplePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; cols?: string }>
}) {
  const sp = await searchParams
  const variant: HostsAsideVariant = sp.v === "posters" ? "posters" : "frame"
  const cols = sp.cols === "1" ? "1" : "2"
  const href = (v: string, c: string) => `${BASE}/people/preview?v=${v}&cols=${c}`

  return (
    <WorkroomShell>
      <main className={styles.content}>
        <p className={styles.previewSwitch}>
          {VARIANTS.map((o) => (
            <LazyclubLink key={o.key} href={href(o.key, cols)} className={o.key === variant ? styles.previewSwitchOn : ""}>
              {o.label}
            </LazyclubLink>
          ))}
          <span aria-hidden="true">|</span>
          {COLS.map((o) => (
            <LazyclubLink key={o.key} href={href(variant, o.key)} className={o.key === cols ? styles.previewSwitchOn : ""}>
              {o.label}
            </LazyclubLink>
          ))}
        </p>

        <div className={styles.textsShop}>
          <section className={`${styles.meetings} ${styles.peopleSplit} ${cols === "1" ? styles.peopleSplitOne : ""}`}>
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
                    <p className={styles.personCardMore}>더보기</p>
                  </HostIntro>
                </li>
              ))}
            </ul>
          </section>
          <HostsAside variant={variant} />
        </div>
      </main>
    </WorkroomShell>
  )
}
