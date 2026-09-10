import type { Metadata } from "next"
import { WorkroomShell } from "../../Shell"
import { LazyclubLink } from "../../LazyclubLink"
import { BASE } from "../../base-path"
import { HOSTS_CARDS, HOSTS_POSTER } from "../hosts-config"
import styles from "../../home.module.css"

/**
 * 호스트 모집 — 카드뉴스 이미지판 (/hosts/cards, 2026-09-10).
 * 운영자 "아까 네가 썼던건 프리뷰로만 배포(경로가 없고 누구나 볼 수 있는 페이지)" — 내비·푸터·사이트맵 어디서도
 * 링크하지 않고 noindex 만 건다(link-reveal 시안과 같은 처리). 실 /hosts 는 카드 원문을 텍스트로 옮긴 판.
 * 구도는 /hosts 와 같다: 좌 sticky 포스터(1장) · 우 카테고리·제목·칩 · 본문 컬럼에 2~5장 이미지(.nsqBodyImage).
 */

export const metadata: Metadata = {
  title: "호스트 모집 (카드뉴스) — 레이지클럽",
  robots: { index: false, follow: false },
}

export default function HostsCardsPage() {
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
            <div className={styles.productActions}>
              <LazyclubLink href={`${BASE}/hosts/apply`} className={styles.chipBtn}>
                호스트 지원
              </LazyclubLink>
            </div>
          </div>

          {/* 카드뉴스 2~5장 — 모임 상세 본문 이미지와 같은 자리·간격 */}
          <section className={styles.nsqBody}>
            <div className={styles.nsqBodyInner}>
              {HOSTS_CARDS.map((c) => (
                <figure key={c.src} className={styles.nsqBodyImage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.src} alt={c.alt} />
                </figure>
              ))}
              <div className={styles.productActions}>
                <LazyclubLink href={`${BASE}/hosts/apply`} className={styles.chipBtn}>
                  호스트 지원
                </LazyclubLink>
              </div>
            </div>
          </section>
        </section>
      </main>
    </WorkroomShell>
  )
}
