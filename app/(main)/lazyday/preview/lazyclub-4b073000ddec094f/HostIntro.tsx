import styles from "./home.module.css"

/** 진행자 소개 공용 서식 — 운영자 카드뉴스 원본 레이아웃 그대로 (2026-08-20 확정):
 *  이름이 큰 제목 → 사진은 **우측**에 띄우고 본문이 그 왼쪽을 감싸 흐름(float) →
 *  인스타 핸들은 약력 끝줄.
 *  ⚠ 사진(figure)이 이름·본문보다 **소스 순서상 먼저** 와야 float 감김이 성립한다.
 *  ⚠ 사진은 비율 0.6933(400×577) 고정 — clip-path 가 bbox 백분율이라 비율이 다르면
 *    '오려낸' 모양이 일그러진다 (home.module.css .nsqHostPhoto img 주석 참조).
 *  약력(children)은 운영자 원문 그대로 — 한 글자도 편집하지 않는다.
 *
 *  2026-08-20 공용 파일로 승격: 모임 상세(meetings/[slug])와 사람들 페이지(/people)가
 *  같은 서식을 쓰도록 — 한쪽에서만 고치면 서식이 갈라진다. */
export function HostIntro({
  photo,
  name,
  instagram,
  children,
}: {
  photo: string
  name: string
  /** @ 없는 핸들만 — 표시는 @핸들, 링크는 instagram.com/핸들 */
  instagram: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.nsqHostRow}>
      <figure className={styles.nsqHostPhoto}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={name} />
      </figure>
      <p className={styles.nsqHostName}>{name}</p>
      <div className={styles.nsqHostText}>
        {children}
        <p className={styles.nsqHostHandle}>
          <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer">
            @{instagram}
          </a>
        </p>
      </div>
    </div>
  )
}
