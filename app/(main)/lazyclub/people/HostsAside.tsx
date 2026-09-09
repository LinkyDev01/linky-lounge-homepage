"use client"

/**
 * 사람 페이지 우측 '모임장' aside — /meetings 의 ClubAside(currentOnly) 와 같은 구도.
 *   데스크톱(≥721): 좌 사람 카드 / 우 sticky aside (세로 괘선은 좌측 .meetings 가 긋는다)
 *   모바일(≤720):   aside 가 맨 위, 가로 스와이프(.shopTrack) + 도트
 * 진입점은 두 곳 — 섹션 제목 '모임장 ↗' 와 카드 아래 문장 링크. 둘 다 /hosts.
 *
 * 포스터 재료(운영자 결정 대기, preview 스위처):
 *   frame   — 빈 프레임(ph-gray). 아직 없는 모임의 자리 = 기획서 미리보기의 "포스터는 그때 함께 준비합니다" 와 같은 논리
 *   posters — 지금까지 열린 모임 포스터 9장(hosts/past-meetings). 데스크톱은 첫 장만, 모바일은 전부 스와이프
 *             (ClubAside currentOnly 와 같은 규칙 — .shopCurrentOnly .seasonPast)
 * 카드 문법은 .shopItem 그대로. 카드 자체는 링크가 아니다(지난 기수와 같은 처리) — 링크는 제목과 문장.
 */

import { LazyclubLink } from "../LazyclubLink"
import { ArrowIcon, BASE } from "../Shell"
import { useDragCarousel } from "../WorkroomHome"
import { PAST_MEETINGS } from "../hosts/past-meetings"
import styles from "../home.module.css"

export type HostsAsideVariant = "frame" | "posters"

export function HostsAside({ variant = "frame" }: { variant?: HostsAsideVariant }) {
  const slides = variant === "posters" ? PAST_MEETINGS : [null]
  const carousel = useDragCarousel(slides.length)

  return (
    <aside className={`${styles.shop} ${styles.shopCurrentOnly}`}>
      <div className={styles.sectionTitle}>
        <LazyclubLink href={`${BASE}/hosts`}>
          <span>모임장</span>
          <ArrowIcon />
        </LazyclubLink>
      </div>
      <div className={`${styles.shopList} ${styles.seasonList}`}>
        <div ref={carousel.trackRef} className={styles.shopTrack} onScroll={carousel.onScroll}>
          {slides.map((p, i) => (
            <article key={p ? p.src : "frame"} className={`${styles.shopItem} ${i > 0 ? styles.seasonPast : ""}`}>
              <figure className={styles.shopFigure}>
                {p && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.src} alt="" draggable={false} loading="lazy" decoding="async" />
                )}
              </figure>
              <div className={styles.shopBody}>
                <div>
                  <div className={styles.itemCat}>{p ? "지금까지 열린 모임" : "모집 중"}</div>
                  <div className={styles.shopName}>{p ? p.cap : "모임장"}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
        {slides.length > 1 && (
          <div className={styles.shopDots}>
            {slides.map((p, i) => (
              <button
                key={p ? p.src : "frame"}
                type="button"
                className={`${styles.dot} ${i === carousel.active ? styles.dotActive : ""}`}
                aria-label={`${i + 1}번째 포스터로 이동`}
                onClick={() => carousel.scrollTo(i)}
              />
            ))}
          </div>
        )}
      </div>
      <p className={styles.hostsAsideLead}>
        <LazyclubLink href={`${BASE}/hosts`} className={styles.hostsAsideLink}>
          레이지클럽의 이름으로 모임을 열어 주실 분을 찾습니다.
        </LazyclubLink>
      </p>
    </aside>
  )
}
