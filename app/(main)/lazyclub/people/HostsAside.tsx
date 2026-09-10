import { LazyclubLink } from "../LazyclubLink"
import { ArrowIcon } from "../Shell"
import { BASE } from "../base-path"
import { HOSTS_CARD, HOSTS_CARD_POSTER } from "../hosts/hosts-config"
import styles from "../home.module.css"

/**
 * 사람 페이지 우측 '호스트' aside (운영자 확정 2026-09-10 "빈 프레임, 카드 2열") —
 * /meetings 의 ClubAside(currentOnly) 와 같은 구도.
 *   데스크톱(≥721): 좌 사람 카드 / 우 sticky aside (세로 괘선은 좌측 .meetings 가 긋는다)
 *   모바일(≤720):   aside 가 맨 위(.shopTrack 가로 트랙, 카드 하나라 도트 없음)
 * 카드 = 포스터(카드뉴스 1장) + 작은 글씨 '레이지클럽' + 제목 '호스트 모집 중' — 문구는 운영자 원문.
 * 카드 전체와 제목 '호스트 ↗' 가 /hosts 로 간다. 서버 컴포넌트(훅 없음).
 */
export function HostsAside() {
  return (
    <aside className={`${styles.shop} ${styles.shopCurrentOnly}`}>
      <div className={styles.sectionTitle}>
        <LazyclubLink href={`${BASE}/hosts`}>
          <span>호스트</span>
          <ArrowIcon />
        </LazyclubLink>
      </div>
      <div className={`${styles.shopList} ${styles.seasonList}`}>
        <div className={styles.shopTrack}>
          <article className={styles.shopItem}>
            <LazyclubLink href={`${BASE}/hosts`} className={styles.itemLink} aria-label="호스트 모집 안내로 이동" />
            <figure className={styles.shopFigure}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HOSTS_CARD_POSTER} alt="" draggable={false} loading="lazy" decoding="async" />
            </figure>
            <div className={styles.shopBody}>
              <div>
                <div className={styles.itemCat}>{HOSTS_CARD.cat}</div>
                <div className={styles.shopName}>{HOSTS_CARD.name}</div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </aside>
  )
}
