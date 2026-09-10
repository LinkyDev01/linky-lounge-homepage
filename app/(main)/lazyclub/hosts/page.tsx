import type { Metadata } from "next"
import { WorkroomShell } from "../Shell"
import { LazyclubLink } from "../LazyclubLink"
import { BASE } from "../base-path"
import { HOSTS_CARDS, HOSTS_POSTER } from "./hosts-config"
import styles from "../home.module.css"
import h from "./hosts.module.css"

/**
 * 호스트 모집 — lazy-club.com/hosts (v4, 2026-09-10 이미지 베이스).
 *
 * 운영자 "최대한 이미지 베이스로만 하고, 그 외 내용은 배제해주고 보수적으로 표현하자. 너무 임의로 표현한
 * 부분이 많아선 안돼" — v3 의 옮겨 적은 텍스트·초안 단락(저희가 준비하는 것 / 이런 분 / 절차 / 지난 모임 /
 * 안내문)을 전부 걷어내고 **운영자 카드뉴스 5장을 그대로** 싣는다.
 *
 * 구도는 v3(모임 상세)와 같다: 좌 sticky 포스터(1장) · 우 카테고리 '레이지클럽' → 제목 → 잉크 칩 '기획서 쓰기'
 * (=모임 상세의 '구매하기' 자리, 기획서 폼은 승인된 기능이라 유지) · 하단 본문 컬럼(460)에 2~5장을 모임 상세의
 * 본문 이미지 문법(.nsqBodyImage, 간격 45)으로 세로 나열 · 끝에 기획서 텍스트 링크 하나.
 * 페이지가 만든 문장은 없다 — 제목은 2장 머리글('레이지 클럽'은 카테고리 줄로), alt 는 각 장 머리글 원문.
 * 레이아웃 클래스는 home.module.css 소비만(수정 0). 색인·사이트맵은 v3 그대로.
 */

export const metadata: Metadata = {
  title: "호스트 모집 — 레이지클럽",
  description: "레이지클럽 호스트를 모집합니다. 자신만의 뚜렷한 주제를 가지고 4회차의 모임을 이끌어주실 분을 찾고 있습니다.",
}

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
            <div className={styles.productActions}>
              <LazyclubLink href={`${BASE}/hosts/apply`} className={styles.chipBtn}>
                기획서 쓰기
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
              <p className={`${h.body} ${h.cta}`}>
                <LazyclubLink href={`${BASE}/hosts/apply`} className={h.ctaLink}>
                  기획서 쓰기
                  <svg className={h.ctaArrow} width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                    <path d="M1 7L7 1M7 1H2.5M7 1V5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </LazyclubLink>
              </p>
            </div>
          </section>
        </section>
      </main>
    </WorkroomShell>
  )
}
